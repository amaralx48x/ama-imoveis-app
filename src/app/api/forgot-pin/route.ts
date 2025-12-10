
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("CRITICAL: RESEND_API_KEY is not set in the environment.");
    return NextResponse.json({ error: 'O serviço de e-mail não está configurado no servidor.' }, { status: 500 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: 'O e-mail é obrigatório.' }, { status: 400 });
  }

  try {
    const { firestore } = getFirebaseServer();
    const agentsRef = collection(firestore, 'agents');
    const q = query(agentsRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Para não revelar se um e-mail existe ou não, retornamos uma mensagem genérica de sucesso.
      console.log(`Solicitação de lembrete de PIN para e-mail não cadastrado: ${email}`);
      return NextResponse.json({ message: 'Se um e-mail estiver associado a esta conta, um lembrete de PIN foi enviado.' });
    }

    const agentDoc = querySnapshot.docs[0];
    const agentData = agentDoc.data();
    const agentPin = agentData.pin || '0000'; // PIN padrão
    const agentName = agentData.displayName || 'usuário';

    const fromAddress = 'AMA Imobi <onboarding@resend.dev>';
    
    // Usando fetch diretamente na API do Resend
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
            from: fromAddress,
            to: [email],
            subject: 'Lembrete de PIN de Acesso - AMA Imobi',
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Lembrete de Senha (PIN)</h2>
                <p>Olá, ${agentName},</p>
                <p>Você solicitou um lembrete da sua senha de acesso (PIN de 4 dígitos) para o painel da AMA Imobi.</p>
                <p>Seu PIN é: <strong style="font-size: 20px; letter-spacing: 2px; color: #8A2BE2;">${agentPin}</strong></p>
                <p>Utilize este PIN para acessar o sistema selecionando seu usuário na tela de login.</p>
                <p>Caso não tenha solicitado, por favor, ignore este e-mail.</p>
                <br>
                <p>Atenciosamente,</p>
                <p><strong>Equipe AMA Imobi</strong></p>
              </div>
            `,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('Resend API Error:', data);
        throw new Error(data.message || 'Falha ao enviar o e-mail através do serviço.');
    }
    
    return NextResponse.json({ message: 'Se um e-mail estiver associado a esta conta, um lembrete de PIN foi enviado.' });

  } catch (error: any) {
    console.error('Erro na API forgot-pin:', error);
    return NextResponse.json({ error: error.message || 'Ocorreu um erro interno ao tentar enviar o e-mail de lembrete.' }, { status: 500 });
  }
}

    