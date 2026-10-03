import { app } from './app.js'
import { env } from './config.js'
import { prisma } from './lib/prisma.js'
import { runHousekeeping } from './jobs/housekeeping.js'

async function start() {
  await prisma.$connect()
  const server = app.listen(env.PORT, () => {
    console.info(JSON.stringify({ level: 'info', event: 'server_started', port: env.PORT }))
  })

  const jobs = setInterval(() => {
    void runHousekeeping().catch(() =>
      console.error(JSON.stringify({ level: 'error', event: 'housekeeping_failed' })),
    )
  }, 60_000)
  jobs.unref()
  let stopping = false
  function shutdown() {
    if (stopping) return
    stopping = true
    clearInterval(jobs)
    const timeout = setTimeout(() => process.exit(1), 10_000)
    timeout.unref()
    server.close(() => {
      void prisma
        .$disconnect()
        .then(() => {
          clearTimeout(timeout)
        })
        .catch(() => {
          console.error(JSON.stringify({ level: 'error', event: 'database_disconnect_failed' }))
          process.exitCode = 1
        })
    })
  }

  server.on('error', () => {
    console.error(JSON.stringify({ level: 'error', event: 'server_failed' }))
    process.exitCode = 1
    shutdown()
  })
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

start().catch(async () => {
  console.error(JSON.stringify({ level: 'error', event: 'startup_failed' }))
  process.exitCode = 1
  await prisma.$disconnect()
})
