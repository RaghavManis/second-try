const http = require('http');

async function measureRequest(path, iteration) {
    return new Promise((resolve) => {
        const start = process.hrtime();
        http.get({ host: 'localhost', port: 8080, path: path }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const diff = process.hrtime(start);
                const timeStr = `${diff[0] * 1e3 + diff[1] / 1e6} ms`;
                console.log(`[${path}] Iteration ${iteration}: ${timeStr} (Status: ${res.statusCode})`);
                resolve();
            });
        }).on('error', (e) => {
            console.error(`Error: ${e.message}`);
            resolve();
        });
    });
}

async function run() {
    console.log("--- Caching Validation Test ---");
    console.log("1. Fetching Teams (Should hit DB)");
    await measureRequest('/api/teams', 1);
    
    console.log("2. Fetching Teams again (Should hit Cache)");
    await measureRequest('/api/teams', 2);

    console.log("3. Fetching Players (Should hit DB)");
    await measureRequest('/api/players', 1);
    
    console.log("4. Fetching Players again (Should hit Cache)");
    await measureRequest('/api/players', 2);
}

run();
