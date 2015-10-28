/*global describe:false, it:false, beforeEach:false, afterEach:false*/

'use strict';


var kraken = require('kraken-js'),
express = require('express'),
path = require('path'),
request = require('supertest');


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

    it('should return true for a password that has not been leaked', function (done) {
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

    it('should be able to post to the /password/test route', function (done) {
        request(mock)
        .post('/password/test')
        .send({
            password: "jfkjfadjf29e29ewifdjkds@#()",
        })
        .expect(200)
        .end(function (err, res) {
            done(err);
        });
    });

    it('should be pass the OWASP check with a `secure` password', function (done) {
        request(mock)
        .post('/password/test')
        .send({
            password: "jfkjfAdjf29e29ewifdjkds@#()",
        })
        .expect({
            "errors": [],
            "failedTests": [],
            "isPassphrase": true,
            "optionalTestErrors": [],
            "optionalTestsPassed": 0,
            "passedTests": [
                0,
                1,
                2
            ],
            "requiredTestErrors": [],
            "strong": true
        })
        .end(function (err, res) {
            done(err);
        });

    });

    it('should be pass the OWASP check with a `secure` password, but fail isLeaked', function (done) {
        request(mock)
        .post('/password/test')
        .send({
            password: "*7¡VaMOS!",
        })
        .expect({
            "errors": ["The password is included in common password lists,  making it extremely insecure."],
            "failedTests": [],
            "isPassphrase": false,
            "optionalTestErrors": [],
            "optionalTestsPassed": 4,
            "passedTests": [
                0,
                1,
                2,
                3,
                4,
                5,
                6
            ],
            "requiredTestErrors": ["The password is included in common password lists,  making it extremely insecure."],
            "strong": false
        })
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
});
