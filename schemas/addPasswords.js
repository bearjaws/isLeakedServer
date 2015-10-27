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
    if (words.length >= 10) {
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

// pg.connect(process.env['PG_URL'], function(err, client, done) {
//     if(err) {
//         return console.error('error fetching client from pool', err);
//     }
//     lr.on('line', function (line) {
//         words.push(line);
//         if (words.length === 5) {
//             lr.pause();
//             var query = client.query({
//                 text: "INSERT INTO passwords (password) VALUES ($1)",
//                 values: words
//             }, function(err, res) {
//                 if (err) {
//                     console.log(err);
//                 }
//                 words = [];
//                 lr.resume();
//             });
//         }
//     });
//
//     lr.on('end', function () {
//         console.log('All words processed.');
//     });
// });
