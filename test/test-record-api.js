require('dotenv').config();
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const some = require('lodash.some')
const faker = require('faker');
const should = chai.should();
chai.use(chaiHttp);

process.env.NODE_ENV = 'test';

const { app, runServer, closeServer } = require('../src/server');
const { User } = require('../models/user');
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

const seedUser = () => {
  let testUser = generateUser()
  // console.log(testUser);
  return User.insertMany(testUser);
}

const generateRecord = () => {
  return {
    artist: faker.name.firstName(),
    album: faker.lorem.word(),
    releaseYear: faker.random.number({ min: 1950, max: 2017 }),
    purchaseDate: faker.date.recent(),
    genre: faker.random.arrayElement(['Rock', 'Electronic', 'Rap', 'Shoegaze', 'Psychedelic']),
    rating: faker.random.number({ min: 0, max: 5 }),
    mood: faker.random.arrayElement(['happy', 'sad', 'okay']),
    playCount: faker.random.number({ min: 0, max: 100 }),
    notes: faker.lorem.sentence(),
    vinylColor: faker.commerce.color(),
    accolades: faker.random.arrayElement(['best', 'worst', 'longest', 'shortest']),

  };
}

const generateUser = () => {
  let user = {
    password: faker.internet.password(),
    email: faker.internet.email(),
    created_on: faker.date.recent(),
    admin: faker.random.boolean(),
    music: [],
  };
  // GENERATE 10 RANDOM RECORDS
  for (let i = 0; i < 10; i++) {
    user.music.push(generateRecord());
  }
  return user;
}

const tearDownDb = () => {
  return mongoose.connection.dropDatabase();
}

describe('The API', () => {

  before(() => runServer(TEST_DATABASE_URL));
  beforeEach(() => seedUser());
  afterEach(() => tearDownDb());
  after(() => closeServer());

  describe('*GET endpoint', () => {
    it('should return all records for a given user', () => {
      let userId;
      return User
        .findOne()
        .exec()
        .then((userObject) => {
          userId = userObject.id;
          return chai.request(app)
            .get(`/records/${userId}`)
            .then((res) => {
              res.should.have.status(200);
              res.body.should.be.an('array');
              res.body.should.have.length.of.at.least(1);
            });
        });
    });
    it('should return the record specified by the id param', () => {
      let userId;
      let recordId;
      return User
        .findOne()
        .exec()
        .then((userObject) => {
          userId = userObject.id;
          recordId = userObject.music[0].id;
          return chai.request(app)
            .get(`/records/${userId}/${recordId}`)
            .then((res) => {
              res.should.have.status(200);
              res.body.should.be.an('object');
              res.body.should.include.keys('artist', 'album', 'releaseYear', 'purchaseDate', 'rating', 'notes', 'vinylColor', 'accolades', 'playCount', 'mood', 'genre');
            });
        });
    });
  });
  describe('*POST endpoint', () => {
    it('should post a new record to a given user\'s music collection', () => {
      let newRecord = generateRecord();
      let userId;
      return User
        .findOne()
        .exec()
        .then((userObject) => {
          userId = userObject.id;
          return chai.request(app)
            .post(`/records/${userId}`)
            .send(newRecord)
            .then((res) => {
              res.should.have.status(201);
              res.should.be.json;
              res.body.should.be.an('object');
              res.body.should.include.keys('artist', 'album', 'releaseYear', 'purchaseDate', 'rating', 'notes', 'vinylColor', 'accolades', 'playCount', 'mood', 'genre');
            });
        });
    });
  });
  describe('*DELETE endpoint', () => {
    it('should delete a record for a given user by id param', () => {
      let userId;
      let recordId;

      return User
        .findOne()
        .exec()
        .then((userObject) => {
          userId = userObject.id;
          recordId = userObject.music[0].id;
          return chai.request(app)
            .delete(`/records/${userId}/${recordId}`)
            .then((res) => {
              res.should.have.status(204);
              return User.findOne().exec();
            })
            .then((user) => {
              user.music.should.not.include(recordId)
            });
        });
    });
  });
  describe('*PUT endpoint', () => {
    it('should update a record\'s details for a given user', () => {
      let userId;
      let recordId;

      let updatedRecord = {
        artist: 'Young Thug',
        album: 'Beautiful Thugger Girls',
        releaseYear: 2017,
        genre: ['Country', 'Rap'],
      };

      return User
        .findOne()
        .exec()
        .then((userObject) => {
          userId = userObject.id;
          recordId = userObject.music[0].id;

          updatedRecord.id = recordId;
          return chai.request(app)
            .put(`/records/${userId}/${recordId}`)
            .send(updatedRecord)
        })
        .then((res) => {
          res.should.have.status(201);
          return User.findOne().exec()
        })
        .then((user) => {
          some(user.music, updatedRecord).should.be.true;
        });
    });
  });
});