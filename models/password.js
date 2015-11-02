'use strict';

function PasswordModel() {
    this.name = 'password';
}

function generateMutations(password) {
    var characterMapNumeric = {
        'a': '4',
        'b': '8',
        'e': '3',
        'g': '6',
        'l': '1',
        'o': '0',
        's': '5',
        't': '7'
    };

    var mutations = [];
    var string;
    var mutated = password;
    for (var letter in characterMapNumeric) {
        string = password.replace(new RegExp(letter, 'gi'), characterMapNumeric[letter]);

        if (mutations.indexOf(string) === -1) {
            mutations.push(string);
        }
        mutated = mutated.replace(new RegExp(letter, 'gi'), characterMapNumeric[letter]);
        if (mutations.indexOf(mutated) === -1) {
            mutations.push(mutated);
        }
    }

    return mutations;
}

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

PasswordModel.prototype.mutationsLeaked = function(knex, password) {
    var mutations = generateMutations(password).join(' | ');
    var chunks = [];
    var length, remaining = password.length;
    var index = 0;
    while(remaining > 0) {
        chunks.push(password.substring(index, index + 3));
        remaining -= 3;
        index += 3;
    }

    var sql = "SELECT password ";
    sql += " FROM passwords, to_tsquery(?) query"
    sql += " WHERE query @@ to_tsvector('english', password);";
    return knex.raw(sql, [mutations]).then(function(result) {
        return result.rows;
    }).then(function(rows) {
        var passwords = [];
        var found = 0;
        for (var i = 0; i < rows.length; i++) {
            for (var c = 0; c < chunks.length; c++) {
                if (rows[i].password.search(chunks[c]) !== -1) {
                    found++;
                }
            }
            passwords.push({
                password: rows[i].password,
                similarity: found/chunks.length
            });
            found = 0;
        }
        console.log(passwords);
        return passwords;
    });
};

module.exports = PasswordModel;
