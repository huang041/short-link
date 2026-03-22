import app from './app'
import { config } from './config'
import { connectRedis } from './lib/redis'
import { startClickWorker } from './lib/queue'

async function main() {
  await connectRedis()
  startClickWorker()
  console.log('Click queue worker started')
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`)
  })
}

main().catch(console.error)
