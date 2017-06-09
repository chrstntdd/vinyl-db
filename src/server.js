require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const compression = require('compression');
const mongoose = require('mongoose');
const path = require('path');
const logger = require('./logger').logger;

const session = require('express-session');
const mongodbStore = require('connect-mongo')(session);
const { User } = require('../models/user');
const router = require('./routes');

const DATABASE_URL = process.env.DATABASE_URL;
const PORT = process.env.PORT;

const app = express();


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../public/views'));

const env = app.get('env');

// MIDDLEWARE STACK //
app.use(compression());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(morgan('common', {
  stream: logger.stream,
}));

app.use(session({
  name: 'xpressBlu.sess',
  store: new mongodbStore({
    mongooseConnection: mongoose.connection,
    touchAfter: 24 * 3600
  }),
  secret: 'qwertyuiop123456789',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 15
  },
}));

mongoose.Promise = global.Promise;

// ROUTES //
app.use('/', router);


// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

const runServer = () => new Promise((resolve, reject) => {
  mongoose.connect(DATABASE_URL, (err) => {
    if (err) {
      return reject(err);
    }
    server = app.listen(PORT, () => {
      logger.info(`Your app is listening on port ${PORT} in a ${env} environment.`);
      resolve();
    })
      .on('error', (err) => {
        mongoose.disconnect();
        reject(err);
      });
  });
});


const closeServer = () => mongoose.disconnect().then(() => {
  return new Promise((resolve, reject) => {
    logger.info('Closing server. Goodbye old friend.');
    server.close((err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
});



if (require.main === module) {
  runServer().catch(err => logger.error(err));
}

module.exports = { runServer, closeServer, app };
