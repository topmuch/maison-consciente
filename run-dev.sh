#!/bin/bash
cd /home/z/my-project/maison-consciente
rm -rf .next
NEXT_DISABLE_TURBOPACK=1 node --max-old-space-size=3072 node_modules/.bin/next dev -p 3001 2>&1
