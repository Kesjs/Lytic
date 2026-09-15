import { toNodeListener } from 'h3';
import server from './dist/server/server.js';
import http from 'http';

const handler = toNodeListener(server);

const httpServer = http.createServer(handler);
httpServer.listen(3001, () => {
  console.log('Listening on 3001');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/_serverFn/c7f63cf49eea7bc652ffdd2269c5b9e0bbe5060eda354be0ee81c8047c7c8710',
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  };

  http.request(options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
      httpServer.close();
    });
  }).end();
});
