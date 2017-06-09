const { User } = require('./user');

const errHandler = (err) => {
  console.error('There was an error performing the operation');
  console.log(err);
  console.log(err.code);
  return console.error(err.message);
}

const validationErr = (err, res) => {
  Object.keys(err.errors).forEach((k) => {
    var msg = err.errors[k].message;
    console.error('Validation error for \'%s' + ': %s', k, msg);
    return res.status(404).json({
      msg: 'Please ensure required fields are filled'
    });
  });
}

const createNewUser = (req, res) => {
  return User.create({
    email: req.body.email,
    password: req.body.password,
  }, (err, user) => {
    if (err) {
      console.error('There was an error creating the user');
      console.error(err.code);
      console.error(err.name);
      if (err.name == 'ValidationError') {
        return validationErr(err, res);
      } else {
        return errHandler(err);
      }
    }
    console.log('New user successfully created...');
    console.log(user.email);
    return res.json({
      msg: 'User created!',
      id: user._id,
      email: user.email
    });
  })
}

const findUser = (req, res) => {
  return User.findOne({
      email: req.params.email
    }, 'email',
    (err, user) => {
      if (err) {
        return errHandler(err);
      }
      if (user == null) {
        return res.json({
          msg: 'User does not exist in the dBase, please' +
            ' sign up to login as a user'
        });
      }
      console.log(user.email);
      return res.json(user);
    });
}

const viewAllUsers = (req, res) => {
  return User.find({},
    (err, users) => {
      if (err) {
        return errHandler(err);
      }
      console.log(users);
      return res.json(users);
    });
}

const updateUser = (req, res) => {
  return User.findOne({
      email: req.params.email
    },
    (err, user) => {
      if (err) {
        return errHandler(err);
      }
      console.log(user);
      user.email = req.body.email;
      user.password = req.body.password;
      user.save((err, user) => {
        if (err) {
          return errHandler(err);
        }
        console.log('User updated: ', user);
        return res.json(user);
      });
    });
}

const deleteUser = (req, res) => {
  return User.findOneAndRemove({
      email: req.params.email
    },
    (err, user) => {
      if (err) {
        return errHandler(err);
      }
      console.log('User deleted ', user);
      return res.json(user);
    });
}

module.exports = {
  errHandler: errHandler,
  validationErr: validationErr,
  createNewUser: createNewUser,
  findUser: findUser,
  viewAllUsers: viewAllUsers,
  updateUser: updateUser,
  deleteUser: deleteUser
};