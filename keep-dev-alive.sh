#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date +%H:%M:%S)] Starting dev server..."
  rm -rf .next
  NEXT_DISABLE_TURBOPACK=1 node --max-old-space-size=3072 node_modules/.bin/next dev -p 3000 2>&1
  EXIT=$?
  echo "[$(date +%H:%M:%S)] Exited with code $EXIT, restarting in 2s..."
  sleep 2
done
