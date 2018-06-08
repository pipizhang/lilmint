'use strict';

const mongoose = require('mongoose');
const chalk = require('chalk');
let connected = 0;

class DB {

  static async connect(dbURI) {
    if (connected == 0) {
      let _dbURI = dbURI || process.env.MONGODB_URI;
      DB.registEvent();
      await mongoose.connect(_dbURI);
      connected++;
    }
    return mongoose.connection;
  }

  static registEvent() {
    // When successfully connected
    mongoose.connection.on('connected', function () {
      let msg = chalk.green('Mongoose default connection open');
      // console.log(msg);
    });

    // If the connection throws an error
    mongoose.connection.on('error',function (err) {
      let msg = chalk.red('Mongoose default connection error: ' + err);
      console.log(msg);
    });

    // When the connection is disconnected
    mongoose.connection.on('disconnected', function () {
      let msg = chalk.red('Mongoose default connection disconnected');
      console.log(msg);
    });
  }

  static disconnect() {
    mongoose.disconnect();
  }

}

module.exports = DB;

