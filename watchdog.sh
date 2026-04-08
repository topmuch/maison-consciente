#!/bin/bash
cd /home/z/my-project
while true; do
  rm -rf .next 2>/dev/null
  echo "[$(date +%H:%M:%S)] Starting Next.js..." >> /home/z/my-project/dev.log
  NEXT_DISABLE_TURBOPACK=1 node --max-old-space-size=3072 node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
  NPID=$!
  # Wait for server to be ready
  for i in $(seq 1 30); do
    sleep 1
    if ! kill -0 $NPID 2>/dev/null; then
      echo "[$(date +%H:%M:%S)] Server process died during startup" >> /home/z/my-project/dev.log
      break
    fi
    if ss -tlnp 2>/dev/null | rg -q ":3000"; then
      # Pre-compile the page
      curl -s -m 120 http://localhost:3000/ > /dev/null 2>&1
      echo "[$(date +%H:%M:%S)] Pre-compile done" >> /home/z/my-project/dev.log
      # Wait for server to die or stay alive
      wait $NPID 2>/dev/null
      echo "[$(date +%H:%M:%S)] Server exited, restarting..." >> /home/z/my-project/dev.log
      break
    fi
  done
  sleep 2
done
