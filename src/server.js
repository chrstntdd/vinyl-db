require('dotenv').config();

const express     = require('express');
const bodyParser  = require('body-parser');
const morgan      = require('morgan');
const compression = require('compression');
const mongoose    = require('mongoose');
const path        = require('path');
const logger      = require('./logger').logger;
const Discogs     = require('disconnect').Client;
const { Record }  = require('../models/records');

const app = express();

const db = new Discogs({
  consumerKey: process.env.CONSUMER_KEY,
  consumerSecret: process.env.CONSUMER_SECRET
}).database();

app.use(compression());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(morgan('common', {
  stream: logger.stream
}));

mongoose.Promise = global.Promise;

// ROOT / HOMEPAGE
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/views', 'index.html'));
});

// RETRIEVE ALL RECORDS
app.get('/records', (req, res) => {
  Record
    .find()
    .exec()
    .then(records => res.json(records))
    .catch(err => {
      logger.error(err);
      res.status(500).json({
        error: 'INTERNAL SERVER ERROR. IT BLEW UP.'
      });
    });
});

// MAIN API CALL FOR DISCOGS SEARCH
app.post('/search', (req, res) => {

  let artist = req.body.artist;
  let album = req.body.album;

  db.search(artist, {
    artist: artist,
    title: album,
    release_title: album,
    format: 'vinyl'
  })
    .then((release) => {
      res.json(release.results);
    });
});


// CATCH ALL HANDLERS
app.get('*', (req, res) => {
  res.status(404).json({
    message: '404 ERROR: Page not found.'
  });
});

app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({
    error: 'Something went wrong'
  }).end();
});


// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

const runServer = (DATABASE_URL = process.env.DATABASE_URL, PORT = process.env.PORT) => {
  return new Promise((resolve, reject) => {
    mongoose.connect(DATABASE_URL, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(PORT, () => {
        logger.log(`Your app is listening on port ${PORT}.`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

const closeServer = () => {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      logger.log('Closing server. Goodbye old friend.');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => logger.error(err));
}

module.exports = { runServer, closeServer, app };