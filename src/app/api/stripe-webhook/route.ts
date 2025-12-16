
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, updateDoc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Agent, Customer } from '@/lib/data';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey || !webhookSecret) {
  console.error("CRITICAL: Stripe keys are not configured.");
}

const stripe = new Stripe(stripeSecretKey!, { apiVersion: '2024-06-20' });

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.deleted',
  'customer.subscription.updated',
  'customer.subscription.created',
]);

const manageSubscriptionChange = async (subscription: Stripe.Subscription) => {
    const { firestore } = getFirebaseServer();
    const customerId = subscription.customer as string;

    const customersRef = collection(firestore, 'customers');
    const q = query(customersRef, where('stripeCustomerId', '==', customerId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.error(`Webhook Error: Customer not found for Stripe customer ID: ${customerId}`);
        return;
    }
    
    const customerDoc = querySnapshot.docs[0];
    const userId = customerDoc.data().userId;

    if (!userId) {
        console.error(`Webhook Error: userId not found in customer document for Stripe customer ID: ${customerId}`);
        return;
    }

    const agentRef = doc(firestore, 'agents', userId);
    const priceId = subscription.items.data[0].price.id;

    let plan: 'simples' | 'essencial' | 'impulso' | 'expansao' = 'simples';
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLANO1_PRICE_ID) plan = 'simples';
    else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLANO2_PRICE_ID) plan = 'essencial';
    else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLANO3_PRICE_ID) plan = 'impulso';
    else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLANO4_PRICE_ID) plan = 'expansao';
    else {
        console.error(`Webhook Error: Unrecognized priceId ${priceId} for userId ${userId}`);
        return;
    }

    const agentUpdateData = {
        plan: plan,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        stripeSubscriptionStatus: subscription.status,
    };

    await updateDoc(agentRef, agentUpdateData);
    
    const userSubscriptionRef = doc(firestore, `customers/${userId}/subscriptions`, subscription.id);
    const subscriptionData = {
        id: subscription.id,
        userId: userId,
        status: subscription.status,
        priceId: priceId,
        metadata: subscription.metadata,
        cancel_at_period_end: subscription.cancel_at_period_end,
        created: subscription.created,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        ended_at: subscription.ended_at,
        canceled_at: subscription.canceled_at,
    };
    await setDoc(userSubscriptionRef, subscriptionData, { merge: true });

    console.log(`✅ Webhook: Updated plan for user ${userId} to ${plan} with status ${subscription.status}`);
};

export async function POST(req: Request) {
  if (!stripeSecretKey || !webhookSecret) {
    return new NextResponse('Stripe keys not configured on the server.', { status: 500 });
  }

  const sig = req.headers.get('stripe-signature')!;
  let body;
  try {
    // Use req.text() and Buffer.from() for robust raw body parsing
    const rawBody = await req.text();
    body = Buffer.from(rawBody, 'utf8');
  } catch (err) {
    return new NextResponse('Could not read request body.', { status: 400 });
  }
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed.', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }
  
  if (!relevantEvents.has(event.type)) {
      return new NextResponse('Webhook event not relevant.', { status: 200 });
  }

  try {
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;
            const customerId = session.customer as string;

            if (session.mode === 'subscription') {
                const subscriptionId = session.subscription as string;
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                
                if (!userId) {
                     console.error('❌ Webhook Error: Missing userId in checkout session metadata.');
                     break;
                }
                
                const customerRef = doc(getFirebaseServer().firestore, 'customers', userId);
                await setDoc(customerRef, {
                    userId: userId,
                    stripeCustomerId: customerId,
                }, { merge: true });
                console.log(`✅ Webhook: Customer mapping created for userId ${userId}`);

                await manageSubscriptionChange(subscription);
            }
            break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            await manageSubscriptionChange(subscription);
            break;
        }
      
        default:
            console.log(`ℹ️ Unhandled relevant event type ${event.type}`);
    }
  } catch (err: any) {
    console.error('❌ Error processing webhook:', err.message, err.stack);
    return new NextResponse('Webhook handler failed. See server logs.', { status: 500 });
  }

  return new NextResponse('ok', { status: 200 });
}
