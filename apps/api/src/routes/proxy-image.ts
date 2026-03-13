import { Hono } from 'hono'

const proxyImageApp = new Hono()

/**
 * GET /api/proxy-image?url=...
 * 
 * Simple image proxy — fetches an external image URL and returns it
 * with aggressive caching headers.
 */
proxyImageApp.get('/', async (c) => {
  const url = c.req.query('url')

  if (!url) {
    return c.text('Missing URL parameter', 400)
  }

  try {
    const response = await fetch(url)

    if (!response.ok) {
      return c.text(`Failed to fetch image: ${response.statusText}`, response.status as 400)
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await response.arrayBuffer()

    c.header('Content-Type', contentType)
    c.header('Cache-Control', 'public, max-age=31536000, immutable')

    return c.body(arrayBuffer)
  } catch (error) {
    console.error('Proxy error:', error)
    return c.text('Internal Server Error', 500)
  }
})

export default proxyImageApp
