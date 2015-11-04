'use strict';

var express = require('express');
var kraken = require('kraken-js');
var https = require('https');


var options, app, ssl;

/*
 * Create and configure application. Also exports application instance for use by tests.
 * See https://github.com/krakenjs/kraken-js#options for additional configuration options.
 */
options = {
    onconfig: function (config, next) {
        /*
         * Add any additional config setup or overrides here. `config` is an initialized
         * `confit` (https://github.com/krakenjs/confit/) configuration object.
         */
        next(null, config);
    }
};

app = module.exports = express();
app.use(kraken(options));
app.on('start', function () {
    ssl = https.createServer(app.kraken.get('ssl'), app);
    ssl.listen(9455, function () {
        console.log('HTTPS Server listening on port', ssl.address().port);
    });
    console.log('Application ready to serve requests.');
    console.log('Environment: %s', app.kraken.get('env:env'));
});
