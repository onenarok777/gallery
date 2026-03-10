import { Hono } from 'hono';

const uploadApp = new Hono();

// Old upload routes for QR logos removed. 
// Now using /api/qr-code/:eventId for QR related updates.

export default uploadApp;
