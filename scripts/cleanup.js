const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const portsToKill = [3000, 4000];
const isWindows = process.platform === 'win32';

// 1. Kill processes on specified ports
for (const port of portsToKill) {
  try {
    if (isWindows) {
      // Find PID using netstat and kill it using taskkill
      const output = execSync(`netstat -ano | findstr :${port}`).toString();
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[parts.length - 1];
          if (pid !== '0') {
             try {
               execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
               console.log(`Killed process ${pid} on port ${port}`);
             } catch (killErr) {
               // Might fail if already killed or no permission, simply ignore
             }
          }
        }
      }
    } else {
      // Unix-like
      execSync(`lsof -ti :${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
      console.log(`Killed processes on port ${port}`);
    }
  } catch (err) {
    // Port might not be in use, ignore error
  }
}

// 2. Remove .next/dev/lock
const lockFile = path.resolve(__dirname, '../apps/web/.next/dev/lock');
if (fs.existsSync(lockFile)) {
  try {
    fs.unlinkSync(lockFile);
    console.log(`Removed lock file: ${lockFile}`);
  } catch (err) {
    console.error(`Failed to remove lock file: ${err.message}`);
  }
}

// 3. Run db:push
try {
  console.log('Running db:push...');
  execSync('npm run db:push', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
} catch (err) {
  console.error('db:push failed, but continuing anyway (matching previous script behavior).');
}
