const { exec } = require('child_process');
const fs = require('fs');

exec('npx tsc --noEmit', (error, stdout, stderr) => {
  fs.writeFileSync('tsc-error.txt', stdout + '\n' + stderr);
  console.log('Done');
});
