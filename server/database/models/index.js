const fs = require('fs');

const rollbar = require('../../commons/rollbar');

require('..');

const models = {};

const get = Model => (where = {}, { sort = {}, skip = 0, limit = 0 } = {}) =>
  new Promise(resolve => {
    Model.find(where)
      .lean({ defaults: true })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .then(resolve)
      .catch(error => {
        rollbar.error(error);
        resolve(null);
      });
  });
const Delete = Model => (where = {}) =>
  new Promise(resolve => {
    Model.deleteMany(where)
      .then(resolve)
      .catch(error => {
        rollbar.error(error);
        resolve(null);
      });
  });
const save = Model => obj =>
  new Promise(resolve => {
    const model = new Model(obj);
    model.save(saveError => {
      if (saveError) {
        console.error(saveError);
        return resolve(null);
      }
      resolve(true);
    });
  });
const update = Model => (where, obj) =>
  new Promise(resolve => {
    Model.updateMany(where, obj, (error, data) => {
      if (error) {
        console.error(error);
        return resolve(null);
      }
      resolve(data.nModified);
    });
  });
const insertOrUpdate = Model => (where, obj) =>
  new Promise(resolve => {
    Model.updateMany(where, obj, { upsert: true, setDefaultsOnInsert: true }, error => {
      if (error) {
        console.error(error);
        return resolve(null);
      }
      resolve(true);
    });
  });

fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.slice(-3) === '.js')
  .forEach(file => {
    file = file.substring(0, file.length - 3);
    const Model = require(`./${file}`);
    models[file] = {
      save: save(Model),
      get: get(Model),
      delete: Delete(Model),
      update: update(Model),
      insertOrUpdate: insertOrUpdate(Model)
    };
  });

module.exports = models;
