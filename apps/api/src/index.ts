import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'Gallery API' })
})

import driveImageApp from './routes/drive-image'
import faceSearchApp from './routes/face-search'
import faceIndexApp from './routes/face-index'
import webhookApp from './routes/webhook'
import cronApp from './routes/cron'

// Register migrated routes
app.route('/api/drive-image', driveImageApp)
app.route('/api/face-search', faceSearchApp)
app.route('/api/face-index', faceIndexApp)
app.route('/api/webhook', webhookApp)
app.route('/api/cron', cronApp)

const port = 4000
console.log(`API is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
