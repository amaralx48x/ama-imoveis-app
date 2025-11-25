
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, updateDoc, collection, addDoc, getDoc } from 'firebase/firestore';

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
        
        if (userId && customerId) {
            const customerRef = doc(firestore, 'customers', userId);
            // Sync Stripe customer ID with Firestore customer doc
             await updateDoc(customerRef, { stripeId: customerId });
        }
        console.log('Checkout session completed for user', userId);
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata.userId;
          const priceId = subscription.items.data[0].price.id;
          
          if (userId) {
              const agentRef = doc(firestore, 'agents', userId);
              const plan = priceId === 'price_1SXSRf2K7btqnPDwReiW165r' ? 'corretor' : 'imobiliaria';
              await updateDoc(agentRef, { plan });
          }
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
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    console.error('Erro processando webhook', err);
  }

  return new NextResponse('ok', { status: 200 });
}
