const express = require('express');
const cors = require('cors');
const path = require('path');
const { initSchema } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/trade', require('./routes/trade'));
app.use('/api/ledger', require('./routes/ledger'));
app.use('/api/admin', require('./routes/admin'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'ArhatPro Mandi ERP Cloud Backend',
    database: 'Relational SQL (SQLite/PostgreSQL)',
    timestamp: new Date().toISOString()
  });
});

// Optional static serve of React build when in production
const clientBuildPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <h1>ArhatPro Mandi ERP API Server Running on Port ${PORT}</h1>
        <p>API endpoints active at <code>/api/...</code></p>
      `);
    }
  });
});

// Start Server after Schema Init
initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 ArhatPro Backend API Running on http://localhost:${PORT}`);
      console.log(`📦 Relational SQL Database: Connected and Seeded`);
      console.log(`====================================================`);
    });
  })
  .catch((err) => {
    console.error('Fatal Database Initialization Error:', err);
    process.exit(1);
  });
