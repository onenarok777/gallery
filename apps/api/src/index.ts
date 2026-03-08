import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'Gallery API' })
})

// TODO: Migrate routes from apps/web/app/api here

const port = 4000
console.log(`API is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
