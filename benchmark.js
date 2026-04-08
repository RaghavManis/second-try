const http = require('http');

const url = 'http://localhost:8080/api/matches';
const numRequests = 200; // Concurrent requests
let completed = 0;
let errors = 0;
const start = Date.now();

console.log(`Starting simple load test... sending ${numRequests} requests to ${url}`);

for (let i = 0; i < numRequests; i++) {
    http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            completed++;
            checkDone();
        });
    }).on('error', (err) => {
        errors++;
        completed++;
        checkDone();
    });
}

function checkDone() {
    if (completed === numRequests) {
        const duration = Date.now() - start;
        console.log('--- Benchmark Results ---');
        console.log(`Total Requests: ${numRequests}`);
        console.log(`Duration: ${duration} ms`);
        console.log(`Successful: ${numRequests - errors}`);
        console.log(`Errors: ${errors}`);
        console.log(`RPS (Req/sec): ${((numRequests - errors) / (duration / 1000)).toFixed(2)}`);
    }
}
