
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, getDoc } from 'firebase/firestore';
import { Resend } from 'resend';

// Verifica se a chave da API do Resend está definida no ambiente do servidor
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error("CRITICAL: RESEND_API_KEY is not set in the environment.");
}
const resend = new Resend(resendApiKey);

export async function POST(req: NextRequest) {
  // Verificação dupla para garantir que a chave esteja disponível no momento da execução
  if (!resendApiKey) {
    return NextResponse.json({ error: 'O serviço de e-mail não está configurado no servidor.' }, { status: 500 });
  }

  const { agentId } = await req.json();

  if (!agentId) {
    return NextResponse.json({ error: 'ID do agente é obrigatório' }, { status: 400 });
  }

  try {
    const { firestore } = getFirebaseServer();
    
    // Busca os dados do agente para obter e-mail e PIN
    const agentRef = doc(firestore, 'agents', agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
    }

    const agentData = agentSnap.data();
    const agentEmail = agentData.email;
    const agentPin = agentData.pin || '0000'; // Usa 0000 como PIN padrão se não estiver definido

    if (!agentEmail) {
      return NextResponse.json({ error: 'O agente não possui um e-mail de cadastro para recuperação.' }, { status: 400 });
    }

    // Formata o remetente no formato "Nome <email@dominio.com>"
    const fromAddress = 'AMA Imobi <amaralx48@gmail.com>';

    // Envia o e-mail usando Resend
    await resend.emails.send({
      from: fromAddress,
      to: [agentEmail],
      subject: 'Lembrete de PIN - AMA Imobi',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Lembrete de Senha (PIN)</h2>
          <p>Olá, ${agentData.displayName || 'usuário'},</p>
          <p>Você solicitou um lembrete de sua senha de acesso (PIN) ao painel da AMA Imobi.</p>
          <p>Seu PIN é: <strong style="font-size: 20px; letter-spacing: 2px;">${agentPin}</strong></p>
          <p>Caso não tenha solicitado, por favor, ignore este e-mail.</p>
          <br>
          <p>Atenciosamente,</p>
          <p><strong>Equipe AMA Imobi</strong></p>
        </div>
      `,
    });
    
    return NextResponse.json({ message: 'Se um e-mail estiver associado a esta conta, um lembrete de PIN foi enviado.' });

  } catch (error) {
    console.error('Erro na API forgot-pin:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno ao tentar enviar o e-mail de lembrete.' }, { status: 500 });
  }
}
