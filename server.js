require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'development';
const DB = env === 'test' ? process.env.DB_TEST : process.env.DB;

// Database Connection
mongoose
  .connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Helmet configuración exacta FCC + CSP con frame-ancestors
// Primero usamos piezas concretas de Helmet que pediste:
app.use(helmet.frameguard({ action: "sameorigin" }));      // Test 2 (X-Frame-Options)
// Test 3: no permitir prefetch DNS
app.use(helmet.dnsPrefetchControl({ allow: false }));      
// Test 4: enviar referente solo a mismo origen
app.use(helmet.referrerPolicy({ policy: "same-origin" })); 
app.use(helmet.noSniff());
app.use(helmet.hidePoweredBy());

// Añadimos además Content-Security-Policy con frame-ancestors 'self'
// Esto asegura compatibilidad moderna para que solo tu origen pueda embeber la app
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // ajusta si no usas inline styles
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      // directiva crucial para el test 2 moderno:
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  })
);

// (opcional / redundante) asegúrate de que X-Frame-Options esté presente para navegadores legacy
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// CORS
app.use(cors());

// Static files
app.use('/public', express.static(process.cwd() + '/public'));

// API routes
app.use('/api', apiRoutes);

// Views
app.get('/b/:board/', (req, res) => {
  res.sendFile(process.cwd() + '/views/board.html');
});

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Start server solo si no estamos en test (importante para los tests FCC)
if (env !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
