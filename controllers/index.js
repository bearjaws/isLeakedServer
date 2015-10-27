'use strict';

var IndexModel = require('../models/index');


module.exports = function (router) {

    var model = new IndexModel();

    router.get('/', function (req, res) {


        res.render('index', model);


    });

    router.get('/apidocs', function(req, res) {
        res.send('/public/apidoc/index.html');
    })

    router.get('/status', function (req, res) {
        res.status(200).end();
    });

};
