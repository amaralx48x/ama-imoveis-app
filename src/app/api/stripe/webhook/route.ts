export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return new Response('WEBHOOK OK', { status: 200 });
}
