#!/bin/bash

PORT=3000

# Verifica se a porta está em uso
PID=$(lsof -t -i:$PORT)

if [ -n "$PID" ]; then
  echo "⚠️  A porta $PORT está em uso pelo processo $PID. Encerrando..."
  kill -9 $PID
  echo "✅ Porta $PORT liberada."
else
  echo "✅ Porta $PORT já está livre."
fi

echo "🚀 Iniciando o servidor Next.js..."
npm run dev
