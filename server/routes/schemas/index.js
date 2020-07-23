/* eslint-disable no-case-declarations */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const joi = require('@hapi/joi');

const fs = require('fs');
const url = require('url');

const { router } = require('../../commons/middlewares');
const rollbar = require('../../commons/rollbar');
const projectDir = require('../../commons/projectDir');
require('../../commons/env');

const SCHEMA = require('./constants/schema');

const getSchemaError = (schema = joi.object(), objectToValidate = {}, options) => {
  options = options || { stripUnknown: false };
  const { error, value } = schema.validate(objectToValidate, options);
  const errors = (error && error.details.map(err => err.message)) || null;
  return { errors, value };
};

const getValidator = (schemaName, schema) => async (req, res, next) => {
  const { method } = req;
  const { path } = req.route;
  if (!schema) {
    console.warn(
      `Couldn't find validations for path "${path}" and method "${method}". Schema: "${schemaName}". Calling next()`
    );
    return next();
  }
  if (schema.domains) {
    schema.domains = Array.isArray(schema.domains) ? schema.domains : [schema.domains];
    const { host } = url.parse(req.headers.referer || '');
    if (!schema.domains.includes(host)) return res.status(401).json({ error: 'Domain is not in whitelist' });
  }
  const { errorMessage } = schema;
  if (schema.admin && req.headers[`admin_secret_${process.env.NODE_ENV}`] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({
      error: "What are you doing ?? You're not an administrator"
    });
  }
  const schemaError = [];
  SCHEMA.REQUEST_TYPES.forEach(type => {
    if (schema[type]) {
      if (typeof schema[type].validate !== 'function') {
        const error = `Invalid schema object. path '${path}'. Method '${method}'. Schema: '${schemaName}'. Key:'${type}'`;
        rollbar.error(error);
        return schemaError.push(error);
      }
      const validation = getSchemaError(schema[type], req[type], schema.options);
      const { errors } = validation;
      req[type] = validation.value;
      errors && schemaError.push(errors);
    }
  });
  if (schemaError.length) return res.status(400).json({ error: errorMessage || schemaError });
  if (schema.middlewares) {
    const middlewares = Array.isArray(schema.middlewares) ? schema.middlewares : [schema.middlewares];
    for (let i = 0; i < middlewares.length; i += 1) middlewares[i](req, res, middlewares[i + 1] || next);
  } else next();
};

const getRoute = (method, paths, schemaName, schema, epName, callbacks) => {
  if (!Array.isArray(callbacks)) {
    callbacks = [callbacks];
  }
  const validator = getValidator(schemaName, schema);
  router[method](paths, validator, ...callbacks);
  return req =>
    new Promise(resolve => {
      if (!req) {
        rollbar.warn(
          `No req was provided, this request simulation will be ignored. Schema: "${schemaName}". Endpoint: "${epName}"`
        );
        return resolve({ statusCode: 400, message: 'Bad request' });
      }
      req.route = { path: paths[0] };
      const endings = statusCode => ({
        send: body => resolve({ statusCode, body }),
        json: body => resolve({ statusCode, body }),
        redirect: url => resolve({ statusCode, body: { message: `Redirecting to ${url}` } }),
        zip: () => resolve({ statusCode, body: { message: 'Zipping file' } }),
        render: file => resolve({ statusCode, body: { message: `Rendering file ${file}` } }),
        sendFile: file => resolve({ statusCode, body: { message: `Sending file ${file}` } })
      });
      const res = {
        status: statusCode => endings(statusCode),
        ...endings(200)
      };
      let currMiddleware = -1;
      const middlewares = [validator, ...callbacks, forward];
      const next = () => {
        if (middlewares[currMiddleware + 1]) {
          currMiddleware += 1;
          return middlewares[currMiddleware](req, res, next);
        }
        rollbar.warn(`Called next middleware but it does not exist.
Schema: "${schemaName}". Endpoint: "${epName}"`);
      };
      next();
    });
};
const getRoutes = () => {
  const eventId = rollbar.startEvent();
  const actionFiles = fs
    .readdirSync(`${projectDir}/server/routes/actions`)
    .filter(
      file => fs.statSync(`${projectDir}/server/routes/actions/${file}`).isFile() && file.slice(-3) === '.js'
    );
  const actions = {};
  for (let k = 0; k < actionFiles.length; k += 1) {
    const name = actionFiles[k].substring(0, actionFiles[k].length - 3);
    actions[name] = require(`../actions/${name}`);
  }
  let schemaFiles = fs.readdirSync(__dirname);
  schemaFiles = schemaFiles.filter(file => file !== 'index.js' && file.slice(-3) === '.js');
  const schemas = {};
  const routes = { Paths: {} };
  for (let k = 0; k < schemaFiles.length; k += 1) {
    const name = schemaFiles[k].substring(0, schemaFiles[k].length - 3);
    const schema = require(`./${name}`);
    routes.Paths[name] = {};
    if (!actions[name]) {
      rollbar
        .error(
          `No action was found for schema "${name}". Won't define associated routes.
Please define it in "server/routes/actions/${name}.js"`
        )
        .useEvent(eventId);
      continue;
    }
    routes[name] = {};

    schemas[name] = {};
    const epNames = Object.keys(schema);
    for (let m = 0; m < epNames.length; m += 1) {
      const epName = epNames[m];
      if (!actions[name][epName]) {
        rollbar
          .error(
            `No action was found for schema "${name}" and endpoint "${epName}". Won't define that endpoint.
Please review "server/routes/actions/${name}.js"`
          )
          .useEvent(eventId);
        continue;
      }
      schemas[name][epName] = {};
      let { paths } = schema[epName];
      const { method } = schema[epName];
      if (!method) {
        rollbar
          .error(
            `No "method" was specified on schema "${name}", endpoint "${epName}". This route definition will be ignored`
          )
          .useEvent(eventId);
        continue;
      }
      paths = Array.isArray(paths) ? paths : [paths];
      paths = paths.filter(path => path);
      if (paths.length === 0) {
        rollbar
          .warn(
            `No "paths" specified at schemas "${name}", endpoint ${epName}. This route definition will be ignored`
          )
          .useEvent(eventId);
        continue;
      }
      routes.Paths[name][epName] = paths.map(path => `/api${path}`);
      routes.Paths[name][epName].method = method;

      routes[name][epName] = getRoute(method, paths, name, schema[epName], epName, actions[name][epName]);
    }
  }
  rollbar.finishEvent(eventId);
  return routes;
};

module.exports = getRoutes();
