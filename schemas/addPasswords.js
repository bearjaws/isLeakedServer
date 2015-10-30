var fs = require('fs');
var LineByLineReader = require('line-by-line');
var lr = new LineByLineReader('./crackstation-human-only.txt');
var words = [];
var knex = require('knex')({
    client: 'pg',
    connection: process.env['PG_URL']
});

function processWords() {
    knex('passwords').insert(words).then(function(result) {
        words = [];
        lr.resume();
    }).catch(function(error) {
        console.log(error);
        words = [];
        lr.resume();
    })
}

lr.on('line', function (line) {
    words.push({ password: line });
    // Perform batched prepared statmenets to improve insert performance
    if (words.length >= 20) {
        lr.pause();
        processWords(words);
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
