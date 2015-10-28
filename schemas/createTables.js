//@TODO make this more generic, atleast MYSQL support.
var knex = require('knex')({
    client: 'pg',
    connection: process.env['PG_URL']
});

return knex.schema.hasTable('passwords').then(function(exists) {
    if (!exists) {
        return knex.schema.createTable('passwords', function(t) {
            t.increments('id').primary();
            t.string('password', 200).index('passwords_password_index');
        }).then(function() {
            console.log('Table schema created successfully');
        });
    } else {
        console.warn('Table with name `passwords` already exists.');
    }
});
