'use strict';

const util = require('util');
const chalk = require('chalk');
const DB = require('../misc/db');

class BaseCommand {

  constructor() {
    this.initialize();
  }

  async initialize() {
    await DB.connect();
  }

  async defaultAction(options) {
    console.log(chalk.bold("\n   ACTIONS\n"));
    let actions = this.getAllActionNames();
    for (let action of actions) {
      console.log("    " + chalk.green(action.slice(0, -6)));
    }
    console.log("");
  }

  static async handle(cmd, args, options) {
    let actionName = util.format('%sAction', args['action']);

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

  getAllActionNames() {
    let obj = Reflect.getPrototypeOf(this);
    let actions = Reflect.ownKeys(obj).filter((m) => {
      return m.endsWith('Action');
    });
    return actions;
  }

}

module.exports = BaseCommand;

