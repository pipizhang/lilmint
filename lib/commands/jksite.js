'use strict';

const BaseCommand = require('./base');
const ArticleModel = require('../models/article');

class JKSiteCommand extends BaseCommand {

  constructor() {
    super();
  }

  static process(args, options) {
    JKSiteCommand.handle(new JKSiteCommand(), args, options);
  }

  async fetchAction(options) {
    let res = await ArticleModel.findOne({_id: '5b19c6cbca8bdef9208b196b'});
    console.log(res.content);
  }

  async indexAction(options) {
    let res = await ArticleModel.findUnIndexed();

    for (let item of res) {
      console.log(item.title);
      //item.indexed_at = Date.now();
      //await item.save();
    }
  }

}

module.exports = JKSiteCommand;

