'use strict';

const util = require('util');
const chalk = require('chalk');
const DB = require('../misc/db');

module.exports = class BaseCommand {

  constructor() {
    this.initialize();
  }

  async initialize() {
    this._actionDesc = {};
    await DB.connect();
  }

  async defaultAction() {
    console.log(chalk.bold("\n   ACTIONS\n"));
    let actions = this._getAllActionNames();
    for (let action of actions) {
      let name = action.slice(0, -6);
      console.log("    " + chalk.green(name));
    }
    console.log("");
  }

  static async handle(cmd, action, args, options) {
    let actionName = util.format('%sAction', action);

    if (typeof(cmd[actionName]) == 'function') {
      await cmd[actionName](args, options);
    } else {
      await cmd.defaultAction();
    }

    cmd['closeDB']();
  }

  async closeDB() {
    await DB.disconnect();
  }

  _getAllActionNames() {
    let obj = Reflect.getPrototypeOf(this);
    let actions = Reflect.ownKeys(obj).filter((m) => {
      return m.endsWith('Action');
    });
    return actions;
  }

}


