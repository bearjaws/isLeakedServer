'use strict';

var bluebird = require('bluebird');
var defaultConfig = require('../owasp.json');
var joi = require('joi');
var PasswordModel = require('../models/password');
var owasp = require('owasp-password-strength-test');
var validate = bluebird.promisify(joi.validate);

owasp.config(defaultConfig);

var schemas = {
    'isLeaked':
    joi.object().keys({
        password: joi.string().required()
    }),
    'test':
    joi.object().keys({
        password: joi.string().required(),
        owasp: joi.object().keys({
            allowPassphrases       : joi.boolean().required(),
            maxLength              : joi.number().integer().required(),
            minLength              : joi.number().integer().required(),
            minPhraseLength        : joi.number().integer().required(),
            minOptionalTestsToPass : joi.number().integer().required()
        }).optional()
    })

};

module.exports = function (router) {
    var passwordModel = new PasswordModel();

    router.get('/status', function (req, res) {
        res.status(200).end();
    });

    /**
    * @api {post} /password/isLeaked Checks if a password has been leaked.
    * @apiName isLeaked
    * @apiGroup Password
    *
    * @apiParam {String} password The password to check against known password lists.
    *
    * @apiSuccess {Boolean} isLeaked True if the password was found in a password list, false otherwise.
    * @apiSuccessExample Success-Response:
    *     HTTP/1.1 200 Success:
    *     {
    *     	"isLeaked": false
    *     }
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 400 Bad Request
    *     {
    *       "type": "UserError",
    *       "message": "The post body must contain the password to validate."
    *     }
    */
    router.post('/isLeaked', function (req, res) {
        var password = req.body.password;

        return validate(req.body, schemas.isLeaked).then(function() {
            return passwordModel.isLeaked(req.knex, password).then(function(result) {
                res.status(200).json({
                    'isLeaked': result
                }).end();
            });
        }).catch(function(error) {
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    'type': 'UserError',
                    'message': 'The post body is invalid.',
                    'details': error.details
                }).end();
            }
            // Should log these errors, probab;y db related, will need to sanatize as to not save PW
            res.status(500).end();
        });
    });

    /**
    * @api {post} /password/test Runs OWASP tests and isLeaked test.
    * @apiName test
    * @apiGroup Password
    *
    * @apiParam {String} password The password to check against known password lists.
    * @apiParam {Object} [config] The optional OWASP config as
    * 		specified at: https://www.npmjs.com/package/owasp-password-strength-test
    *
    * @apiSuccess {json} See https://www.npmjs.com/package/owasp-password-strength-test
    * @apiSuccessExample {json} Success-Response:
    *     HTTP/1.1 200 OK
    *     {
    *     	errors              : [],
    *      failedTests         : [],
    *      requiredTestErrors  : [],
    *      optionalTestErrors  : [],
    *      passedTests         : [ 0, 1, 2, 3, 4, 5, 6 ],
    *      isPassphrase        : false,
    *      strong              : true,
    *      optionalTestsPassed : 4
    *      }
    * @apiErrorExample Error-Response:
    *     HTTP/1.1 400 BadRequest
    *     {
    *       "type": "UserError",
    *       "message": "The post body must contain the password to validate."
    *     }
    */
    router.post('/test', function (req, res) {
        var password = req.body.password;

        return validate(req.body, schemas.test).then(function() {
            var owasp_result = owasp.test(password);
            return passwordModel.isLeaked(req.knex, password).then(function(result) {
                if (result === true) {
                    var message = 'The password has been leaked, ';
                    message += ' making it extremely insecure.';
                    owasp_result.errors.push(message);
                    owasp_result.requiredTestErrors.push(message);
                    owasp_result.strong = false;
                }
                owasp.config(defaultConfig);
                res.status(200).json(owasp_result).end();
            });
        }).catch(function(error) {
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    'type': 'UserError',
                    'message': 'The post body is invalid.',
                    'details': error.details
                }).end();
            }
            // Restore default config on error.
            owasp.config(defaultConfig);
            res.status(500).end();
            // Should log these errors, probab;y db related, will need to sanatize as to not save PW
        });
    });
};
