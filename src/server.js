require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const logger = require('./logger').logger;
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const helmet = require('helmet');
const mongodbStore = require('connect-mongo')(session);

// IMPORT USER MODEL AND ROUTER
const { User } = require('../models/user');
const router = require('./routes');

// CONSTANTS FROM .ENV FILE
const DATABASE_URL = process.env.DATABASE_URL;
const PORT = process.env.PORT || 27017
const COOKIE_SECRET = process.env.COOKIE_SECRET

// CONFIG TO SERVER STATIC ASSETS
app.use(express.static(path.join(__dirname, '../public')));

// SET VIEW ENGINE AND VIEW DIRECTORY
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../public/views'));

const env = app.get('env');

// MIDDLEWARE STACK //
app.use(helmet());
app.use(compression());
app.use(cookieParser());
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
    touchAfter: 24 * 3600,
  }),
  secret: COOKIE_SECRET,
  resave: false,
  saveUninitialized: false,
  httpOnly: true,
  secure: true,
  ephemeral: true,
  cookie: {
    maxAge: 1000 * 60 * 120, // 120 MINUTES
  },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// REQUIRE PASSPORT CONFIG AND PASS IN NPM PASSPORT MODULE
require('../config/passport')(passport);

mongoose.Promise = global.Promise;

// USE ROUTER AND PASS APP AND PASSPORT INSTANCE
app.use('/', router(app, passport));


// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

// TAKES A DATABASE URL AS AN ARGUMENT. NEEDED FOR INTEGRATION TESTS. DEFAULTS TO THE MAIN URL.
const runServer = (databaseUrl = DATABASE_URL, port = PORT) => new Promise((resolve, reject) => {
  mongoose.connect(databaseUrl, (err) => {
    if (err) {
      return reject(err);
    }
    server = app.listen(port, () => {
      logger.info(`Your app is listening on port ${port} in a ${env} environment.`);
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
