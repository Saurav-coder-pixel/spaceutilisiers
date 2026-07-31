const fs = require('fs');
const path = require('path');
const root = path.resolve('C:/Users/MSI-1/Desktop/spaceutilisiers');
const files = ['about.html','blog.html','contact.html','index.html','portfolio.html','privacy.html','process.html','services.html','terms.html'];
let changed = 0;
for (const file of files) {
  const filePath = path.join(root, file);
  const text = fs.readFileSync(filePath, 'utf8');
  const newText = text.replace(/>ABOUT US</g, '>ABOUT&nbsp;US<');
  if (newText !== text) {
    fs.writeFileSync(filePath, newText, 'utf8');
    console.log(`Updated ${file}`);
    changed += 1;
  }
}
console.log(`Done. ${changed} files updated.`);
