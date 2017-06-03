'use strict';

const winston = require('winston');

const consoleOptions = {
  level: 'debug',
  handleExceptions: true,
  colorize: true,
  prettyPrint: true
};

// SUPRESS WINSTON OUTPUT WHEN RUNNING TESTS
if (process.env.NODE_ENV !== 'test') {
  let logger = new(winston.Logger)({
    transports: [
      new(winston.transports.Console)(consoleOptions),
    ]
  });
  logger.stream = {
    write: (message, encoding) => {
      logger.debug(message);
    }
  };
  module.exports = { logger }
} else {
  let logger = new(winston.Logger)({
    transports: [
      new(winston.transports.Console)
    ]
  })
  logger.remove(winston.transports.Console);
  logger.stream = {
    write: (message, encoding) => {
      logger.debug(message);
    }
  };
  module.exports = { logger }
}