#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date +%H:%M:%S)] Starting dev server..."
  node --max-old-space-size=2048 node_modules/.bin/next dev -p 3000 2>&1 | tee -a /home/z/my-project/dev.log &
  DEV_PID=$!
  echo "[$(date +%H:%M:%S)] Dev PID: $DEV_PID"
  # Wait for the process to exit
  wait $DEV_PID 2>/dev/null
  EXIT=$?
  echo "[$(date +%H:%M:%S)] Exited with code $EXIT, restarting in 3s..."
  sleep 3
done
