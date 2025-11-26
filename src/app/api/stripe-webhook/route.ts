
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey || !webhookSecret) {
  console.error("CRITICAL: Stripe keys are not configured.");
}

const stripe = new Stripe(stripeSecretKey!, { apiVersion: '2024-06-20' });

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.deleted',
  'customer.subscription.updated',
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

const manageSubscriptionChange = async (subscriptionId: string) => {
    const { firestore } = getFirebaseServer();
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer']
    });

    const customer = subscription.customer as Stripe.Customer;
    const customerDocSnap = await getDoc(doc(firestore, 'customers', customer.id));

    if (!customerDocSnap.exists()) {
        console.error(`Customer document not found for Stripe customer ID: ${customer.id}`);
        return;
    }

    const userId = customerDocSnap.data().userId;
    if (!userId) {
        console.error(`userId not found in customer document for Stripe customer ID: ${customer.id}`);
        return;
    }
    
    const agentRef = doc(firestore, 'agents', userId);

    const priceId = subscription.items.data[0].price.id;
    const plan = priceId === (process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) 
        ? 'corretor' 
        : 'imobiliaria';
    
    const subscriptionData = {
        plan: plan,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer,
        stripePriceId: priceId,
        stripeSubscriptionStatus: subscription.status,
    };

    await updateDoc(agentRef, subscriptionData);
    console.log(`Updated plan for user ${userId} to ${plan} with status ${subscription.status}`);
};


export async function POST(req: Request) {
  if (!stripeSecretKey || !webhookSecret) {
    return new NextResponse('Stripe keys not configured.', { status: 500 });
  }

  const sig = req.headers.get('stripe-signature')!;
  const body = await getRawBody(req);

  let event: Stripe.Event;
  try {
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
        
        if (!userId || !session.customer || !session.subscription) {
            console.error('Missing userId, customerId or subscriptionId in checkout session');
            break;
        }

        // Store customer mapping right away
        const customerRef = doc(firestore, 'customers', session.customer as string);
        await setDoc(customerRef, {
            userId: userId,
            stripeCustomerId: session.customer,
        }, { merge: true });
        console.log(`Customer mapping created for userId ${userId}`);

        // Handle subscription and update user plan
        await manageSubscriptionChange(session.subscription as string);
        break;
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await manageSubscriptionChange(subscription.id);
          break;
      }
      
      default:
        console.log(`Unhandled relevant event type ${event.type}`);
    }
  } catch (err: any) {
    console.error('Error processing webhook:', err.message, err.stack);
    return new NextResponse('Webhook handler failed. See logs.', { status: 500 });
  }

  return new NextResponse('ok', { status: 200 });
}
