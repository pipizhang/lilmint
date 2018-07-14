'use strict';

const util = require('util');
const chalk = require('chalk');
const DB = require('../misc/db');

class BaseCommand {

  constructor() {
    this.initialize();
  }

  async initialize() {
    this._actionDesc = {};
    await DB.connect();
  }

  async defaultAction(options) {
    console.log(chalk.bold("\n   ACTIONS\n"));
    let actions = this._getAllActionNames();
    for (let action of actions) {
      let name = action.slice(0, -6);
      console.log("    " + chalk.green(name.padEnd(25)) + this._getActionDesc(name));
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

  _getAllActionNames() {
    let obj = Reflect.getPrototypeOf(this);
    let actions = Reflect.ownKeys(obj).filter((m) => {
      return m.endsWith('Action');
    });
    return actions;
  }

  _setActionDesc(descs) {
    this._actionDesc = descs;
  }

  _getActionDesc(name) {
    return this._actionDesc[name] || "";
  }

}

module.exports = BaseCommand;

