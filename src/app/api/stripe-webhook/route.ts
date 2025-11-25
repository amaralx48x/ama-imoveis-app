import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
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
        const customerId = session.customer as string;
        
        if (!userId || !customerId) {
            console.error('Missing userId or customerId in checkout session');
            break;
        }

        // Create a record in the /customers/{userId} collection
        const customerRef = doc(firestore, 'customers', userId);
        await setDoc(customerRef, {
            userId: userId,
            stripeCustomerId: customerId,
        }, { merge: true });
        
        console.log('Customer record created/updated for user', userId);
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          // Find the user by their Stripe customer ID
          const customersRef = collection(firestore, 'customers');
          const q = query(customersRef, where('stripeCustomerId', '==', customerId));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
              console.error(`Customer with stripeId ${customerId} not found.`);
              break;
          }

          const userId = querySnapshot.docs[0].id;
          const priceId = subscription.items.data[0].price.id;

          if (userId) {
              const agentRef = doc(firestore, 'agents', userId);
              
              // Map Stripe Price IDs to your application's plan names
              const plan = priceId === (process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || 'price_1SXSRf2K7btqnPDwReiW165r') 
                ? 'corretor' 
                : 'imobiliaria';
              
              await updateDoc(agentRef, { plan: plan, stripeSubscriptionStatus: subscription.status });
              console.log(`Updated plan for user ${userId} to ${plan} with status ${subscription.status}`);
          }
          break;
      }
       case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const customersRef = collection(firestore, 'customers');
          const q = query(customersRef, where('stripeCustomerId', '==', customerId));
          const querySnapshot = await getDocs(q);
           if (querySnapshot.empty) {
              console.error(`Customer with stripeId ${customerId} not found.`);
              break;
          }
           const userId = querySnapshot.docs[0].id;
            if (userId) {
              const agentRef = doc(firestore, 'agents', userId);
              await updateDoc(agentRef, { plan: 'corretor', stripeSubscriptionStatus: 'canceled' });
              console.log(`Subscription deleted for user ${userId}. Reverted to 'corretor' plan.`);
            }
          break;
      }
      
      default:
        console.log(`Unhandled relevant event type ${event.type}`);
    }
  } catch (err) {
    console.error('Erro processando webhook', err);
    return new NextResponse('Webhook handler failed. See logs.', { status: 500 });
  }

  return new NextResponse('ok', { status: 200 });
}
