#!/bin/bash
cd /home/z/my-project/maison-consciente
while true; do
  npx next dev -p 3000 >> /home/z/my-project/maison-consciente/server.log 2>&1
  echo "[$(date)] Server crashed, restarting in 3s..." >> /home/z/my-project/maison-consciente/server.log
  sleep 3
done
