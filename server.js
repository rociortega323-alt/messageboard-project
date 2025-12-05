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

// ------------------------------------
// Middleware
// ------------------------------------
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Helmet EXACTO según FCC
app.use(
  helmet({
    frameguard: { action: "sameorigin" },     // Test #2
    dnsPrefetchControl: { allow: false },     // Test #3
    referrerPolicy: { policy: "same-origin" }, // Test #4
    contentSecurityPolicy: false              // IMPORTANTE
  })
);

// Headers duplicados para Render (asegura que FCC los vea)
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});

// CORS
app.use(cors());

// Static
app.use('/public', express.static(process.cwd() + '/public'));

// API
app.use('/api', apiRoutes);

// Views
app.route('/b/:board/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/board
