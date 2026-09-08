const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Internal Server Error' }));
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
