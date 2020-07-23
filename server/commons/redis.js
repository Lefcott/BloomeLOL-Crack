const { check } = require('@lefcott/filter-json');

require('./env');
const redis = require('redis').createClient(process.env.REDISCLOUD_URL);

const rollbar = require('./rollbar');

let active = false;

redis.on('error', err => {
  console.error(`Redis error: ${err}`);
});

redis.on('end', () => {
  active = false;
  console.log('Redis connection closed');
});

redis.on('connect', () => {
  active = true;
  console.log('Connected to REDIS!');
});

redis.isActive = () => active;

/**
 * Finds documents on redis, returning array of JSON and array of strings or null
 * @param {string} key Redis key to search on
 * @param {*} where Where filter
 * @returns {Promise.<{string: string[], json: *[]}>}
 */
redis.Find = (key, where = {}) =>
  new Promise(resolve => {
    redis.smembers(key, (error, docs) => {
      if (error) {
        console.error(__filename, 'Find', error);
        return resolve({ string: null, json: null });
      }
      const results = { string: [], json: [] };
      if (docs.length === 0) return resolve(results);
      const objs = docs.map(doc => JSON.parse(doc));
      for (let k = 0; k < objs.length; k += 1)
        if (check(objs[k], where)) {
          results.string.push(docs[k]);
          results.json.push(objs[k]);
        }
      resolve(results);
    });
  });

/**
 * Add documents to redis, returning true, false or null
 * @param {string} key Key to add register on
 * @param {*[]} registers Registers to add
 * @returns {Promise.<number>}
 */
redis.Add = (key, registers) =>
  new Promise(resolve => {
    let regs = Array.isArray(registers) ? registers : [registers];
    regs = regs.map(reg => JSON.stringify(reg));
    redis.sadd(key, ...regs, (error, added) => {
      if (error) {
        console.error(__filename, 'Add', error);
        return resolve(null);
      }
      resolve(added);
    });
  });

/**
 * Adds a value to a key to Redis
 * @param {string} key Key to set value
 * @param {string} value Value to set
 * @param {number} expire DEFAULT null expiration in seconds
 * @returns {Promise.<{added: string, expired: number}>}
 */
redis.Set = (key, value, expire = null) =>
  new Promise(resolve => {
    redis.set(key, value, (error, added) => {
      if (error) {
        rollbar.error(error);
        return resolve(null);
      }
      if (!expire || typeof expire !== 'number') return resolve({ added, expired: 0 });
      redis.expire(key, expire, (expError, expired) => {
        if (expError) {
          rollbar.error(expError);
          return resolve(null);
        }
        resolve({ added, expired });
      });
    });
  });

/**
 * Gets the value of a key
 * @param {string} key Key to set value
 * @param {string} value Value to set
 * @param {number} expire DEFAULT null expiration in seconds
 * @returns {Promise.<{added: number, expired: number}>}
 */
redis.Get = key =>
  new Promise(resolve => {
    redis.get(key, (error, result) => {
      if (error) {
        rollbar.error(error);
        return resolve(null);
      }
      resolve(result);
    });
  });

/**
 * Removes documents in redis, returning number of deleted documets or null
 * @param {string} key Key to add register on
 * @param {*} where Where filter
 * @returns {Promise.<number>}
 */
redis.Delete = (key, where = {}) =>
  new Promise(async resolve => {
    const { string: regs } = await redis.Find(key, where);
    if (!regs) return resolve(null);
    if (regs.length === 0) return resolve(0);
    redis.srem(key, ...regs, (error, deleted) => {
      if (error) {
        console.error(__filename, 'Delete', error);
        return resolve(null);
      }
      resolve(deleted);
    });
  });
/**
 * Updates documents on redis, returning number of updated registers or null
 * @param {string} key Redis key to search on
 * @param {*} where Where filter (Used when strRegisters is not passed)
 * @param {*} update JSON containing values to be updated
 * @param {string[]=} strRegisters If passed, it will update these registers instead of using where
 * @returns {Promise.<number>} Number of updated documents
 */
redis.Update = (key, where = {}, update, strRegisters) =>
  new Promise(async resolve => {
    let regs;
    if (strRegisters) {
      strRegisters = Array.isArray(strRegisters) ? strRegisters : [strRegisters];
      regs = strRegisters.map(reg => JSON.parse(reg));
    } else ({ string: strRegisters, json: regs } = await redis.Find(key, where));
    if (!strRegisters) return resolve(null);
    if (strRegisters.length === 0) return resolve(0);

    redis.srem(key, ...strRegisters, async (error, deleted) => {
      if (error) {
        console.error(__filename, 'Update', error);
        return resolve(null);
      }
      if (deleted === 0) return resolve(0);
      const keys = Object.keys(update);
      for (let k = 0; k < regs.length; k += 1)
        for (let m = 0; m < keys.length; m += 1) regs[k][keys[m]] = update[keys[m]];
      resolve(await redis.Add(key, regs));
    });
  });

module.exports = redis;
