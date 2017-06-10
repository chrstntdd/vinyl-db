const passport = require('passport');
const { User } = require('../models/user');
const utilities = require('../models/util');

var errHandler = utilities.errHandler;
var LocalStrategy = require('passport-local').Strategy;


// CONFIGURATION AND SETTINGS
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    if (err) {
      console.error(`There was an error accessing the records of the user with id ${id}`);
      return console.log(err.message);
    };
    return done(null, user);
  });
});

// LOCAL SIGNUP

passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
  },
  (req, email, password, done) => {
    process.nextTick(() => User.findOne({ email: email }, (err, user) => {
      if (err) {
        return errHandler(err);
      }
      if (user) {
        console.log('User already exists.');
        return done(null, false, {
          errMsg: 'email already exists'
        });
      } else {
        var newUser = new User();
        newUser.username = req.body.username;
        newUser.email = email;
        newUser.password = newUser.generateHash(password);
        newUser.save((err) => {
          if (err) {
            console.log(err);
            if (err.message == 'User validation failed') {
              console.log(err.message);
              return done(null, false, {
                errMsg: 'Please fill out all the fields.'
              });
            }
            return errHandler(err);
          }
          console.log(`New user successfully created: ${newUser.username}`);
          console.log(`Email: ${email}`);
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
    User.findOne({ email: email}, (err, user) => {
      if (err) {
        return errHandler(err);
      };
      if (!user) {
        return done(null, false, {
          errMsg: 'User does not exist, please' +
            ' <a class="errMsg" href="/signup">signup</a>'
        });
      };
      if (!user.validPassword(password)) {
        return done(null, false, {
          errMsg: 'Invalid password try again'
        });
      };
      console.log('Successfully logged in');
      return done(null, user);
    });
  }));

  module.exports = passport;