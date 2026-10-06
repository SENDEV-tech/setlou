const { exec } = require('child_process');
const fs = require('fs');

exec('git push', { timeout: 10000 }, (error, stdout, stderr) => {
  fs.writeFileSync('git-output.txt', stdout + '\n' + stderr + '\nError: ' + (error ? error.message : 'null'));
  console.log('Done');
});
