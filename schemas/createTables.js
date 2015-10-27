var knex = require('knex')({
    client: 'pg',
    connection: process.env['PG_URL']
});

return knex.schema.hasTable('passwords').then(function(exists) {
    if (!exists) {
        return knex.schema.createTable('passwords', function(t) {
            t.increments('id').primary();
            t.string('password', 200).index('passwords_password_index');
        });
    }
});
