#!/bin/sh
while true; do
  echo "Starting dev server at $(date)"
  node --max-old-space-size=4096 node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  echo "Server crashed, restarting in 3s..."
  sleep 3
done
