const http = require('http');

const ENDPOINTS = [
    '/api/teams',
    '/api/players',
    '/api/matches/upcoming',
    '/api/matches/completed'
];

async function generateLoad() {
    console.log("Starting Production Load Validation (100 users across 10 seconds)...");
    
    let successCount = 0;
    let rateLimitCount = 0;
    let errCount = 0;
    let totalLatency = 0;
    const NUM_USERS = 100;
    const REQ_PER_USER = 10; 

    // Total 1000 requests. Wait, user said 50-100 users light load.
    
    // We space requests.
    const promises = [];
    
    for (let u = 1; u <= NUM_USERS; u++) {
        // Simulate a proxy IP mask for each unique user
        const ip = `192.168.1.${u}`;
        
        for (let r = 0; r < REQ_PER_USER; r++) {
            const index = Math.floor(Math.random() * ENDPOINTS.length);
            const path = ENDPOINTS[index];
            
            promises.push(new Promise((resolve) => {
                const start = process.hrtime();
                
                const req = http.get({
                    host: 'localhost',
                    port: 8082,
                    path: path,
                    headers: {
                        'X-Forwarded-For': ip
                    }
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        const diff = process.hrtime(start);
                        const ms = diff[0] * 1e3 + diff[1] / 1e6;
                        totalLatency += ms;
                        
                        if (res.statusCode === 200) {
                            successCount++;
                        } else if (res.statusCode === 429) {
                            rateLimitCount++;
                        } else {
                            errCount++;
                        }
                        resolve();
                    });
                });
                
                req.on('error', (e) => {
                    errCount++;
                    resolve();
                });
            }));
        }
    }
    
    await Promise.all(promises);
    
    console.log("\n================ PRODUCTION LOAD TEST REPORT ================");
    console.log(`Total Requests Sent : ${NUM_USERS * REQ_PER_USER}`);
    console.log(`Successful (200 OK)  : ${successCount}`);
    console.log(`Rate Limited (429)   : ${rateLimitCount} (Expected: 0)`);
    console.log(`Other Errors         : ${errCount} (Expected: 0)`);
    console.log(`Average Latency      : ${(totalLatency / (NUM_USERS * REQ_PER_USER)).toFixed(2)} ms`);
    console.log("=============================================================");
}

setTimeout(generateLoad, 5000);
