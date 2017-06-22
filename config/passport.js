const { User } = require('../models/user');
const LocalStrategy = require('passport-local').Strategy;

module.exports = (passport) => {
  // CONFIGURATION AND SETTINGS
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });

  // - - - - - - - - - - - - - - - - - - - - - - - - -
  // LOCAL SIGNUP
  // - - - - - - - - - - - - - - - - - - - - - - - - -
  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
  },
    (req, email, password, done) => {
      // VALIDATE WITH ERROR MESSAGES
      req.checkBody('email', 'Please enter a valid email.').notEmpty().isEmail();
      req.checkBody('password', 'Please enter a valid password that\'s at least 6 characters long.').notEmpty().isAlpha().isLength( {min: 6 });
      req.checkBody('password', 'Please make sure your two passwords match.').equals(req.body.confirmPassword);

      // SANITIZE
      req.sanitizeBody('email').normalizeEmail({
        all_lowercase: true,
        gmail_remove_dots: false,
      });
      req.sanitizeBody('email').escape();
      req.sanitizeBody('email').trim();
      req.sanitizeBody('password').escape();
      req.sanitizeBody('password').trim();

      // ASSIGN SANITIZED BODY VALUES BACK TO VARS
      email = req.body.email;
      password = req.body.password;

      process.nextTick(() => User.findOne({ email: email }, (err, user) => {
        if (user) {
          // IF THE EMAIL ALREADY EXISTS IN DATABASE
          return done(null, false, req.flash('signupMessage', 'Nice try, but that email is already taken.'));
        }

        req.asyncValidationErrors().then(() => {
          // NO ERRORS. CREATE NEW USER
          const newUser = new User();
          newUser.email = email;
          newUser.password = newUser.generateHash(password);
          newUser.save(() => {
            if (err) {
              throw err;
            }
            return done(null, newUser);
          });
        }).catch((errors) => {
          // CATCH ALL ERRORS THEN FLASH TO USER IN SIGNUP VIEW
          if (errors) {
            const messages = [];
            errors.forEach(error => messages.push(error.msg));
            return done(null, false, req.flash('signupMessage', messages));
          }
          return done();
        });
      }));
    }));

  // - - - - - - - - - - - - - - - - - - - - - - - - -
  // LOCAL LOGIN
  // - - - - - - - - - - - - - - - - - - - - - - - - -
  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
  },
    (req, email, password, done) => {
      // VALIDATE WITH ERROR MESSAGES
      req.checkBody('email', 'Please enter a valid email.').notEmpty().isEmail();
      req.checkBody('password', 'Please enter a valid password.').notEmpty().isAlpha();

      // SANITIZE
      req.sanitizeBody('email').normalizeEmail({
        all_lowercase: true,
        gmail_remove_dots: false,
      });
      req.sanitizeBody('email').escape();
      req.sanitizeBody('email').trim();
      req.sanitizeBody('password').escape();
      req.sanitizeBody('password').trim();

      // ASSIGN SANITIZED BODY VALUES BACK TO VARS
      email = req.body.email;
      password = req.body.password;

      req.asyncValidationErrors().then(() => {
          // NO ERRORS. VALIDATE EMAIL AND PASSWORD AGAINST DATABASE.
        User.findOne({ email: email }, (err, user) => {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false, req.flash('loginMessage', 'Looks like you don\'t have an account with us. Please sign up.'));
          }
          if (!user.validPassword(password)) {
            return done(null, false, req.flash('loginMessage', 'Your password looks a bit off. Please try again.'));
          }
          // SUCCESSFUL LOGIN!
          return done(null, user);
        });
      })
        .catch((errors) => {
          // CATCH ALL ERRORS THEN FLASH TO USER IN LOGIN VIEW
          if (errors) {
            const messages = [];
            errors.forEach(error => messages.push(error.msg));
            return done(null, false, req.flash('loginMessage', messages));
          }
          return done();
        });
    }));
};
