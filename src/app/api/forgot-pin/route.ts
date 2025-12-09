'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, getDoc } from 'firebase/firestore';

/*
// PASSO 1: Instale o Resend
// Execute no seu terminal: npm install resend
import { Resend } from 'resend';

// PASSO 2: Crie sua chave de API no site do Resend e adicione ao .env
// const resend = new Resend(process.env.RESEND_API_KEY);
*/

export async function POST(req: NextRequest) {
  const { agentId } = await req.json();

  if (!agentId) {
    return NextResponse.json({ error: 'ID do agente é obrigatório' }, { status: 400 });
  }

  try {
    const { firestore } = getFirebaseServer();
    const agentRef = doc(firestore, 'agents', agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
    }

    const agentData = agentSnap.data();
    const agentEmail = agentData.email;
    const agentPin = agentData.pin || '0000'; // Usa o PIN ou o padrão

    if (!agentEmail) {
      return NextResponse.json({ error: 'O agente não possui um e-mail cadastrado.' }, { status: 400 });
    }

    /*
    // PASSO 3: Descomente este bloco para ativar o envio de e-mail
    try {
      await resend.emails.send({
        from: 'AMA Imobi <onboarding@resend.dev>', // Ou seu domínio verificado
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
      // Mesmo que o e-mail falhe, retornamos um sucesso genérico para não expor a falha ao usuário final
      return NextResponse.json({ message: 'Se um e-mail estiver associado a esta conta, um lembrete de PIN foi enviado.' });
    }
    */
    
    // Retorna uma mensagem de sucesso genérica para o frontend
    return NextResponse.json({ message: 'Se um e-mail estiver associado a esta conta, um lembrete de PIN foi enviado.' });

  } catch (error) {
    console.error('Erro geral na API forgot-pin:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
