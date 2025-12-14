
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey || !webhookSecret) {
  console.error("CRITICAL: Stripe keys are not configured.");
}

const stripe = new Stripe(stripeSecretKey!, { apiVersion: '2024-06-20' });

// Define o runtime como nodejs para maior compatibilidade com streams
export const runtime = 'nodejs';


const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.deleted',
  'customer.subscription.updated',
]);


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

const manageSubscriptionChange = async (subscriptionId: string, customerId: string) => {
    const { firestore } = getFirebaseServer();
    
    // O customerId do Stripe é usado para encontrar o nosso customer document, que contém o userId
    const customerDocRef = doc(firestore, 'customers', customerId);
    const customerDocSnap = await getDoc(customerDocRef);
    
    if (!customerDocSnap.exists()) {
        console.error(`Webhook Error: Customer document not found for Stripe customer ID: ${customerId}`);
        return; // Early exit if we can't find the user
    }
    
    const userId = customerDocSnap.data()?.userId;
    if (!userId) {
        console.error(`Webhook Error: userId not found in customer document for Stripe customer ID: ${customerId}`);
        return;
    }
    
    // Com o userId, podemos atualizar o documento do agente
    const agentRef = doc(firestore, 'agents', userId);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0].price.id;

    let plan: 'simples' | 'essencial' | 'impulso' | 'expansao' = 'simples'; // Default to basic plan
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLANO1_PRICE_ID) plan = 'simples';
    else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLANO2_PRICE_ID) plan = 'essencial';
    else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLANO3_PRICE_ID) plan = 'impulso';
    else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLANO4_PRICE_ID) plan = 'expansao';
    else {
        console.error(`Webhook Error: Unrecognized priceId ${priceId} for userId ${userId}`);
        return; 
    }
    
    const subscriptionData = {
        plan: plan,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer,
        stripePriceId: priceId,
        stripeSubscriptionStatus: subscription.status,
    };

    await updateDoc(agentRef, subscriptionData);
    console.log(`✅ Webhook: Updated plan for user ${userId} to ${plan} with status ${subscription.status}`);
};


export async function POST(req: Request) {
  if (!stripeSecretKey || !webhookSecret) {
    return new NextResponse('Stripe keys not configured on the server.', { status: 500 });
  }

  const sig = req.headers.get('stripe-signature')!;
  const body = await getRawBody(req);

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
        const subscriptionId = session.subscription as string;
        
        if (!userId || !customerId || !subscriptionId) {
            console.error('❌ Webhook Error: Missing userId, customerId, or subscriptionId in checkout session.', { metadata: session.metadata });
            break; // Stop processing this event
        }

        // Criar o mapeamento customerId -> userId no Firestore
        const customerRef = doc(getFirebaseServer().firestore, 'customers', customerId);
        await setDoc(customerRef, {
            userId: userId,
            stripeCustomerId: customerId,
        }, { merge: true });
        console.log(`✅ Webhook: Customer mapping created for userId ${userId}`);

        // Chamar a função que gerencia a mudança de assinatura
        await manageSubscriptionChange(subscriptionId, customerId);
        break;
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          // Usa o customerId para encontrar o userId e atualizar o plano
          await manageSubscriptionChange(subscription.id, customerId);
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
