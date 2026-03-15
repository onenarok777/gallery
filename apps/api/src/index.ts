import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Apply CORS to all routes
app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['*'],
}))

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'Gallery API' })
})

import driveImageApp from './routes/drive-image'
import faceSearchApp from './routes/face-search'
import faceIndexApp from './routes/face-index'
import webhookApp from './routes/webhook'
import cronApp from './routes/cron'
import eventsApp from './routes/events'
import uploadApp from './routes/upload'
import qrCodeApp from './routes/qr-code'
import proxyImageApp from './routes/proxy-image'
import authApp from './routes/auth'

// Register migrated routes
app.route('/api/drive-image', driveImageApp)
app.route('/api/face-search', faceSearchApp)
app.route('/api/face-index', faceIndexApp)
app.route('/api/webhook', webhookApp)
app.route('/api/cron', cronApp)
app.route('/api/events', eventsApp)
app.route('/api/upload', uploadApp)
app.route('/api/qr-code', qrCodeApp)
app.route('/api/proxy-image', proxyImageApp)
app.route('/api/auth', authApp)

const port = 4000
console.log(`API is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
