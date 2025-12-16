
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { adminConfig } from '@/firebase/server-config';

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp(adminConfig);
} else {
  adminApp = getApps()[0];
}
const adminDb = getFirestore(adminApp);

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
  const customerId = subscription.customer as string;

  const customersRef = adminDb.collection('customers');
  const q = customersRef.where('stripeCustomerId', '==', customerId);
  const querySnapshot = await q.get();

  if (querySnapshot.empty) {
    console.error(`Customer not found for Stripe customer ID: ${customerId}`);
    return;
  }

  const customerDoc = querySnapshot.docs[0];
  const userId = customerDoc.data().userId;

  if (!userId) {
    console.error(`userId not found for Stripe customer ID: ${customerId}`);
    return;
  }

  const agentRef = adminDb.collection('agents').doc(userId);
  const priceId = subscription.items.data[0].price.id;

  let plan: 'simples' | 'essencial' | 'impulso' | 'expansao' = 'simples';

  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLANO1_PRICE_ID) plan = 'simples';
  else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLANO2_PRICE_ID) plan = 'essencial';
  else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLANO3_PRICE_ID) plan = 'impulso';
  else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLANO4_PRICE_ID) plan = 'expansao';
  else {
    console.error(`Unrecognized priceId ${priceId} for userId ${userId}`);
    return;
  }

  await agentRef.update({
    plan,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    stripePriceId: priceId,
    stripeSubscriptionStatus: subscription.status,
  });

  const userSubscriptionRef = adminDb.collection(`customers/${userId}/subscriptions`).doc(subscription.id);

  await userSubscriptionRef.set(
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
    return new NextResponse('Stripe keys not configured.', { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new NextResponse('Missing Stripe signature.', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    const bodyBuffer = Buffer.from(rawBody, 'utf8');
    event = stripe.webhooks.constructEvent(bodyBuffer, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new NextResponse('Invalid webhook signature.', { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    return new NextResponse('Event ignored.', { status: 200 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== 'subscription') break;

        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.error('Missing userId in checkout session metadata.');
          break;
        }
        
        const customerRef = adminDb.collection('customers').doc(userId);

        await customerRef.set(
          { userId, stripeCustomerId: customerId },
          { merge: true }
        );

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
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
    }
  } catch (err: any) {
    console.error('Error processing webhook:', err.message);
    return new NextResponse('Webhook processing failed.', { status: 500 });
  }

  return new NextResponse('ok', { status: 200 });
}
