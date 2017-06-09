const express = require('express');
const passport = require('./passport');
const utilities = require('../models/util');
const map = require('lodash.map');
const logger = require('./logger').logger;
const Discogs = require('disconnect').Client;
const path = require('path');


const { Record } = require('../models/records');

const router = express.Router();

const db = new Discogs({
  consumerKey: process.env.CONSUMER_KEY,
  consumerSecret: process.env.CONSUMER_SECRET,
}).database();

const isLoggedIn = (req, res, next) => {
  req.isAuthenticated() ? next() : res.redirect('/login');
};


const errHandler = utilities.errHandler;
const validationErr = utilities.validationErr;
const createNewUser = utilities.createNewUser;
const findUser = utilities.findUser;
const viewAllUsers = utilities.viewAllUsers;
const updateUser = utilities.updateUser;
const deleteUser = utilities.deleteUser;

// MIDDLEWARE
router.use(passport.initialize());
router.use(passport.session());

// ROOT / HOMEPAGE
router.get('/', (req, res) => {
  res.render('index');
});

// SEARCH VIEW
router.get('/search', (req, res) => {
  res.render('search');
});

// SEARCH DETAILS VIEW
router.get('/search/details', (req, res) => {
  res.render('search-details');
});

// COLLECTION VIEW
router.get('/collection', (req, res) => {
  res.render('collection');
});

// COLLECTION DETAILS VIEW
router.get('/collection/details', (req, res) => {
  res.render('collection-details');
});

// COLLECTION DETAILS VIEW
router.get('/collection/details/edit', (req, res) => {
  res.render('collection-edit');
});

// SIGN-UP VIEW
router.get('/signup', (req, res) => {
  
});

router.route('/signup')
  .get((req, res) => {
    res.sendFile(path.join(__dirname, '../public/views', 'signup.html'));
  })
  .post((req, res, next) => {
    passport.authenticate('local-signup', (err, user, info) => {
      if (err) {
        return next(err); //GENERATES A 500 ERROR
      }
      if (!user) {
        return res.status(409);
      }
      req.login((err) => {
        if (err) {
          console.error(err);
          return next(err);
        }
        return res.redirect('/home');
      });
    })(req, res, next);
  });

router.get('/home', isLoggedIn, (req, res) => {
  return res.sendFile(path.join(__dirname, '../public/views', 'home.html'));
});


// RECORD API CRUD OPERATIONS =====================

// RETRIEVE ALL RECORDS
router.get('/records', (req, res) => {
  Record
    .find()
    .exec()
    .then(records => res.json(records))
    .catch((err) => {
      logger.error(err);
      res.status(500).json({
        error: 'INTERNAL SERVER ERROR. IT BLEW UP.',
      });
    });
});

// RETRIEVE RECORD BY ID
router.get('/records/:id', (req, res) => {
  Record
    .findById(req.params.id)
    .exec()
    .then(record => res.json(record))
    .catch((err) => {
      logger.error(err);
      res.status(500).json({
        error: 'INTERNAL SERVER ERROR. EVERYTHING IS ON FIRE',
      });
    });
});

// POST NEW RECORD
router.post('/records', (req, res) => {
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
      accolades: req.body.accolades,
      discogsId: req.body.discogsId,
      thumb: req.body.thumb,
    })
    .then(newRecord => res.status(201).json(newRecord))
    .catch((err) => {
      logger.error(err);
      res.status(500).json({
        error: 'N-TERNAL SERVER ERROR. PRAY FOR HELP',
      });
    });
});

// DELETE RECORD BY ID
router.delete('/records/:id', (req, res) => {
  Record
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(() => {
      let message = `Successfully deleted the record with an id of ${req.params.id}`;
      logger.info(message);
      res.status(204).json({
        message: message,
      }).end();
    })
    .catch((err) => {
      logger.error(err);
      res.status(500).json({
        error: 'INTERNAL SERVER ERROR. BREAK ALL THE WINDOWS.',
      });
    });
});

// UPDATE RECORD BY ID
router.put('/records/:id', (req, res) => {
  if (!(req.params.id && req.body.id === req.body.id)) {
    res.status(400).json({
      error: 'Request path id and request body id must match. Try again.',
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
      $set: updated,
    }, {
      new: true,
    })
    .exec()
    .then((updatedRecord) => {
      let message = `Successfully updated the record with an id of ${req.params.id}`;
      logger.info(message);
      res.status(201).json(updatedRecord);
    })
    .catch((err) => {
      logger.error(err);
      res.status(500).json({
        error: 'INTERNAL SERVER ERROR. THE WORLD IS ENDING AS WE KNOW IT.',
      });
    });
});

// MAIN API CALL FOR DISCOGS SEARCH
router.post('/search', (req, res) => {
  let artist = req.body.artist;
  let album = req.body.album;

  db.search(artist, {
    artist: artist,
    title: album,
    release_title: album,
    format: 'vinyl',
  })
    .then((release) => {
      if (release.results.length > 0) {
        res.json(release.results);
      } else {
        res.json({
          error: 'No results found. Please try your search again.',
        });
      }
    })
    .catch((err) => {
      logger.error(err);
      res.status(500).json({
        error: 'INTERNAL SERVER ERROR. DISCOGS MACHINE BROKE.',
      });
    });
});

// CATCH ALL HANDLERS
router.get('*', (req, res) => {
  res.status(404).json({
    message: '404 ERROR: Page not found.',
  });
});

router.use((err, req, res) => {
  logger.error(err);
  res.status(500).json({
    error: 'Something went wrong',
  }).end();
});

module.exports = router;