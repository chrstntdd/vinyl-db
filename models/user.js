const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  created_on: {
    type: Date,
    default: Date.now,
  }
});

const User = mongoose.model('User', userSchema);

module.exports = { userSchema };
