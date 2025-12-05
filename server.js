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

// ----------- MIDDLEWARES -------------

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 🛡 Helmet EXACTO para FCC
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: { action: 'sameorigin' },
    dnsPrefetchControl: { allow: false },
    referrerPolicy: { policy: 'same-origin' }
  })
);

// CORS
app.use(cors());

// Archivos públicos
app.use('/public', express.static(process.cwd() + '/public'));

// API
app.use('/api', apiRoutes);

// FRONTEND
app.route('/b/:board/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/board.html');
});

app.route('/b/:board/:threadid').get((req, res) => {
  res.sendFile(process.cwd() + '/views/thread.html');
});

app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// DB
mongoose
  .connect(DB)
  .then(() => console.log("✓ Connected to MongoDB"))
  .catch(err => console.error("✗ Mongo error:", err))
  .finally(() => {
    if (env !== 'test') {
      app.listen(PORT, () =>
        console.log(`Your app is listening on port ${PORT}`)
      );
    }
  });

module.exports = app;
