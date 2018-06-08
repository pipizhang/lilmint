'use strict';

const util = require('util');
const DB = require('../misc/db');

class BaseCommand {

  constructor() {
    this.initilize();
  }

  async initilize() {
    await DB.connect();
  }

  async defaultAction(options) {
    console.log("please implement default action");
  }

  static async handle(cmd, args, options) {
    let actionName = util.format('%sAction', args['action'])

    if (typeof(cmd[actionName]) == 'function') {
      await cmd[actionName](options);
    } else {
      await cmd.defaultAction(options);
    }

    cmd['closeDB']();
  }

  async closeDB() {
    await DB.disconnect();
  }

}

module.exports = BaseCommand;

