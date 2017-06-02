require('dotenv').config();
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const _ = require('lodash');
const faker = require('faker');

const should = chai.should();

process.env.NODE_ENV = 'test';

const { app, runServer, closeServer } = require('../src/server');
const { Record } = require('../models/records'); //Load models
const { TEST_DATABASE_URL } = process.env.TEST_DATABASE_URL;

chai.use(chaiHttp);

const seedRecords = () => {
  const seedData = [];

  for (let i = 0; i < 10; i++) {
    seedData.push(generateRecord());
  }
  return Record.insertMany(seedData);
}

const generateRecord = () => {
  return {
    artist: faker.name.firstName(),
    album: faker.lorem.word(),
    releaseYear: faker.random.number({min:1950, max:2017}),
    purchaseDate: faker.date.recent(),
    genre: faker.random.arrayElement(['Rock', 'Electronic', 'Rap', 'Shoegaze', 'Psychedelic']),
    rating: faker.random.number({min:0, max:5}),
    mood: faker.random.arrayElement(['happy','sad','okay']),
    playCount: faker.random.number({min:0, max:100}),
    notes: faker.lorem.sentence(),
    vinylColor: faker.commerce.color(),
    accolades: faker.random.arrayElement(['best', 'worst', 'longest', 'shortest'])
  }
}

const tearDownDb = () => {
  return mongoose.connection.dropDatabase();
}

describe('Record collection API endpoints', () => {

  before(() => runServer(TEST_DATABASE_URL));
  beforeEach(() => seedRecords());
  afterEach(() => tearDownDb());
  after(() => closeServer());

  describe('GET endpoint', () => {
    it('should return all existing records', () => {
      let res;
      return chai.request(app)
        .get('/records')
        .then(_res => {
          res = _res;
          res.should.have.status(200);
          res.body.should.have.length.of.at.least(1);
          return Record.count();
        })
        .then(count => {
          res.body.should.have.length.of(count);
        });
    });
    it('should return records with the required fields', () => {
      let resRecord;
      return chai.request(app)
        .get('/records')
        .then(res => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.an('array');
          res.body.should.have.length.of.at.least(1);
          res.body.forEach(record => {
            record.should.be.an('object');
            record.should.include.keys('_id', 'artist', 'album', 'releaseYear', 'genre');
          });
          resRecord = res.body[0];
          return Record.findById(resRecord._id)
        })
        .then(record => {
          resRecord._id.should.equal(record._id.toString());
          resRecord.artist.should.equal(record.artist);
          resRecord.album.should.equal(record.album);
          resRecord.releaseYear.should.equal(record.releaseYear);
          resRecord.genre.toString().should.equal(record.genre.toString());
          resRecord.rating.should.equal(record.rating);
          resRecord.mood.toString().should.equal(record.mood.toString());
          resRecord.playCount.should.equal(record.playCount);
          resRecord.notes.should.equal(record.notes);
          resRecord.vinylColor.should.equal(record.vinylColor);
          resRecord.accolades.toString().should.equal(record.accolades.toString());
        });
    });
  });
  describe('POST endpoint', () => {
    it('should add a new record', () => {
      let newRecord = generateRecord();

      return chai.request(app)
        .post('/records')
        .send(newRecord)
        .then(res => {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.an('object');
          res.body.should.include.keys('artist', 'album', 'releaseYear','genre');
          res.body._id.should.not.be.null;
          res.body.artist.should.equal(newRecord.artist);
          res.body.album.should.equal(newRecord.album);
          res.body.releaseYear.should.equal(newRecord.releaseYear);
          res.body.genre.toString().should.equal(newRecord.genre);
          return Record.findById(res.body._id).exec();
        })
        .then(record => {
          record.artist.should.equal(newRecord.artist);
          record.album.should.equal(newRecord.album);
          record.releaseYear.should.equal(newRecord.releaseYear);
          record.genre.toString().should.equal(newRecord.genre);
        });
    });
  });
  describe('PUT endpoint', () => {
    it('should update the fields of the record passed into the params', () => {
      let updatedRecord = {
        artist: 'The National',
        album: 'Trouble Will Find Me',
        releaseYear: 2013,
        purchaseDate: new Date(2017, 3, 27),
        genre: 'rock',
        rating: 5,
        mood: ['Melancholy', 'Introspective'],
        playCount: 6,
        notes: 'Something',
        vinylColor: 'Gold',
        accolades: ['Most recent']
      };

      return Record
        .findOne()
        .exec()
        .then(record => {
          updatedRecord._id = record._id;

          return chai.request(app)
            .put(`/records/${record._id}`)
            .send(updatedRecord)
        })
        .then(res => {
          res.should.have.status(201);
          return Record.findById(updatedRecord._id).exec();
        })
        .then(record => {
          record.artist.should.equal(updatedRecord.artist);
          record.album.should.equal(updatedRecord.album);
          record.releaseYear.should.equal(updatedRecord.releaseYear);
          record.genre.toString().should.equal(updatedRecord.genre);
        });
    });
  });
  describe('DELETE endpoint', () => {
    it('should delete the record with an id matching the url id param', () => {
      let record;

      return Record
        .findOne()
        .exec()
        .then(_record => {
          record = _record;
          return chai.request(app).delete(`/records/${record._id}`);
        })
        .then(res => {
          res.should.have.status(204);
          return Record.findById(record._id).exec();
        })
        .then(_record => {
          should.not.exist(_record);
        });
    });
  });
});