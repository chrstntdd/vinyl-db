const express = require('express');
const passport = require('./passport');
const utilities = require('../models/util');
const map = require('lodash.map');
const logger = require('./logger').logger;
const Discogs = require('disconnect').Client;

const { User } = require('../models/user');

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
  res.render('index', {userId: JSON.stringify(req.session.userId)});
});

// SEARCH VIEW
router.get('/search', isLoggedIn, (req, res) => {
  res.render('search', {userId: JSON.stringify(req.session.userId)});
});

// SEARCH DETAILS VIEW
router.get('/search/details', isLoggedIn, (req, res) => {
  res.render('search-details', {userId: JSON.stringify(req.session.userId)});
});

// COLLECTION VIEW
router.get('/collection', isLoggedIn, (req, res) => {
  res.render('collection', {userId: JSON.stringify(req.session.userId)});
});

// COLLECTION DETAILS VIEW
router.get('/collection/details', isLoggedIn, (req, res) => {
  res.render('collection-details', {userId: JSON.stringify(req.session.userId)});
});

// COLLECTION DETAILS VIEW
router.get('/collection/details/edit', isLoggedIn, (req, res) => {
  res.render('collection-edit', {userId: JSON.stringify(req.session.userId)});
});

// SIGN-UP VIEW
router.route('/signup')
  .get((req, res) => res.render('signup'))
  .post((req, res, next) => {
    passport.authenticate('local-signup', (err, user, info) => {
      if (err) {
        return next(err); //GENERATES A 500 ERROR
      }
      if (!user) {
        return res.status(409);
      }
      req.login(user, (err) => {
        if (err) {
          console.error(err);
          return next(err);
        }
        return res.redirect('/');
      });
    })(req, res, next);
  });

// LOGIN VIEW
router.route('/login')
  .get((req, res) => res.render('login'))
  .post((req, res, next) => {
    passport.authenticate('local-login', (err, user, info) => {
      if (err) {
        return next(err) //GENERATES A 500 ERROR
      };
      if (!user) {
        return res.status(409);
      };
      req.login(user, (err) => {
        if (err) {
          console.error(err);
          return next(err);
        };
        req.session.userId = user.$__._id; // SET USER ID FOR USE BY CLIENT API CALLS
        return res.redirect('/');
      });
    })(req, res, next);
  });

// LOGOUT HANDLER
router.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  return res.redirect('/');
});

//=================================================
// RECORD API CRUD OPERATIONS =====================
//=================================================

// RETRIEVE ALL RECORDS
router.get('/records/:userId', (req, res) => {
  User
    .findById(req.params.userId)
    .then((res) => {
      let records = res.music;
      return records;
    })
    .then(records => res.json(records))
    .catch((err) => {
      logger.error(err);
      res.status(500).json({
        error: 'INTERNAL SERVER ERROR. IT BLEW UP.',
      });
    });
});

// RETRIEVE RECORD BY ID
router.get('/records/:userId/:id', (req, res) => {
  User
    .findById(req.params.userId)
    .then((res) => {
      let record = res.music.id(req.params.id);
      return record;
    })
    .then(record => res.json(record))
    .catch((err) => {
      logger.error(err);
      res.status(500).json({
        error: 'INTERNAL SERVER ERROR. EVERYTHING IS ON FIRE',
      });
    });
});

// POST NEW RECORD
router.post('/records/:userId', (req, res) => {
  const reqFields = ['artist', 'album', 'releaseYear', 'genre'];
  map(reqFields, (field) => {
    if (!(field in req.body)) {
      const message = `Missing ${field} in the request body.`;
      logger.error(message);
      return res.status(400).send(message);
    }
  });

  User
    .findById(req.params.userId)
    .then((res) => {
      let newRecord = {
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
      }
      res.music.push(newRecord);
      res.save();
      return newRecord;
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
router.delete('/records/:userId/:id', (req, res) => {
  User
    .findById(req.params.userId)
    .then((res) => {
      res.music.pull(req.params.id);
      res.save()
    })
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
router.put('/records/:userId/:id', (req, res) => {
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
  
  // DOESN'T USE THE CHECK FROM ABOVE TO SET NEW CONTENT
  User
    .findById(req.params.userId)
    .then((res) => {
      let subDoc = res.music.id(req.params.id);
      subDoc.set(req.body);
      res.save();
    })
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
