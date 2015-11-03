#! /usr/bin/env node
//@TODO make this more generic, atleast MYSQL support.
var fs = require('fs');
var knex = require('knex')({
    client: 'pg',
    connection: process.env['PG_URL']
});
var LineByLineReader = require('line-by-line');
// User has executed createTables
if (process.argv[2] === 'createTables') {
    return knex.schema.hasTable('passwords').then(function(exists) {
        if (!exists) {
            return knex.schema.createTable('passwords', function(t) {
                t.increments('id').primary();
                t.string('password', 200);
            }).then(function() {

            }).then(function() {
                console.log('Table schema created successfully');
                process.exit();
            })
        } else {
            console.warn('Table with name `passwords` already exists.');
            process.exit();
        }
    });
} else if (process.argv[2] === 'addIndexes') {
    var sql = "CREATE INDEX password_vector_index ON passwords";
    sql += " USING gin(to_tsvector('english', password));";
    return knex.schema.raw(sql).then(function() {
        console.log('Added text vector index successfully');
        return knex.schema.table('passwords', function (table) {
            // This index is more performant for isLeaked queries
            table.index('password');
        });
    }).then(function() {
        console.log('Added btree password index successfully');
        process.exit();
    }).catch(function(err) {
        console.warn(err);
        process.exit(-1);
    });
} else if(process.argv[2] === 'addPasswords') {
    // Ensure they have provided a passwords list
    if (typeof process.argv[3] !== 'string' || !fs.existsSync(process.argv[3])) {
        throw new Error("Passwords file not found, please make sure to specify its filepath.");
    }
    var lr = new LineByLineReader(process.argv[3]);
    var words = [];
    var total = 0;

    lr.on('line', function (line) {
        words.push({ password: line.toUpperCase() });
        // Perform batched statmenets to improve insert performance
        if (words.length >= 40) {
            // Need to pause processing otherwise words[] gets overwritten
            lr.pause();
            processWords();
            total += 40;
            console.log('Processed ' + total + ' words.');
        }
    });

    lr.on('end', function () {
        // Process any remaining words in array.
        if (words.length !== 0) {
            return processWords().then(function() {
                console.log('All words processed.');
                process.exit();
            });
        } else {
            console.log('All words processed.');
            process.exit();
        }
    });
} else if (process.argv[2] === 'start') {
    var app = require('../index');
    var http = require('http');
    var server;
    // To configure environment, please see krakenjs
    // https://github.com/krakenjs/kraken-js#configuration
    server = http.createServer(app);
    server.listen(process.env.PORT || 8000);
    server.on('listening', function () {
        console.log('Server listening on http://localhost:%d', this.address().port);
    });
}


function processWords() {
    return knex('passwords').insert(words).then(function(result) {
        words = [];
        lr.resume();
    }).catch(function(error) {
        console.warn(error);
        words = [];
        lr.resume();
    })
}
