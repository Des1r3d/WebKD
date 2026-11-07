const { spawn } = require('child_process');

console.log('\x1b[32m%s\x1b[0m', '🚀 [SyncHub] Khởi động client và server song song...');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const server = spawn(npmCmd, ['run', 'dev'], {
  cwd: 'server',
  stdio: 'inherit',
  shell: true,
});

const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: 'client',
  stdio: 'inherit',
  shell: true,
});

function cleanup() {
  server.kill();
  client.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
