'use strict';

function PasswordModel() {
    this.name = 'password';
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

module.exports = PasswordModel;
