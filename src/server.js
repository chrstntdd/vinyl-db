require('dotenv').config();

const express     = require('express');
const bodyParser  = require('body-parser');
const morgan      = require('morgan');
const compression = require('compression');
const mongoose    = require('mongoose');
const path        = require('path');
const map         = require('lodash.map');
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

// SEARCH VIEW
app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/views', 'search.html'));
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

// RETRIEVE RECORD BY ID
app.get('/records/:id', (req, res) => {
  Record
    .findById(req.params.id)
    .exec()
    .then(record => res.json(record))
    .catch(err => {
      logger.error(err);
      res.status(500).json({
        error: 'INTERNAL SERVER ERROR. EVERYTHING IS ON FIRE'
      });
    });
});

// POST NEW RECORD
app.post('/records', (req, res) => {
  const reqFields = ['artist', 'album', 'releaseYear', 'genre'];
  map(reqFields, (field) => {
    if (!(field in req.body)) {
      const message = `Missing ${field} in the request body.`;
      logger.error(message);
      return res.status(400).send(message);
    }
  });

  Record
    .create({
      artist: req.body.artist,
      album: req.body.album,
      releaseYear: req.body.releaseYear,
      purchaseDate: req.body.purchaseDate,
      genre: req.body.genre,
      rating: req.body.rating,
      mood: req.body.mood,
      playCount: req.body.playCount,
      notes: req.body.notes,
      vinylColor: req.body.vinylColor,
      accolades: req.body.accolades
    })
    .then(newRecord => res.status(201).json(newRecord))
    .catch(err => {
      logger.error(err);
      res.status(500).json({
        error: 'N-TERNAL SERVER ERROR. PRAY FOR HELP'
      });
    });
});

// DELETE RECORD BY ID
app.delete('/records/:id', (req, res) => {
  Record
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(() => {
      let message = `Successfully deleted the record with an id of ${req.params.id}`;
      logger.info(message);
      res.status(204).end();
    })
    .catch(err => {
      logger.error(err);
      res.status(500).json({
        error: 'INTERNAL SERVER ERROR. BREAK ALL THE WINDOWS.'
      });
    });
});

// UPDATE RECORD BY ID
app.put('/records/:id', (req, res) => {
  if (!(req.params.id && req.body.id === req.body.id)) {
    res.status(400).json({
      error: 'Request path id and request body id must match. Try again.'
    });
  }

  const updated = {};
  const updatableFields = ['artist', 'album', 'releaseYear', 'purchaseDate', 'genre', 'rating', 'mood', 'playCount', 'notes', 'vinylColor', 'accolades'];
  // ONLY UPDATE FIELDS THAT EXIST ON EACH RECORD
  map(updatableFields, (field) => {
    if (field in req.body) {
      updated[field] = req.body[field];
    }
  });

  Record
    .findByIdAndUpdate(req.params.id, {
      $set: updated
    }, {
      new: true
    })
    .exec()
    .then(updatedRecord => {
      let message = `Successfully updated the record with an id of ${req.params.id}`;
      logger.info(message);
      res.status(201).json(updatedRecord);
    })
    .catch(err => {
      res.status(500).json({
        error: 'INTERNAL SERVER ERROR. THE WORLD IS ENDING AS WE KNOW IT.'
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
      if (release.results.length > 0) {
        res.json(release.results);
      } else {
        res.json({
          error: 'No results found. Please try your search again.'
        });
      };
    })
    .catch((err) => {
      logger.error(err);
      res.status(500).json({
        error: `INTERNAL SERVER ERROR. DISCOGS MACHINE BROKE.`
      });
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
        logger.info(`Your app is listening on port ${PORT}.`);
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
      logger.info('Closing server. Goodbye old friend.');
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