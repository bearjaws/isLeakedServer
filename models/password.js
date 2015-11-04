'use strict';
var bluebird = require('bluebird');
var stringSimilarity = require('string-similarity');

function PasswordModel() {
    this.name = 'password';
}

function wrap(string) {
    return '\'' + string + '\'';
}

/**
 * Generates mutations of password provided, adding l33t speak and removing special chars or
 * common password character swaps.
 * @param  {string} password The password to mutate
 * @return {string[]} An array of password strings.
 */
function generateMutations(password) {
    var characterMap = {
        'a': '4',
        'b': '8',
        'e': '3',
        'g': '6',
        'l': '1',
        'o': '0',
        's': '5',
        't': '7',
        '@': 'A',
        '$': 'S',
        '&': 'A',
        '4': 'A',
        '5': 'S',
        '0': 'O',
        '#': '',
        '3': 'E'
    };
    var characterArray = [
        'a',
        'b',
        'e',
        'g',
        'l',
        'o',
        's',
        't',
        '@',
        '$',
        '&',
        '4',
        '5',
        '0',
        '#',
        '3'
    ];

    var mutations = [];
    var string;
    var mutated = password;
    // Need to escape these strings with single quotes because postgres will attempt to execute
    // anything with () at the end, despite using a parameterized query, this is not ideal
    //@TODO make stored procedure for the query and disable function execution
    mutations.push(wrap(password));
    return bluebird.resolve(characterArray).map(function(letter) {
        string = password.replace(new RegExp(letter, 'gi'), characterMap[letter]);
        if (mutations.indexOf(wrap(string)) === -1) {
            mutations.push(wrap(string));
        }

        //This builds strings combining every previous change
        mutated = mutated.replace(new RegExp(letter, 'gi'), characterMap[letter]);
        if (mutations.indexOf(wrap(mutated)) === -1) {
            mutations.push(wrap(mutated));
        }
    }).then(function() {
        return mutations;
    });
}

/**
 * Queries for a literal password in the database, returning true if it is found; false otherwise
 * @param  {object} knex     Knex database instance
 * @param  {string} password The password to check for.
 * @return {boolean}          True if the password is found; false otherwise
 */
PasswordModel.prototype.isLeaked = function(knex, password) {
    return knex('passwords').where({
        password: password.toUpperCase()
    }).limit(1).then(function(result) {
        if (result.length >= 1) {
            return true;
        }
        return false;
    });
};

/**
 * Generates mutations of the provided password then queries postgres to see if there are
 * any similar passwords. Once it has a result from postgres it runs a string similarity check
 * to get a numeric 0 through 1 (1 being identical) rating of how similar they are.
 * @param  {object} knex     Knex database instance
 * @param  {string} password The password to check for.
 * @return {object[]}          An array of objects, containing similar passwords and
 * a similarity rating using Dice's coefficient
 */
PasswordModel.prototype.mutationsLeaked = function(knex, password) {
    var sql = 'SELECT DISTINCT password';
    sql += ' FROM passwords, to_tsquery(?) query';
    sql += ' WHERE query @@ to_tsvector(\'english\', password);';
    return generateMutations(password).then(function(mutations) {
        // This transforms the array into the string needed to query postgres
        return mutations.join(' | ');
    }).then(function(mutationsString) {
        return knex.raw(sql, [mutationsString]);
    }).then(function(result) {
        var rows = result.rows;
        var isLeaked = false;
        var passwords = [];
        for (var i = 0; i < rows.length; i++) {
            var rowPassword = rows[i].password;

            var similarity = stringSimilarity.compareTwoStrings(password, rowPassword);
            passwords.push({
                password: rowPassword,
                similarity: similarity
            });
            // If any returned password is 30% similar then this password is probably unsafe.
            if (isLeaked === false && similarity >= 0.3) {
                isLeaked = true;
            }
        }

        return {
            isLeaked: isLeaked,
            similarPasswords: passwords.sort(function(a, b) {
                if (a.similarity < b.similarity) {
                    return 1;
                } else if (a.similarity > b.similarity) {
                    return -1;
                }
                return 0;
            })
        };
    });
};

module.exports = PasswordModel;
