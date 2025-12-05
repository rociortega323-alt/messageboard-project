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
// Database Connection
// ------------------------------------
mongoose
  .connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// ------------------------------------
// Middleware
// ------------------------------------
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ------------------------------------
// Helmet (EXACTO para pasar FCC)
// ------------------------------------

// Test #2 – Allow site to be loaded only in same-origin iframe
app.use(helmet.frameguard({ action: "sameorigin" }));

// Test #3 – Disable DNS prefetching
app.use(helmet.dnsPrefetchControl({ allow: false }));

// Test #4 – Only send referrer for same origin
app.use(helmet.referrerPolicy({ policy: "same-origin" }));

// Necesario para evitar problemas con CSP en FCC
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'"],
      "img-src": ["'self'", "data:"]
    },
  })
);

// ❌ Eliminado: NO DUPLICAR HEADERS (rompía los tests)

// CORS
app.use(cors());

// Static files
app.use('/public', express.static(process.cwd() + '/public'));

// API routes
app.use('/api', apiRoutes);

// Views
app.route('/b/:board/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/board.html');
});

app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// ------------------------------------
// Start server
// ------------------------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
