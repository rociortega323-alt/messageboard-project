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

// ✔ EXACTO para FCC
app.use(helmet.frameguard({ action: "sameorigin" }));      // Test 2
app.use(helmet.dnsPrefetchControl({ allow: false }));      // Test 3
app.use(helmet.referrerPolicy({ policy: "same-origin" })); // Test 4
app.use(helmet.noSniff());
app.use(helmet.hidePoweredBy());

// ❗ CSP mínima obligatoria (para que Render NO inyecte la suya)
//    Pero SIN frame-ancestors y SIN conflicto con iframe.
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"]
      // ❌ NO poner frame-ancestors
      // ❌ NO poner upgradeInsecureRequests
    },
  })
);

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

// Start server
if (env !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
