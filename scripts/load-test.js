const TARGET_HOST = process.env.TARGET_HOST || 'http://localhost:5000';
const SHORT_CODE = process.env.SHORT_CODE || 'react-guide';
const TOTAL_REQUESTS = parseInt(process.env.REQUESTS || '1000', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '50', 10);

console.log('====================================================');
console.log('   Production URL Shortener Redirection Benchmark   ');
console.log('====================================================');
console.log(`Target:         ${TARGET_HOST}/${SHORT_CODE}`);
console.log(`Total Requests: ${TOTAL_REQUESTS}`);
console.log(`Concurrency:    ${CONCURRENCY}`);
console.log('----------------------------------------------------');

const latencies = [];
let successCount = 0;
let errorCount = 0;
let completed = 0;

async function sendRequest() {
  const start = performance.now();
  try {
    const res = await fetch(`${TARGET_HOST}/${SHORT_CODE}`, {
      method: 'GET',
      redirect: 'manual',
    });

    const elapsed = performance.now() - start;
    latencies.push(elapsed);

    if (res.status === 302 || res.status === 301 || res.status === 200) {
      successCount++;
    } else {
      errorCount++;
    }
  } catch (err) {
    errorCount++;
  } finally {
    completed++;
    if (completed % 200 === 0 || completed === TOTAL_REQUESTS) {
      process.stdout.write(`Completed ${completed}/${TOTAL_REQUESTS} requests...\r`);
    }
  }
}

async function runBenchmark() {
  const overallStart = performance.now();

  const queue = Array.from({ length: TOTAL_REQUESTS }, () => sendRequest);
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const task = queue.pop();
      if (task) await task();
    }
  });

  await Promise.all(workers);

  const overallTimeMs = performance.now() - overallStart;
  const overallSeconds = overallTimeMs / 1000;
  const rps = (successCount / overallSeconds).toFixed(2);

  latencies.sort((a, b) => a - b);
  const min = latencies[0]?.toFixed(2) || 0;
  const max = latencies[latencies.length - 1]?.toFixed(2) || 0;
  const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
  const p50 = (latencies[Math.floor(latencies.length * 0.5)] || 0).toFixed(2);
  const p95 = (latencies[Math.floor(latencies.length * 0.95)] || 0).toFixed(2);
  const p99 = (latencies[Math.floor(latencies.length * 0.99)] || 0).toFixed(2);

  console.log('\n\n================ Benchmark Results ================');
  console.log(`Success Rate:      ${((successCount / TOTAL_REQUESTS) * 100).toFixed(1)}% (${successCount} successes, ${errorCount} errors)`);
  console.log(`Total Time Taken:  ${overallSeconds.toFixed(2)} seconds`);
  console.log(`Throughput:        ${rps} req/sec`);
  console.log('---------------- Latency Metrics -------------------');
  console.log(`  Min Latency:     ${min} ms`);
  console.log(`  Avg Latency:     ${avg} ms`);
  console.log(`  Median (p50):    ${p50} ms`);
  console.log(`  95th Percentile: ${p95} ms`);
  console.log(`  99th Percentile: ${p99} ms`);
  console.log(`  Max Latency:     ${max} ms`);
  console.log('====================================================');

  if (parseFloat(p95) <= 50.0) {
    console.log('PASSED: Redirection latency comfortably under 50ms production SLA!');
  } else {
    console.log('NOTICE: Latency exceeded 50ms. Check container CPU/network limits.');
  }
}

runBenchmark().catch(console.error);
