const autocannon = require('autocannon');

const run = () => {
  const instance = autocannon({
    url: 'http://localhost:8081',
    connections: 500,
    duration: 15,
    requests: [
      { method: 'GET', path: '/api/teams' },
      { method: 'GET', path: '/api/players' },
      { method: 'GET', path: '/api/matches/upcoming' },
      { method: 'GET', path: '/api/matches/completed' }
    ]
  }, (err, result) => {
    if (err) {
      console.error(err);
    } else {
        console.log(`\n================ REALISTIC FLOW TEST RESULTS ================`);
        console.log(`Total Requests: ${result.requests.total}`);
        console.log(`Average Req/Sec: ${result.requests.average}`);
        console.log(`Average Latency: ${result.latency.average} ms`);
        console.log(`Errors: ${result.errors}`);
        console.log(`Timeouts: ${result.timeouts}`);
        console.log(`Non-2xx Responses: ${result.non2xx}`);
        console.log(`Status Codes:`);
        console.log(result.statusCodeStats);
        console.log(`=============================================================\n`);
    }
  });

  autocannon.track(instance, { renderProgressBar: false });
};

run();
