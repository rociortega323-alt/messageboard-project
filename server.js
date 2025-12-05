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

// Connect to DB
mongoose
  .connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Helmet (pero SIN helmet.contentSecurityPolicy)
app.use(helmet.frameguard({ action: "sameorigin" }));
app.use(helmet.dnsPrefetchControl({ allow: false }));
app.use(helmet.referrerPolicy({ policy: "same-origin" }));
app.use(helmet.noSniff());
app.use(helmet.hidePoweredBy());

// CSP EXACTO (setHeader) → evita que Render agregue nada
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'self'"
  );
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

// Start server
if (env !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
