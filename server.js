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

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Helmet EXACTO requerido por freeCodeCamp
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameAncestors: ["'self'"]
      },
    },
    frameguard: { action: "sameorigin" }, // Test #2
    dnsPrefetchControl: { allow: false }, // Test #3
    referrerPolicy: { policy: "same-origin" } // Test #4
  })
);


// CORS
app.use(cors());

// Static files
app.use('/public', express.static(process.cwd() + '/public'));

// API
app.use('/api', apiRoutes);

// Views
app.route('/b/:board/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/board.html');
});
app.route('/b/:board/:threadid').get((req, res) => {
  res.sendFile(process.cwd() + '/views/thread.html');
});
app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// DB + Start server
mongoose
  .connect(DB)
  .then(() => console.log("✓ Connected to MongoDB"))
  .catch((err) => console.error(err))
  .finally(() => {
    if (env !== 'test') {
      app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
    }
  });

module.exports = app;
