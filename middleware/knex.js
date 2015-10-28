var knex = require('knex');

if (typeof process.env['PG_URL'] !== 'string') {
    throw new Error('PG_URL env variable not set');
}

//@TODO allow support for more DBs
var knex = require('knex')({
  client: 'pg',
  connection: process.env['PG_URL']
});

module.exports = function() {
    return function injectKnex(req, res, next) {
        req.knex = knex;
        next();
    }
}
