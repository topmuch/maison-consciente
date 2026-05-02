const { spawn } = require('child_process');
const fs = require('fs');
const logFile = '/home/z/my-project/maison-consciente/server.log';

function start() {
  const child = spawn('npx', ['next', 'dev', '-p', '3000'], {
    cwd: '/home/z/my-project/maison-consciente',
    detached: true,
    stdio: ['ignore', fs.openSync(logFile, 'a'), fs.openSync(logFile, 'a')],
    env: { ...process.env }
  });
  child.unref();
  console.log('Server started with PID:', child.pid);
  fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] Daemon started PID: ${child.pid}\n`);
}

start();
