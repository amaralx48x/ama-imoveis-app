'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, getDoc } from 'firebase/firestore';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { agentId } = await req.json();

  if (!agentId) {
    return NextResponse.json({ error: 'ID do agente é obrigatório' }, { status: 400 });
  }

  try {
    const { firestore } = getFirebaseServer();
    
    // Busca os dados do agente
    const agentRef = doc(firestore, 'agents', agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
    }

    const agentData = agentSnap.data();
    const agentEmail = agentData.email;
    const agentPin = agentData.pin || '0000'; 

    if (!agentEmail) {
      return NextResponse.json({ error: 'O agente não possui um e-mail cadastrado.' }, { status: 400 });
    }

    // Usar o e-mail fornecido como remetente, com um fallback seguro.
    const fromAddress = 'AMA Imobi <amaralx48@gmail.com>';

    try {
      await resend.emails.send({
        from: fromAddress,
        to: [agentEmail],
        subject: 'Lembrete de PIN - AMA Imobi',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Lembrete de Senha (PIN)</h2>
            <p>Olá, ${agentData.displayName || 'usuário'},</p>
            <p>Você solicitou um lembrete de sua senha de acesso ao painel da AMA Imobi.</p>
            <p>Seu PIN é: <strong style="font-size: 20px; letter-spacing: 2px;">${agentPin}</strong></p>
            <p>Caso não tenha solicitado, por favor, ignore este e-mail.</p>
            <br>
            <p>Atenciosamente,</p>
            <p><strong>Equipe AMA Imobi</strong></p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Erro ao enviar e-mail pelo Resend:", emailError);
      return NextResponse.json({ error: 'Falha no serviço de envio de e-mail.' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Se um e-mail estiver associado a esta conta, um lembrete de PIN foi enviado.' });

  } catch (error) {
    console.error('Erro geral na API forgot-pin:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
