import http from 'http';
import handler from './.vercel/output/functions/__server.func/index.mjs';

const server = http.createServer((req, res) => {
  handler(req, res);
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/_serverFn/c7f63cf49eea7bc652ffdd2269c5b9e0bbe5060eda354be0ee81c8047c7c8710',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    }
  };

  http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      console.log('Body:', data);
      server.close();
    });
  }).end();
});
