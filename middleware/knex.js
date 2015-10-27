module.exports = function() {
    return function injectKnex(req, res, next) {
        var knex = require('knex');

        if (typeof process.env['PG_URL'] !== 'string') {
            throw new Error('PG_URL env variable not set');
        }
        var knex = require('knex')({
          client: 'pg',
          connection: process.env['PG_URL']
        });

        req.knex = knex;
        next();
    }
}
