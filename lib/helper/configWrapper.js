'use strict';

module.exports = {
  shouldExist(config, done) {
    return done();
  },
  shouldNotExist(done) {
    return done();
  },
  read(config) {
    return config;
  }
};