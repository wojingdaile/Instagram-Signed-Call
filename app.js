var express = require('express');
var compression = require('compression');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var config = require('config');

var instagram = require('./routes/instagram');

var app = express();
app.enable('trust proxy');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/v1/instagram', instagram);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('NOT_FOUND');
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (process.env.NODE_ENV && process.env.NODE_ENV == 'development') {
    app.use(function(err, req, res, next) {
        var GFCode = null;
        if (err.message in config.ErrorCode) {
            GFCode = config.ErrorCode[err.message];
        } else {
            GFCode = config.ErrorCode["INTERNAL_SERVER_ERROR"];
            // unkown error, so record stack
            console.error(err.message, err.stack);
        }

        res.status(GFCode.http_code);
        res.json({
            meta: {
                code: GFCode.code,
                error_type: GFCode.error_type,
                error_message: GFCode.error_message
            },
            data: {
                err: err,
                msg: err.message
                //stack: err.stack
            }
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    var GFCode = null;
    if (err.message in config.ErrorCode) {
        GFCode = config.ErrorCode[err.message];
    } else {
        GFCode = config.ErrorCode["INTERNAL_SERVER_ERROR"];
        // unkown error, so record stack
        console.error(err.message, "\n", err.stack);
    }

    res.status(GFCode.http_code);
    res.json({
        meta: {
            code: GFCode.code,
            error_type: GFCode.error_type,
            error_message: GFCode.error_message
        },
        data: null
    });
});

module.exports = app;
