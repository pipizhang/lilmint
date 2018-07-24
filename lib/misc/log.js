'use strict';

const winston = require('winston');
const path = require('path');
const {format, transports} = winston;

class Log {

  static getLogger() {
    return (new Log).logger;
  }

  constructor() {
    let myFormat = format.printf(info => {
      return `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`;
    });

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL,
      transports: [
        new transports.Console(),
        new transports.File({
            filename: this.getLogFilePath()
        })
      ],
      format: format.combine(
        format.splat(),
        format.timestamp(),
        myFormat
      )
    });
  }

  getLogFilePath() {
    let fp = process.env.LOG_FILE;
    if (path.isAbsolute(fp)) {
      return fp;
    } else {
      return path.resolve(__dirname, '../../', fp);
    }
  }

}

module.exports = Log;


