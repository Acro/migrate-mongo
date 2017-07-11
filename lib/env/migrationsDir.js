'use strict';

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const configFile = require('./configFile');

const DEFAULT_MIGRATIONS_DIR_NAME = 'migrations';

function resolveMigrationsDirPath(config) {
  if (config != undefined) {
    return config.migrationsDir;
  }

  let migrationsDir;

  try {
    migrationsDir = configFile.read().migrationsDir;
    // if config file doesn't have migrationsDir key, assume default 'migrations' dir
    if (!migrationsDir) {
        migrationsDir = DEFAULT_MIGRATIONS_DIR_NAME;
    }
  } catch(err) {
    // config file could not be read, assume default 'migrations' dir
    migrationsDir = DEFAULT_MIGRATIONS_DIR_NAME;
  }

  if (path.isAbsolute(migrationsDir)) {
    return migrationsDir;
  } else {
    return path.join(process.cwd(), migrationsDir);
  }
}

module.exports = {

  resolve: resolveMigrationsDirPath,

  shouldExist(config, done) {
    let migrationsDir = resolveMigrationsDirPath(config);
    if (done == undefined) {
      done = config;
      migrationsDir = resolveMigrationsDirPath(config);
    } else {
      migrationsDir = config.migrationsDir;
    }

    return fs.stat(migrationsDir, (err) => {
      if (err) return done(new Error('migrations directory does not exist: ' + migrationsDir));
      return done();
    });
  },

  shouldNotExist(config, done) {
    const migrationsDir = resolveMigrationsDirPath(config);
    return fs.stat(migrationsDir, (err) => {
      if (err && err.code === 'ENOENT') return done();
      return done(new Error('migrations directory already exists: ' + migrationsDir));
    });
  },

  getFileNames(config, done) {
    const migrationsDir = resolveMigrationsDirPath(config);
    fs.readdir(migrationsDir, (err, files) => {
      if (err) return done(err);
      return done(null, files.filter((file) => path.extname(file) === '.js'));
    });
  },

  loadMigration(config, fileName) {
    return require(path.join(resolveMigrationsDirPath(config), fileName));
  }
};
