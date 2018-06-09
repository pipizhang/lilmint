'use strict';

const chalk = require('chalk');
const BaseCommand = require('./base');
const ArticleModel = require('../models/article');
const ESClient = require('../misc/esclient');
const helpers = require('../misc/helpers');

class JKSiteCommand extends BaseCommand {

  constructor() {
    super();
    this.es = new ESClient();
    this.indexName = "jksite";
    this.typeName = "article";
  }

  static process(args, options) {
    JKSiteCommand.handle(new JKSiteCommand(), args, options);
  }

  async fetchAction(options) {
    let res = await ArticleModel.findOne({_id: '5b19c6cbca8bdef9208b196b'});
    console.log(res.content);
  }

  async esSearchAction(options) {
    let key = options.search || ""
    let res = await this.es.search(this.indexName, this.typeName, {
      "query" : { "match" : { "content" : key }},
      "highlight" : {
        "pre_tags" : ["<em>"],
        "post_tags" : ["</em>"],
        "fields" : {
          "content" : {}
        }
      }
    });
    for (let item of res.hits.hits) {
      console.log(chalk.blue(item._score));
      console.log(chalk.red(item._source.title));
      console.log(chalk.gray(item._source.content));
      console.log("");
      console.log(chalk.yellow(item.highlight.content.join("...")));
      console.log("\n");
    }
  }

  async esSetupAction(options) {
    await this.es.createIndex(this.indexName);
    await this.es.setupIndexMapping(this.indexName, this.typeName, {
      "properties": {
        "title": {
          "type": "text",
          "analyzer": "ik_max_word",
          "search_analyzer": "ik_max_word"
        },
        "content": {
          "type": "text",
          "analyzer": "ik_max_word",
          "search_analyzer": "ik_max_word"
        }
      }
    });
  }

  async esIndexAction(options) {
    let res = await ArticleModel.findUnIndexed();

    for (let item of res) {
      let doc = {
        id: item.id,
        body: {
          title: item.title,
          content: helpers.stripHtml(item.content)
        }
      };
      await this.es.add(this.indexName, this.typeName, doc);
      console.log(doc.title);
      //item.indexed_at = Date.now();
      //await item.save();
    }
  }

}

module.exports = JKSiteCommand;

