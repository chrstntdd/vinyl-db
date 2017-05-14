const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(morgan('common'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('*', (req, res) => {
  res.status(400).json({
    message: '404 ERROR: Page not found.'
  });
})


app.listen(PORT = 2727, () => {
  console.log(`Listening on port ${PORT}`);
});