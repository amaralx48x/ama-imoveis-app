import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const { userId, priceId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
  }

  if (!priceId) {
    return NextResponse.json({ error: 'ID do preço é obrigatório.' }, { status: 400 });
  }

  const { firestore } = getFirebaseServer();

  try {
    const agentRef = doc(firestore, 'agents', userId);
    const agentSnap = await getDoc(agentRef);
    let customerId;

    if (agentSnap.exists() && agentSnap.data().stripeCustomerId) {
      customerId = agentSnap.data().stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: agentSnap.exists() ? agentSnap.data().email : undefined,
        name: agentSnap.exists() ? agentSnap.data().displayName : undefined,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/assinatura/cancelado`,
      metadata: {
        userId: userId,
      }
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Não foi possível criar a sessão de checkout.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Erro na criação do checkout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
