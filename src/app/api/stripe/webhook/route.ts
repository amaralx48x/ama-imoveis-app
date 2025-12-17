import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey || !webhookSecret) {
  console.error('Stripe keys are not configured.');
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

async function manageSubscriptionChange(subscription: Stripe.Subscription) {
  const { firestore } = getFirebaseServer();
  const customerId = subscription.customer as string;

  // Use a collection group query to find the agent by stripeCustomerId regardless of which agent doc it is.
  // This is more robust than querying a specific 'customers' collection.
  const agentsQuery = query(collection(firestore, 'agents'), where('stripeCustomerId', '==', customerId));
  const querySnapshot = await getDocs(agentsQuery);

  if (querySnapshot.empty) {
    console.error(`Customer not found for Stripe customer ID: ${customerId}`);
    return;
  }

  const agentDoc = querySnapshot.docs[0];
  const userId = agentDoc.id;

  if (!userId) {
    console.error(`userId not found for Stripe customer ID: ${customerId}`);
    return;
  }

  const agentRef = doc(firestore, 'agents', userId);
  const priceId = subscription.items.data[0].price.id;

  let plan: 'simples' | 'essencial' | 'impulso' | 'expansao' = 'simples';

  // NOTE: You must have these environment variables set for the plan mapping to work.
  if (priceId === process.env.STRIPE_PRICE_ID_ESSENCIAL) plan = 'essencial';
  else if (priceId === process.env.STRIPE_PRICE_ID_IMPULSO) plan = 'impulso';
  else if (priceId === process.env.STRIPE_PRICE_ID_EXPANSAO) plan = 'expansao';
  else if (priceId === process.env.STRIPE_PRICE_ID_SIMPLES) plan = 'simples';
  else {
    console.error(`Unrecognized priceId ${priceId} for userId ${userId}. Falling back to 'simples' plan.`);
    // Default to simples if no match is found to avoid breaking the app.
    plan = 'simples';
  }

  await updateDoc(agentRef, {
    plan,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    stripePriceId: priceId,
    stripeSubscriptionStatus: subscription.status,
  });

  // Also save the subscription details in a subcollection for history/auditing
  const userSubscriptionRef = doc(firestore, `agents/${userId}/subscriptions`, subscription.id);
  await setDoc(
    userSubscriptionRef,
    {
      id: subscription.id,
      userId,
      status: subscription.status,
      priceId,
      metadata: subscription.metadata,
      cancel_at_period_end: subscription.cancel_at_period_end,
      created: subscription.created,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      ended_at: subscription.ended_at,
      canceled_at: subscription.canceled_at,
    },
    { merge: true }
  );

  console.log(`Subscription updated for user ${userId} with plan ${plan}`);
}

export async function POST(req: Request) {
  if (!stripeSecretKey || !webhookSecret) {
    console.error('Stripe secret key or webhook secret is not configured.');
    return new NextResponse('Webhook Error: Server configuration error.', { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new NextResponse('Missing Stripe signature.', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.mode !== 'subscription') {
            break;
          }
          const userId = session.metadata?.userId;
          if (!userId) {
            throw new Error('Missing userId in checkout session metadata.');
          }

          // Link customer ID to agent
          const { firestore } = getFirebaseServer();
          const agentRef = doc(firestore, 'agents', userId);
          await updateDoc(agentRef, { stripeCustomerId: session.customer });
          
          // Retrieve the full subscription object to handle it
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await manageSubscriptionChange(subscription);
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
          throw new Error(`Unhandled relevant event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new NextResponse('Webhook handler failed. See logs.', { status: 500 });
    }
  }

  // Return a 200 OK response to Stripe to acknowledge receipt of the event
  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
