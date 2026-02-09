import 'dotenv/config'
import { createApp } from './config/app.js'

const PORT = Number(process.env.PORT) || 3000
const HOST = '0.0.0.0'

async function start(): Promise<void> {
  const app = await createApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    console.log(`Server running on http://localhost:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
