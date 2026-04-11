#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'LED', 'font.js');
if (!fs.existsSync(file)) {
  console.error('file not found:', file);
  process.exit(2);
}
let s = fs.readFileSync(file, 'utf8');
const backup = file + '.bak';
fs.writeFileSync(backup, s, 'utf8');

const regex = /(\"data\"\s*:\s*\[\s*)([\s\S]*?)(\s*\])/g;
let changed = false;
const newS = s.replace(regex, (m, p1, inner, p3) => {
  const arr = [];
  const re = /\"([^\"]*)\"/g;
  let mm;
  while ((mm = re.exec(inner)) !== null) arr.push(mm[1]);
  // Recreate with same elements but in one line
  changed = true;
  return p1 + arr.map(x => JSON.stringify(x)).join(',') + p3;
});

if (!changed) {
  console.log('No data arrays found or already single-line. Backup at', backup);
  process.exit(0);
}

fs.writeFileSync(file, newS, 'utf8');
console.log('Converted data arrays to one-line in', file);
console.log('Backup saved at', backup);
