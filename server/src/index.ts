import app from './app'
import { config } from './config'
import { connectRedis } from './lib/redis'

async function main() {
  await connectRedis()
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`)
  })
}

main().catch(console.error)
