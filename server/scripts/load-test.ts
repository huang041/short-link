/**
 * 壓測腳本 — 測試短網址跳轉的延遲與吞吐量
 *
 * 使用方式：
 *   npx tsx scripts/load-test.ts <shortCode>
 *
 * 範例：
 *   npx tsx scripts/load-test.ts hWFy0m5
 *
 * 可調參數（環境變數）：
 *   BASE_URL     — 目標 server（預設 http://localhost:3000）
 *   CONNECTIONS  — 併發連線數（預設 50）
 *   DURATION     — 測試秒數（預設 10）
 */
import autocannon from 'autocannon'

const shortCode = process.argv[2]
if (!shortCode) {
  console.error('Usage: npx tsx scripts/load-test.ts <shortCode>')
  process.exit(1)
}

const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
const connections = Number(process.env.CONNECTIONS) || 50
const duration = Number(process.env.DURATION) || 10

console.log(`\nLoad testing redirect: GET ${baseUrl}/${shortCode}`)
console.log(`Connections: ${connections}, Duration: ${duration}s\n`)

const instance = autocannon({
  url: `${baseUrl}/${shortCode}`,
  connections,
  duration,
  // don't follow redirects — we're testing the server response time, not the target
  maxRedirects: 0,
})

autocannon.track(instance, { renderProgressBar: true })

instance.on('done', (result) => {
  console.log('\n--- Results ---')
  console.log(`Requests/sec (avg): ${result.requests.average}`)
  console.log(`Latency (avg):      ${result.latency.average} ms`)
  console.log(`Latency (p99):      ${result.latency.p99} ms`)
  console.log(`Latency (max):      ${result.latency.max} ms`)
  console.log(`Total requests:     ${result.requests.total}`)
  console.log(`Errors:             ${result.errors}`)
  console.log(`Timeouts:           ${result.timeouts}`)
  console.log(`2xx responses:      ${result['2xx']}`)
  console.log(`3xx responses:      ${result['3xx']}`)
  console.log(`Non-2xx/3xx:        ${result.non2xx - result['3xx'] || 0}`)
})
