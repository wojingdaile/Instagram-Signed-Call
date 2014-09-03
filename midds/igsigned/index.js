var config = require('config');
var crypto = require('crypto');

/**
 * generate Enforce signed header for Instagram
 */

module.exports = function igsigned(req, res, next) {
    var ips = req.ips.join(',');
    var app_name = req.body.app_name || req.query.app_name || '';
    var access_token = req.body.access_token || req.query.access_token || '';

    var app_config = config.Instagram[app_name];
    if (!app_config) {
        var err = new Error('PARAM_INVALID_ERROR');
        throw err;
        console.error('[SignCheck]Invalid App Name:', app_name);
        return;
    }

    var client_secret = app_config.client_secret;
    var enfored_signed = crypto.createHmac('sha256', client_secret).update(ips).digest('hex');
    req.body.enfored_signed = [ips, enfored_signed].join('|');

    next();
};
