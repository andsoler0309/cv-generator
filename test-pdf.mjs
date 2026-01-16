// Test PDF generation with special characters
import http from 'http';
import fs from 'fs';

const data = JSON.stringify({
  optimizedText: 'John Doe\n● Software Engineer\n• Experience:\n- Built scalable systems\n— Led team of 5',
  originalFileName: 'test.pdf'
});

console.log('Testing PDF generation with special characters...');
console.log('Input text:', data);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate-pdf',
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, res => {
  console.log('Status:', res.statusCode);
  
  if (res.statusCode === 200) {
    const file = fs.createWriteStream('/tmp/test-special.pdf');
    res.pipe(file);
    file.on('finish', () => {
      console.log('✅ PDF saved to /tmp/test-special.pdf');
      // Check file
      const stats = fs.statSync('/tmp/test-special.pdf');
      console.log('File size:', stats.size, 'bytes');
      process.exit(0);
    });
  } else {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('❌ Error:', body);
      process.exit(1);
    });
  }
});

req.on('error', e => {
  console.error('Request error:', e.message);
  process.exit(1);
});

req.write(data);
req.end();
