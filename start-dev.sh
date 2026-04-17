#!/bin/bash
cd /home/z/my-project/maison-consciente
while true; do
  echo "[$(date +%H:%M:%S)] Starting Maellis dev server..."
  rm -rf .next
  NEXT_DISABLE_TURBOPACK=1 node --max-old-space-size=3072 node_modules/.bin/next dev -p 3000 2>&1 | tee -a /home/z/my-project/maison-consciente/dev.log
  echo "[$(date +%H:%M:%S)] Server exited, restarting in 3s..."
  sleep 3
done
