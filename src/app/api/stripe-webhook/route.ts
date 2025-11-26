
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.deleted',
]);

export const runtime = 'nodejs';

async function getRawBody(req: Request): Promise<Buffer> {
    const reader = req.body?.getReader();
    if (!reader) {
        throw new Error('Could not get reader from request body');
    }
    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
    }
    return Buffer.concat(chunks);
}

const manageSubscriptionStatusChange = async (subscriptionId: string, userId: string) => {
    const { firestore } = getFirebaseServer();
    const agentRef = doc(firestore, 'agents', userId);
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price.product']
    });

    const priceId = subscription.items.data[0].price.id;
    const plan = priceId === (process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) 
        ? 'corretor' 
        : 'imobiliaria';
    
    const subscriptionData = {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer,
        status: subscription.status,
        plan: plan,
        stripePriceId: priceId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };

    await updateDoc(agentRef, subscriptionData);
    console.log(`Updated plan for user ${userId} to ${plan} with status ${subscription.status}`);
};


export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!;
  const body = await getRawBody(req);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    if (!sig || !webhookSecret) {
        console.error('Webhook secret or signature not found.');
        return new NextResponse('Webhook secret not configured.', { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }
  
  if (!relevantEvents.has(event.type)) {
      return new NextResponse('Webhook event not relevant.', { status: 200 });
  }

  const { firestore } = getFirebaseServer();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription;
        
        if (!userId || !subscriptionId) {
            console.error('Missing userId or subscriptionId in checkout session');
            break;
        }

        // Store customer mapping
        const customerId = session.customer as string;
        const customerRef = doc(firestore, 'customers', userId);
        await setDoc(customerRef, {
            userId: userId,
            stripeCustomerId: customerId,
        }, { merge: true });

        // Handle subscription and update user plan
        await manageSubscriptionStatusChange(subscriptionId as string, userId);
        break;
      }
      
       case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const { firestore } = getFirebaseServer();
          const agentRef = doc(firestore, 'agents', subscription.metadata.userId);
          await updateDoc(agentRef, { plan: 'corretor', stripeSubscriptionStatus: 'canceled' });
          console.log(`Subscription deleted for user ${subscription.metadata.userId}. Reverted to 'corretor' plan.`);
          break;
      }
      
      default:
        console.log(`Unhandled relevant event type ${event.type}`);
    }
  } catch (err) {
    console.error('Error processing webhook', err);
    return new NextResponse('Webhook handler failed. See logs.', { status: 500 });
  }

  return new NextResponse('ok', { status: 200 });
}
