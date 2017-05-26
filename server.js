require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const Discogs = require('disconnect').Client;

const app = express();

const db = new Discogs({
  consumerKey: process.env.CONSUMER_KEY,
  consumerSecret: process.env.CONSUMER_SECRET
}).database();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(morgan('common'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('*', (req, res) => {
  res.status(404).json({
    message: '404 ERROR: Page not found.'
  });
});

app.post('/search', (req, res) => {

  let artist = req.body.artist;
  let album = req.body.album;

  db.search(artist, {
      artist: artist,
      title: album,
      release_title: album
    })
    .then((release) => {
      res.json(release.results);
    });
});


app.listen(PORT = process.env.PORT || 2727, () => {
  console.log(`Listening on port ${PORT}`);
});