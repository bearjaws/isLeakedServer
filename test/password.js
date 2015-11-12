/*global describe:false, it:false, beforeEach:false, afterEach:false*/

'use strict';


var kraken = require('kraken-js'),
express = require('express'),
path = require('path'),
request = require('supertest'),
responses = require('../test/data/responses.json');


describe('password', function () {

    var app, mock;


    beforeEach(function (done) {
        app = express();
        app.on('start', done);
        app.use(kraken({
            basedir: path.resolve(__dirname, '..')
        }));

        mock = app.listen(1337);

    });


    afterEach(function (done) {
        mock.close(done);
    });


    it('should return status 200 for /password/status', function (done) {
        request(mock)
        .get('/password/status')
        .expect(200)
        .end(function (err, res) {
            done(err);
        });
    });

    it('should return false for a password that has not been leaked', function (done) {
        request(mock)
        .post('/password/isLeaked')
        .send({
            password: "nbkeejr38e9wdfjakds",
        })
        .expect({ isLeaked: false })
        .end(function (err, res) {
            done(err);
        });
    });

    it('should return true for a password that has been leaked', function (done) {
        request(mock)
        .post('/password/isLeaked')
        .send({
            password: "022347D",
        })
        .expect({ isLeaked: true })
        .end(function (err, res) {
            done(err);
        });
    });

    it('should return false for a password that has not been leaked', function (done) {
        request(mock)
        .post('/password/isLeaked')
        .send({
            password: "02234far3ew(*^%$*(7D",
        })
        .expect({ isLeaked: false })
        .end(function (err, res) {
            done(err);
        });
    });

    it('should be able to post to the /password/isSecure route', function (done) {
        request(mock)
        .post('/password/isSecure')
        .send({
            password: "jfkjfadjf29e29ewifdjkds@#()",
        })
        .expect(200)
        .end(function (err, res) {
            done(err);
        });
    });

    it('should be fail an insecure password on /password/isSecure route', function (done) {
        request(mock)
        .post('/password/isSecure')
        .send({
            password: "m1cha3l",
        })
        .expect({
            "isLeaked": true,
            "similarPasswords": [{
                "password": "*M1CHAEL",
                "similarity": 0.6153846153846154
            }
        ]})
        .end(function (err, res) {
            done(err);
        });
    });

    it('should use joi validation for post body on /password/owasp', function (done) {
        request(mock)
        .post('/password/owasp')
        .send({
            password: "kfjfdhfhsdfhsdf82323388HUDSHHBD",
            owasp: {
                allowPassphrases       : true,
                maxLength              : 100,
                minLength              : 10,
                minPhraseLength        : 20,
                minOptionalTestsToPass : 3
            }
        })
        .expect(responses['should use joi validation for post body on /password/test'])
        .end(function (err, res) {
            done(err);
        });
    });

    it('should pass the OWASP check with a `secure` password', function (done) {
        request(mock)
        .post('/password/owasp')
        .send({
            password: "jfkjfAdjf29e29ewifdjkds@#()",
        })
        .expect(responses['should pass the OWASP check with a `secure` password'])
        .end(function (err, res) {
            done(err);
        });

    });

    it('should pass the OWASP check with a `secure` password, but fail isLeaked', function (done) {
        request(mock)
        .post('/password/owasp')
        .send({
            password: "*7¡VaMOS!",
        })
        .expect(responses['should pass the OWASP check with a `secure` password, but fail'])
        .end(function (err, res) {
            done(err);
        });
    });

    it('should return 400 for bad post body on /password/isLeaked', function (done) {
        request(mock)
        .post('/password/isLeaked')
        .send({
            invalid: "022347D",
        })
        .expect(400)
        .end(function (err, res) {
            done(err);
        });
    });

    it('should use joi validation for bad post body on /password/isLeaked', function (done) {
        request(mock)
        .post('/password/isLeaked')
        .send({
            invalid: "022347D",
        })
        .expect(responses['should use joi validation for bad post body on /password/isLeaked'])
        .end(function (err, res) {
            done(err);
        });
    });

    it('should fail joi validation for post body on /password/test', function (done) {
        request(mock)
        .post('/password/owasp')
        .send({
            password: "kfjfdhfhsdfhsdf82323388HUDSHHBD",
            owasp: {
                allowPassphrases       : true,
                maxLength              : 100,
                minLength              : false,
                minPhraseLength        : 'invalidString',
                minOptionalTestsToPass : 3
            }
        })
        .expect(responses['should fail joi validation for post body on /password/test'])
        .end(function (err, res) {
            done(err);
        });
    });
});
