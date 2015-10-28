var fs = require('fs');
var LineByLineReader = require('line-by-line');
var lr = new LineByLineReader('./crackstation-human-only.txt');
var words = [];
var knex = require('knex')({
    client: 'pg',
    connection: process.env['PG_URL']
});

lr.on('line', function (line) {
    words.push({ password: line });
    // Perform batched prepared statmenets to improve insert performance
    if (words.length >= 20) {
        lr.pause();
        knex('passwords').insert(words).then(function(result) {
            words = [];
            lr.resume();
        }).catch(function(error) {
            console.log(error);
            words = [];
            lr.resume();
        })
    }
});

lr.on('end', function () {
    console.log('All words processed.');
});
