const fs = require('fs');
const path = require('path');
const root = path.resolve('C:/Users/MSI-1/Desktop/spaceutilisiers');
const newNav = `        <ul class="nav-links">
          <li><a href="index.html">DESIGN</a></li>
          <li><a href="about.html">ARCHITECTURE</a></li>
          <li><a href="services.html">CONSTRUCTION</a></li>
          <li><a href="portfolio.html">LANDSCAPE</a></li>
          <li><a href="process.html">FURNITURE</a></li>
          <li><a href="about.html">ABOUT US</a></li>
          <li><a href="portfolio.html">GALLARY</a></li>
          <li><a href="contact.html">CONTACT</a></li>
        </ul>`;
const files = fs.readdirSync(root).filter(name => name.endsWith('.html'));
let changed = 0;
for (const file of files) {
  const filePath = path.join(root, file);
  const text = fs.readFileSync(filePath, 'utf8');
  const newText = text.replace(/<ul class="nav-links">[\s\S]*?<\/ul>/, newNav);
  if (newText !== text) {
    fs.writeFileSync(filePath, newText, 'utf8');
    console.log(`Updated ${file}`);
    changed += 1;
  }
}
console.log(`Done. ${changed} files updated.`);
