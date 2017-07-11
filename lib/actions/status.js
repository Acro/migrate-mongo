'use strict';

const async = require('async');
const _ = require('lodash');

const migrationsDir = require('../env/migrationsDir');
let configFile = require('../env/configFile');
const configWrapper = require('../helper/configWrapper');

module.exports = function (db, config, done) {

  if (done == undefined) {
    done = config;
  } else {
    configFile = configWrapper;
  }

  const context = {};

  async.waterfall([
    migrationsDir.shouldExist.bind(this, config),
    configFile.shouldExist.bind(this, config),
    function fetchFilesInMigrationsDirectory(next) {
      migrationsDir.getFileNames(config, (err, fileNames) => {
        if (err) return next(err);
        context.fileNames = fileNames;
        next();
      });
    },
    function fetchContentOfChangeLog(next) {
      const collectionName = configFile.read(config).changelogCollectionName;
      const collection = db.collection(collectionName);
      collection.find({}).toArray((err, docs) => {
        if (err) return next(err);
        context.changelog = docs;
        next();
      });
    }
  ], function (err) {
    if (err) return done(err);
    const statusTable = context.fileNames.map((fileName) => {
      const itemInLog = _.find(context.changelog, {fileName});
      const appliedAt = itemInLog ? itemInLog.appliedAt.toJSON() : 'PENDING';
      return { fileName, appliedAt };
    });
    return done(null, statusTable);
  });
};