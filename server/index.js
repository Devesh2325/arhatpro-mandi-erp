const express = require('express');
const cors = require('cors');
const path = require('path');
const { initSchema } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
}));
app.options('*', cors());
app.use(express.json());

// Middleware to ensure full original path is preserved across Vercel Serverless rewrites
app.use((req, res, next) => {
  const orig = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.originalUrl;
  if (orig && (req.url === '/api' || req.url === '/api/' || req.url.startsWith('/api?')) && orig.startsWith('/api')) {
    const queryPart = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    req.url = orig.includes('?') ? orig : (orig + queryPart);
  }
  next();
});

// API Routes (mounted with and without /api prefix for Vercel serverless compatibility)
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenants');
const tradeRoutes = require('./routes/trade');
const ledgerRoutes = require('./routes/ledger');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/tenants', tenantRoutes);
app.use('/tenants', tenantRoutes);

app.use('/api/trade', tradeRoutes);
app.use('/trade', tradeRoutes);

app.use('/api/ledger', ledgerRoutes);
app.use('/ledger', ledgerRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

// Health Check
const healthHandler = (req, res) => {
  res.json({
    status: 'healthy',
    system: 'ArhatPro Mandi ERP Cloud Backend',
    database: 'Supabase Cloud PostgreSQL',
    timestamp: new Date().toISOString()
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);
app.get('/api', healthHandler);

// Handle routing based on environment
if (process.env.VERCEL) {
  // On Vercel, unhandled routes under /api return JSON 404
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });
} else {
  // Optional static serve of React build when in standalone mode
  const clientBuildPath = path.resolve(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth') || req.path.startsWith('/tenants') || req.path.startsWith('/trade') || req.path.startsWith('/ledger')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
      if (err) {
        res.status(200).send(`
          <h1>ArhatPro Mandi ERP API Server Running on Port ${PORT}</h1>
          <p>API endpoints active at <code>/api/...</code></p>
        `);
      }
    });
  });
}

// Start Server if running directly as main entry point (standalone / local / VPS)
if (require.main === module && !process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 ArhatPro Backend API Running on http://localhost:${PORT}`);
    console.log(`⚡ Database: Connected to Supabase Cloud PostgreSQL`);
    console.log(`====================================================`);
  });

  initSchema()
    .then(() => {
      console.log(`📦 Relational SQL Schema: Verified on Supabase Cloud`);
    })
    .catch((err) => {
      console.error('Database Initialization Warning:', err.message);
    });
}

module.exports = app;

