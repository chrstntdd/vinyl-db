const mongoose = require('mongoose');
const { recordSchema } = require('./records');
const bcrypt = require('bcrypt-nodejs');

const userSchema = mongoose.Schema({
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	admin: { type: Boolean, default: false },
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	created_on: { type: Date, default: Date.now },
	music: [ recordSchema ],
});

userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = { User };
