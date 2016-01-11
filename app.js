var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var socket_io = require('socket.io');
var multer  = require('multer');
var fs = require("fs");

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
var io  = socket_io();

var uploadsPath = 'uploads/';

app.io = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// scripts
app.use('/fabric', express.static(__dirname + '/bower_components/fabric.js/dist'));
app.use('/jquery', express.static(__dirname + '/bower_components/jquery/dist'));
app.use('/jquery.form', express.static(__dirname + '/bower_components/jquery-form'));
app.use('/jquery.ui', express.static(__dirname + '/bower_components/jquery-ui'));
app.use('/bootstrap', express.static(__dirname + '/bower_components/bootstrap/dist'));
app.use('/node-uuid', express.static(__dirname + '/node_modules/node-uuid'));

// images
app.use('/uploads', express.static(__dirname + '/uploads'));

// multer stuff
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsPath);
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

var upload = multer({ storage: storage });

app.post('/uploadImage', upload.single('image'), function(req, res) {
  if (req.file) {
    res.end("File uploaded successfully.");
  } else {
    res.end("Error uploading file.");
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// socket io behaviors
io.on('connection', function(socket) {
  console.log("A user connected");

  socket.on('ls', function() {
    fs.readdir(uploadsPath, function (err, files) {
      if (err) {
        throw err;
      }

      socket.emit('files', files);
    });
  });

  socket.on('clear', function() {
    io.emit('clear');
  });

  socket.on('added', function(obj) {
    socket.broadcast.emit('added', obj);
  });

  socket.on('removed', function(obj) {
    socket.broadcast.emit('removed', obj);
  });

  socket.on('modified', function(obj) {
    socket.broadcast.emit('modified', obj);
  });
});

module.exports = app;
