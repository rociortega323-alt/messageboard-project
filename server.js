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

// ------------ MIDDLEWARES -----------------

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Helmet (solo lo que FCC permite)
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: { action: 'sameorigin' },
    dnsPrefetchControl: { allow: false },
    referrerPolicy: { policy: 'same-origin' }
  })
);

// CORS básico
app.use(cors());

// Static files
app.use('/public', express.static(process.cwd() + '/public'));

// --------------- ROUTES -------------------
app.use('/api', apiRoutes);

// Frontend de freeCodeCamp
app.route('/b/:board/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/board.html');
});

app.route('/b/:board/:threadid').get((req, res) => {
  res.sendFile(process.cwd() + '/views/thread.html');
});

app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// --------------- DATABASE ------------------
mongoose
  .connect(DB)
  .then(() => {
    if (env !== 'test') {
      app.listen(PORT, () =>
        console.log(`Your app is listening on port ${PORT}`)
      );
    }
  })
  .catch((err) => console.error(err));


module.exports = app;
