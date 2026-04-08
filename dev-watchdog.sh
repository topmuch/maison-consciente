#!/bin/bash
cd /home/z/my-project
ITER=0
while true; do
  ITER=$((ITER + 1))
  echo "[$(date +%H:%M:%S)] Start #${ITER}" >> /home/z/my-project/dev.log
  rm -rf .next 2>/dev/null
  NEXT_DISABLE_TURBOPACK=1 node --max-old-space-size=2048 node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
  NPID=$!
  
  # Wait for server ready + pre-compile
  for i in $(seq 1 40); do
    sleep 1
    if ! kill -0 $NPID 2>/dev/null; then break; fi
    if ss -tlnp 2>/dev/null | rg -q ":3000"; then
      # Pre-compile main page
      curl -s -m 120 http://localhost:3000/ > /dev/null 2>&1
      echo "[$(date +%H:%M:%S)] Compiled" >> /home/z/my-project/dev.log
      # Wait up to 180s for external access
      for j in $(seq 1 90); do
        sleep 2
        if ! kill -0 $NPID 2>/dev/null; then
          echo "[$(date +%H:%M:%S)] Died" >> /home/z/my-project/dev.log
          break
        fi
      done
      break
    fi
  done
  
  kill $NPID 2>/dev/null
  wait $NPID 2>/dev/null
  sleep 3
done
