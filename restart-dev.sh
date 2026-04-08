#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting Next.js dev server..."
  rm -rf .next
  NEXT_DISABLE_TURBOPACK=1 node --max-old-space-size=3072 node_modules/.bin/next dev -p 3000 2>&1 | tee -a /home/z/my-project/dev.log
  echo "[$(date)] Server crashed, restarting in 3s..."
  sleep 3
done
