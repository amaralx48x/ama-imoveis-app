import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Desativa o body parser padrão do Next.js para ter acesso ao corpo raw
export const config = {
  api: {
    bodyParser: false,
  },
};

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.deleted',
  'customer.subscription.updated'
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET não está configurado.');
    return NextResponse.json({ error: 'Webhook secret não configurado.' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️  Erro na verificação da assinatura do webhook: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      const { firestore } = getFirebaseServer();

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) throw new Error('userId ausente nos metadados da sessão.');

        // Salva/Atualiza o customerId no documento do agente
        const agentRef = doc(firestore, 'agents', userId);
        await updateDoc(agentRef, { stripeCustomerId: customerId });

        // Recupera a assinatura completa para ter todos os detalhes
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Salva os dados da assinatura na subcoleção do agente
        const subscriptionRef = doc(firestore, `agents/${userId}/subscriptions`, subscription.id);
        await setDoc(subscriptionRef, {
          userId: userId,
          customerId: customerId,
          subscriptionId: subscription.id,
          status: subscription.status,
          priceId: subscription.items.data[0].price.id,
          createdAt: serverTimestamp(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        }, { merge: true });
        
         await updateDoc(agentRef, { plan: 'essencial' });

      } else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Precisamos encontrar o userId a partir do customerId
        // Esta é uma limitação e pode ser melhorada se o userId estiver nos metadados da assinatura
        const agentQuery = (await firestore.collection('agents').where('stripeCustomerId', '==', customerId).get());
        if (!agentQuery.empty) {
            const agentDoc = agentQuery.docs[0];
            const userId = agentDoc.id;

            const subscriptionRef = doc(firestore, `agents/${userId}/subscriptions`, subscription.id);
            await setDoc(subscriptionRef, {
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            }, { merge: true });

            if (subscription.status !== 'active') {
                await updateDoc(doc(firestore, 'agents', userId), { plan: 'simples' });
            }
        }
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return NextResponse.json({ error: 'Erro interno no webhook handler.' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}