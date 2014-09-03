/*
 * handle all oauth&post requests.
 * - oauth
 * - like (post)
 * - unlike (del)
 * - follow (post)
 * - unfollow (post)
 * - comment (post)
 * - uncomment (del)
 */

var express = require('express');
var router = express.Router();
var config = require('config');
var request = require('request');

var igsigned = require('../midds/igsigned');

router.get('/oauth', function(req, res, next) {
    var app_name = req.query.app_name;
    var code = req.query.code;
    var error = req.query.error;
    var error_reason = req.query.error_reason;
    var error_description = req.query.error_description;

    if (error) {
        res.render('error', {
            message: error_description,
            error: {}
        });
        return;
    }

    // get oauth configs for app
    var oauth_config = config.Instagram[app_name];
    if (!oauth_config) {
        var err = new Error('PARAM_INVALID_ERROR');
        throw err;
        console.error('[OAuth]Invalid App Name:', app_name);
        return;
    }

    request.post({
        timeout: 5000,
        url: 'https://api.instagram.com/oauth/access_token',
        form: {
            client_id: oauth_config.client_id,
            client_secret: oauth_config.client_secret,
            grant_type: 'authorization_code',
            redirect_uri: oauth_config.redirect_uri + '?app_name=' + app_name,
            code: code
        },
        json: true
    }, function (err, response, body) {
        if (err) {
            console.error('[%s] [OAuth] Failed. Instagram Response: [%s]', app_name, JSON.stringify([err, response, body]));
            next(new Error('INSTAGRAM_TIME_OUT'));
            return;
        }
        http_code = response.statusCode;
        res.status(http_code);
        if (http_code == 200) {
            redirect_uri = oauth_config.redirect_uri + '#access_token=' + body.access_token;
            res.redirect(redirect_uri);
        } else {
            res.send(body.error_message);
        }
    });
});


// generate enforced sign & check app_sign
router.use(igsigned);

/*
 * like & unlike media
 */

router.route('/media/:media_id/likes')
.all(function (req, res, next) {
    var media_id = req.params.media_id;
    var app_name = req.body.app_name || req.query.app_name;
    var access_token = req.body.access_token || req.query.access_token;
    var enfored_signed = req.body.enfored_signed || req.query.enfored_signed;
    var plaform = req.body.platform || req.query.platform;
    var app_version = req.body.app_version || req.query.app_version;

    var url = 'https://api.instagram.com/v1/media/' + media_id + '/likes';
    var form = {};
    if (req.method == 'DEL') {
        url = url + '?access_token=' + access_token;
    } else {
        form.access_token = access_token;
    }

    var options = {
        timeout: 5000,
        method: req.method,
        url: 'https://api.instagram.com/v1/media/' + media_id + '/likes?access_token=' + access_token,
        headers: {
            'X-Insta-Forwarded-For': enfored_signed
        }
    };

    if (form != {}) options.form = form;

    request(options, function(err, response, body){
        if (err) {
            console.error('[%s] [Like Media] [Method: %s] Failed. Instagram Response: [%s]', app_name, req.method, JSON.stringify([err, response, body]));
            next(new Error('INSTAGRAM_TIME_OUT'));
            return;
        }

        res.status(response.statusCode);
        res.set(response.headers);
        res.send(body);
    });
});

/*
 * follow & unfollow
 */
router.post('/users/:user_id/relationship', function (req, res, next) {
    var user_id = req.params.user_id;
    var action = req.body.action || 'follow';
    var app_name = req.body.app_name || req.query.app_name;
    var access_token = req.body.access_token || req.query.access_token;
    var enfored_signed = req.body.enfored_signed;
    var plaform = req.body.platform;
    var app_version = req.body.app_version;

    request({
        timeout: 5000,
        method: 'post',
        url: 'https://api.instagram.com/v1/users/' + user_id + '/relationship',
        form: {
            action: action,
            access_token: access_token
        },
        headers: {
            'X-Insta-Forwarded-For': enfored_signed
        }
    }, function(err, response, body){
        if (err) {
            console.error('[%s] [Modify Relationship] [Method: %s] Failed. Instagram Response: [%s]', app_name, req.method, JSON.stringify([err, response, body]));
            next(new Error('INSTAGRAM_TIME_OUT'));
            return;
        }

        res.status(response.statusCode);
        res.set(response.headers);
        res.send(body);
    });
});

/*
 * comment & uncomment
 */
router.post('/media/:media_id/comments', function (req, res, next) {
    var media_id = req.params.media_id;
    var app_name = req.body.app_name;
    var access_token = req.body.access_token;
    var text = req.body.text;
    var enfored_signed = req.body.enfored_signed;
    var plaform = req.body.platform;
    var app_version = req.body.app_version;

    request({
        timeout: 5000,
        method: 'post',
        url: 'https://api.instagram.com/v1/media/' + media_id + '/comments',
        form: {
            access_token: access_token,
            text: text
        },
        headers: {
            'X-Insta-Forwarded-For': enfored_signed
        }
    }, function(err, response, body){
        if (err) {
            console.error('[%s] [Comment Media] [Method: %s] Failed. Instagram Response: [%s]', app_name, req.method, JSON.stringify([err, response, body]));
            next(new Error('INSTAGRAM_TIME_OUT'));
            return;
        }

        res.status(response.statusCode);
        res.set(response.headers);
        res.send(body);
    });
});


router.delete('/media/:media_id/comments/:comment_id', function (req, res, next) {
    var media_id = req.params.media_id;
    var comment_id = req.params.comment_id;
    var access_token = req.query.access_token;
    var enfored_signed = req.query.enfored_signed;
    var app_name = req.query.app_name;
    var plaform = req.query.platform;
    var app_version = req.query.app_version;

    request({
        timeout: 5000,
        method: 'delete',
        url: 'https://api.instagram.com/v1/media/' + media_id + '/comments/' + comment_id + '?access_token=' + access_token,
        headers: {
            'X-Insta-Forwarded-For': enfored_signed
        }
    }, function(err, response, body){
        if (err) {
            console.error('[%s] [UnComment Media] [Method: %s] Failed. Instagram Response: [%s]', app_name, req.method, JSON.stringify([err, response, body]));
            next(new Error('INSTAGRAM_TIME_OUT'));
            return;
        }

        res.status(response.statusCode);
        res.set(response.headers);
        res.send(body);
    });
});

module.exports = router;
