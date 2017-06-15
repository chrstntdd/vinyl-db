const passport = require('passport');
const { User } = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;

module.exports = function (passport) {

  // CONFIGURATION AND SETTINGS
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });

  // LOCAL SIGNUP

  passport.use('local-signup', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    },
    (req, email, password, done) => {
      process.nextTick(() => User.findOne({
        email: email
      }, (err, user) => {
        if (err) {
          return done(err);
        }
        if (user) {
          return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
        } else {
          var newUser = new User();
          newUser.email = email;
          newUser.password = newUser.generateHash(password);
          newUser.save((err) => {
            if (err) {
              throw err;
            }
            console.log(newUser);
            return done(null, newUser);
          });
        };
      }));
    }));

  // LOCAL LOGIN

  passport.use('local-login', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    },
    (req, email, password, done) => {
      User.findOne({ email: email }, (err, user) => {
        if (err) {
          logger.error(err);
          return done(err);
        };
        if (!user) {
          return done(null, false, req.flash('loginMessage', 'User does not exist, please sign up.' ));
        };
        if (!user.validPassword(password)) {
          return done(null, false, req.flash('loginMessage', 'Invalid password try again.' ));
        };
        console.log('Successfully logged in');
        return done(null, user);
      });
    }));
};