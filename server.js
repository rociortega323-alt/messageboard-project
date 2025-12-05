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

// ---------- MIDDLEWARE ----------
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Helmet básico
app.use(helmet());

// Aseguramos manualmente los headers requeridos por las pruebas
app.use((req, res, next) => {
  // Sólo permitir iFrame desde mismo origen
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Evitar DNS prefetch
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  // Enviar referer solo a orígenes propios
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// CORS (si tu front está en mismo dominio podrías ajustar)
app.use(cors());

// Archivos estáticos y vistas (mantén tus html en /views y assets en /public)
app.use('/public', express.static(process.cwd() + '/public'));

// Rutas API
app.use('/api', apiRoutes);

// Rutas frontend
app.route('/b/:board/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/board.html');
});
app.route('/b/:board/:threadid').get((req, res) => {
  res.sendFile(process.cwd() + '/views/thread.html');
});
app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// ---------- DB & SERVER ----------
mongoose
  .connect(DB)
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch((err) => console.error('✗ MongoDB connection error:', err))
  .finally(() => {
    // IMPORTANT: cuando NODE_ENV === 'test' NO levantamos el listener
    if (env !== 'test') {
      app.listen(PORT, () => {
        console.log(`Your app is listening on port ${PORT}`);
      });
    }
  });

module.exports = app;
