// src/app/api/stripe-webhook/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export const runtime = 'nodejs'; // garante runtime node para leitura do raw body

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

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const { firestore } = getFirebaseServer();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        
        if (userId && customerId && subscriptionId) {
            const customerRef = doc(firestore, 'customers', userId);
            await setDoc(customerRef, {
                userId: userId,
                stripeCustomerId: customerId,
            }, { merge: true });

            const subscriptionRef = doc(customerRef, 'subscriptions', subscriptionId as string);
            await setDoc(subscriptionRef, {
                userId: userId,
                status: 'active', // Ou o status vindo da assinatura
                stripeSubscriptionId: subscriptionId,
                priceId: session.line_items?.data[0].price?.id,
                // ... mais detalhes da assinatura
            }, { merge: true });

            // Atualizar o plano do usuário no 'agents'
            const priceId = session.line_items?.data[0].price?.id;
            const newPlan = priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PLUS ? 'corretor' : 'imobiliaria';
            const agentRef = doc(firestore, 'agents', userId);
            await updateDoc(agentRef, { plan: newPlan });

        }
        console.log('checkout.session.completed for user', userId);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription;
        console.log('invoice.paid for subscription', subscriptionId);
        // Atualize seu banco: liberar acesso, marcar data de renovação, etc.
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('invoice.payment_failed', invoice);
        // notificações, suspender acesso, etc.
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        // atualize status no seu DB
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    console.error('Erro processando webhook', err);
  }

  return new NextResponse('ok', { status: 200 });
}
