import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { config } from '../config'
import { analyticsService } from '../analytics/analytics.service'
import { ClickEvent } from '../types'

const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null })

export const clickQueue = new Queue<ClickEvent>('click-events', { connection })

let worker: Worker | null = null

export function startClickWorker() {
  worker = new Worker<ClickEvent>(
    'click-events',
    async (job) => {
      await analyticsService.record(job.data)
    },
    {
      connection: new IORedis(config.redisUrl, { maxRetriesPerRequest: null }),
      concurrency: 10,
    },
  )

  worker.on('failed', (job, err) => {
    console.error(`Click job ${job?.id} failed:`, err.message)
  })
}
