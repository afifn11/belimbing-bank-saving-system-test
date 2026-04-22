require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./models');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Swagger API Docs
const swaggerFile = fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8');
const swaggerDocument = YAML.parse(swaggerFile);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Belimbing Bank API Docs',
  customCss: `
    .topbar { background-color: #1a2e4a; }
    .topbar-wrapper a::after { content: 'Belimbing Bank API'; color: white; font-size: 1.1rem; font-weight: 600; margin-left: 12px; }
    .topbar-wrapper img { display: none; }
  `,
}));

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Belimbing Bank API is running',
    docs: `http://localhost:${PORT}/api/docs`,
  });
});

// API Routes
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Connect DB & Start
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connected');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API Docs:  http://localhost:${PORT}/api/docs`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
