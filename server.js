require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const Discogs = require('disconnect').Client;

const app = express();

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

const db = new Discogs({
  consumerKey: process.env.CONSUMER_KEY,
  consumerSecret: process.env.CONSUMER_SECRET
}).database();

db.search('Basement', {
    release_title: 'Songs About The Weather'
  })
  .then(function (release) {
    console.log(release.results);
  });


app.listen(PORT = 2727, () => {
  console.log(`Listening on port ${PORT}`);
});