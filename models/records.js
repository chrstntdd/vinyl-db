const mongoose = require('mongoose');

const recordSchema = mongoose.Schema({
  artist: { type: String, required: true },
  album: { type: String, required: true },
  releaseYear: { type: Number, required: true },
  purchaseDate: Date,
  genre: { type: [String], required: true },
  rating: Number,
  mood: [String],
  playCount: { type: Number, default: 0 },
  notes: String,
  vinylColor: String,
  accolades: [String],
  discogsId: Number,
  thumb: String,
});

module.exports = { recordSchema };
