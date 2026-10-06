const { exec } = require('child_process');
const fs = require('fs');

console.log("Starting next build...");
const child = exec('npx next build', { maxBuffer: 1024 * 1024 * 10 });

let output = '';

child.stdout.on('data', (data) => {
  output += data;
  console.log(data);
});

child.stderr.on('data', (data) => {
  output += data;
  console.error(data);
});

child.on('close', (code) => {
  fs.writeFileSync('build-error.txt', output + '\nExit code: ' + code);
  console.log('Build finished with code ' + code);
});
