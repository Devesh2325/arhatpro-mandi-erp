// Vercel Serverless Function entry point for ArhatPro Mandi ERP API
process.env.VERCEL = process.env.VERCEL || '1';
const app = require('../server/index');

module.exports = (req, res) => {
  // Restore full path if Vercel internal router rewrote to /api
  const orig = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.originalUrl;
  if (orig && (req.url === '/api' || req.url === '/api/' || req.url.startsWith('/api?')) && orig.startsWith('/api')) {
    const queryPart = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    req.url = orig.includes('?') ? orig : (orig + queryPart);
  }
  return app(req, res);
};

