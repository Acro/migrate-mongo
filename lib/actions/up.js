'use strict';

const async = require('async');
const status = require('./status');
const shifting = require('shifting');
const _ = require('lodash');
const moment = require('moment');

let configFile = require('../env/configFile');
const migrationsDir = require('../env/migrationsDir');
const configWrapper = require('../helper/configWrapper');

module.exports = function (db, config, done) {
  if (done == undefined) {
    done = config
  } else {
    configFile = configWrapper
  }

  const upgraded = [];

  async.waterfall([
    (next) => status(db, config, next),
    function upgradePending(statusItems, next) {
      const pendingItems = _.filter(statusItems, {appliedAt: 'PENDING'});
      async.eachSeries(pendingItems, function (item, nextItem) {
        const migration = migrationsDir.loadMigration(config, item.fileName);
        shifting.call([migration, migration.up], db, (err) => {
          if (err) return nextItem(new Error('Could not migrate up ' + item.fileName + ': ' + err.message));

          const collectionName = configFile.read(config).changelogCollectionName;
          const collection = db.collection(collectionName);

          const fileName = item.fileName;
          const appliedAt = moment.utc().toDate();

          collection.insert({ fileName, appliedAt }, (err) => {
            if (err) return nextItem(new Error('Could not update changelog: ' + err.message));
            upgraded.push(item.fileName);
            nextItem();
          });
        });
      }, next);
    }
  ], (err) => done(err, upgraded));
};