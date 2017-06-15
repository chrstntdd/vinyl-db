module.exports = function(app, passport){
  const express = require('express');
  require('dotenv').config();
  const utilities = require('../models/util');
  const map = require('lodash.map');
  const trim = require('lodash.trim');
  const logger = require('./logger').logger;
  const Discogs = require('disconnect').Client;

  const { User } = require('../models/user');

  const SMTP_URL = process.env.SMTP_URL;
  const FROM_EMAIL = process.env.FROM_EMAIL

  const router = express.Router();

  const db = new Discogs({
    consumerKey: process.env.CONSUMER_KEY,
    consumerSecret: process.env.CONSUMER_SECRET,
  }).database();

  const isLoggedIn = (req, res, next) => {
    req.isAuthenticated() ? next() : res.redirect('/login');
  };


  // ROOT / HOMEPAGE
  router.get('/', (req, res) => {
    res.render('index', { user: req.user });
  });

  // SEARCH VIEW
  router.get('/search', isLoggedIn, (req, res) => {
    res.render('search', { user: req.user });
  });

  // SEARCH RESULTS VIEW
  router.get('/search/results', isLoggedIn, (req, res) => {
    res.render('search-results', 
    { userId: req.session.userId,
      title: `${req.session.searchResult.title} - ${req.session.searchResult.artists[0].name}`,
      genre: req.session.searchResult.genres[0],
      thumb: req.session.searchResult.images[0].resource_url,
      year: req.session.searchResult.year,
      discogsId: req.session.searchResult.id,
      searchResult: JSON.stringify(req.session.searchResult),
      user: req.user,
    });
  });

  // SEARCH DETAILS VIEW
  router.get('/search/details', isLoggedIn, (req, res) => {
    res.render('search-details',
    { userId: req.session.userId,
      artist: req.session.searchResult.artists[0].name,
      album: req.session.searchResult.title,
      genre: req.session.searchResult.genres[0],
      thumb: req.session.searchResult.images[0].resource_url,
      year: req.session.searchResult.year,
      discogsId: req.session.searchResult.id,
      searchResult: JSON.stringify(req.session.searchResult),
      user: req.user,
    });
  });

  // COLLECTION VIEW
  router.get('/collection', isLoggedIn, (req, res) => {
    res.render('collection', { user : req.user });
  });

  // COLLECTION DETAILS VIEW
  router.get('/collection/details', isLoggedIn, (req, res) => {
    res.render('collection-details', { user: req.user });
  });

  // COLLECTION DETAILS VIEW
  router.get('/collection/details/edit', isLoggedIn, (req, res) => {
    res.render('collection-edit', { user: req.user });
  });

  // SIGN-UP VIEW
  router.route('/signup')
    .get((req, res) => {
      res.render('signup', {
        user: req.user,
        message: req.flash('signupMessage')
      });
    })
    .post(
      passport.authenticate('local-signup', {
        successRedirect: '/collection',
        failureRedirect: '/signup',
        failureFlash: true,
      }));

// LOGIN VIEW
router.route('/login')
  .get((req, res) => {
    res.render('login', {
      user: req.user,
      message: req.flash('loginMessage'),
    });
  })
  .post(
    passport.authenticate('local-login', {
      successRedirect: '/collection',
      failureRedirect: '/login',
      failureFlash: true,
    }));

  // FORGOT VIEW
  router.route('/forgot')
    .get((req, res) => {
      res.render('forgot', { user: req.user });
    })
    .post((req, res, next) => {
      async.waterfall([
        (done) => {
          crypto.randomBytes(20, (err, buf) => {
            let token = buf.toString('hex');
            done(err, token);
          });
        },
        (token, done) => {
          User.findOne({ email: req.body.email }, (err, user) => {
            if (!user) {
              req.flash('error', 'No account with that email exists');
              return res.redirect('/forgot');
            }
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 HOUR

            user.save((err) => done(err, token, user));
          });
        },
        (token, user, done) => {
          const transporter = nodemailer.createTransport(SMTP_URL);
          const emailData = {
            to: user.email,
            from: FROM_EMAIL,
            subject: 'Node.js Password Reset',
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
              'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
              'http://' + req.headers.host + '/reset/' + token + '\n\n' +
              'If you did not request this, please ignore this email and your password will remain unchanged.\n',
          };
          transporter.sendMail(emailData, (err) => {
            req.flash('info', `An e-mail has been sent to ${user.email} with further instructions.`);
            done(err, done);
          });
        },
      ], (err) => {
        if (err) return next(err);
        res.redirect('/forgot');
      });
    });

  // RESET PASSWORD VIEW
  router.route('/reset/:token')
    .get((req, res) => {
      User.findOne({
        resetPasswordToken: req.params.token, 
        resetPasswordExpires: { $gt: Date.now() },
      })
      .then((err, user) => {
        if(!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/forgot');
        }
        res.render('reset', { user: req.user });
      });
    })
    .post((req, res) => {
      async.waterfall([
        (done) => {
          User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
          }, (err, user) => {
            if (!user) {
              req.flash('error', 'Password reset token is invalid or has expired.');
              return res.redirect('back');
            };

            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save((err) => {
              req.logIn(user, (err) => {
                done(err, user);
              });
            });
          });
        },
        (user, done) => {
          const transporter = nodemailer.createTransport(SMTP_URL);
          const emailData = {
            to: user.email,
            from: FROM_EMAIL,
            subject: 'Your password has been changed',
            text: `Hello,\n\n This is a confirmation that the password for your account ${user.email} has just been changed.\n`
          };
          transporter.sendMail(emailData, (err) => {
            req.flash('success', 'Success! Your password has been changed.');
            done(err, done);
          });
        },
      ], (err) => res.redirect('/'));
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
      type: 'release',
      format: 'vinyl',
    })
      .then((release) => {
        if (release.results.length > 0) {
          // MAKE CALL FOR DETAILS
          db.getRelease(release.results[0].id)
            .then((response) => {
              // ADD SEARCH RESULTS TO SESSION FOR RENDER IN RESULTS VIEW
              req.session.searchResult = response;
              res.json(response);
            })
            .catch((err) => {
              logger.info(err);
            });
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
  return router;
};
