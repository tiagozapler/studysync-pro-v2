const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const destination = path.join(__dirname, '..', 'public', 'pdf.worker.min.js');

if (!fs.existsSync(source)) {
  console.warn('[postinstall] pdf.worker.min.mjs not found at', source);
  process.exit(0);
}

fs.copyFileSync(source, destination);
console.log('[postinstall] Copied pdf.worker.min.mjs to public/pdf.worker.min.js');
