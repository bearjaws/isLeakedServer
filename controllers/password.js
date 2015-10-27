'use strict';

var PasswordModel = require('../models/password');
var owasp = require('owasp-password-strength-test');
var defaultConfig = require('../owasp.json');
owasp.config(defaultConfig);
module.exports = function (router) {
    var passwordModel = new PasswordModel();

    router.get('/status', function (req, res) {
        res.status(200).end();
    });

    /**
     * @api {post} /password/isLeaked Returns whether the provided password has been leaked
     * @apiName isLeaked
     * @apiGroup Password
     *
     * @apiParam {String} password The password to check against known password lists.
     *
     * @apiSuccess {Boolean} isLeaked True if the password was found in a password list, false otherwise.
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 Success:
     *     {
     *     		"isLeaked": false
     *     }
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
     *       "type": "UserError",
     *       "message": "The post body must contain the password to validate."
     *     }
     */
    router.post('/isLeaked', function (req, res) {
        var password = req.body.password.toUpperCase();

        if (typeof password !== 'string') {
            return res.status(400).json({
                "type": "UserError",
                "message": "The post body must contain the password to validate."
            }).end();
        }

        return passwordModel.isLeaked(req.knex, password).then(function(result) {
            res.status(200).json({
                "isLeaked": result
            }).end();
        }).catch(function(error) {
            res.status(500).end();
            // Should log these errors, probab;y db related
        });
    });

    /**
     * @api {post} /password/test Returns whether the provided password meets OWASP standards. Addittionally checks if the password is contained in a known passwords list.
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
     *     errors              : [],
     *     failedTests         : [],
     *     requiredTestErrors  : [],
     *     optionalTestErrors  : [],
     *     passedTests         : [ 0, 1, 2, 3, 4, 5, 6 ],
     *     isPassphrase        : false,
     *     strong              : true,
     *     optionalTestsPassed : 4
     *      }
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 BadRequest
     *     {
     *       "type": "UserError",
     *       "message": "The post body must contain the password to validate."
     *     }
     */
    router.post('/test', function (req, res) {
        var password = req.body.password.toUpperCase();
        if (typeof password !== 'string') {
            return res.status(400).json({
                "type": "UserError",
                "message": "The post body must contain the password to validate."
            }).end();
        }

        // User can provider their own owasp config, @TODO needs joi validation.
        if(typeof req.body.owasp === 'object') {
            owasp.config(req.body.owasp);
        }

        var owasp_result = owasp.test(password);
        return passwordModel.isLeaked(req.knex, password).then(function(result) {
            if (result === true) {
                var message = 'The password is included in common password lists, ';
                message += ' making it extremely insecure.';
                owasp_result.errors.push(message);
                owasp_result.requiredTestErrors.push(message);
            }
            owasp.config(defaultConfig);
            res.status(200).json(owasp_result).end();
        }).catch(function(error) {
            owasp.config(defaultConfig);
            res.status(500).end();
            // Should log these errors, probab;y db related
        });
    });
};
