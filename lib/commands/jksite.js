'use strict';

const chalk = require('chalk');
const request = require('request');
const BaseCommand = require('./base');
const ArticleModel = require('../models/article');
const ESClient = require('../misc/esclient');
const helpers = require('../misc/helpers');
const ApiClient = require('../misc/apiclient');

class JKSiteCommand extends BaseCommand {

  constructor() {
    super();
    this.es = new ESClient();
    this.indexName = "jksite";
    this.typeName = "article";
    this._setActionDesc({
      "esSearch":     "Search article from ES",
      "esSetup":      "Initialize ES indexs",
      "esIndex":      "Index article to ES",
      "esIndexClean": "Clean up Index"
    });
  }

  apiURI(path) {
    return process.env.JKTREE_API + path;
  }

  async _getTags() {
    let c = ApiClient.getInstance();
    let res = [];
    try {
      res = await c.get(this.apiURI('/api/tags'));
    } catch (e) {
      console.log(e);
    }
    return res;
  }

  static process(args, options) {
    JKSiteCommand.handle(new JKSiteCommand(), args, options);
  }

  async fetchRandomAction(options) {
    let res = await ArticleModel.findRandom(3);
    console.log(res);
  }

  async fetchAction(options) {
    try {
      let res = await ArticleModel.findOne({_id: '5b2d1ba7751f8d7ed23a39ff'});
      console.log(res);
    } catch (e) {
      console.log(e.message);
    }
  }

  async testAction(options) {
    let res = await ArticleModel.findOne({_id: '5b2d1ba7751f8d7ed23a39ff'});
    let channel_id = 10;
    let category_id = 1009;
    let mtag = 1003;

    console.log(res);

    // https://github.com/request/request
    let formData = {
      'channel_id': channel_id,
      'category_id': category_id,
      'mtag': mtag,
      'title': res.title,
      'content': res.content,
    };

    let c = ApiClient.getInstance();
    try {
      //let res = await c.get(this.apiURI('/api/categories'));
      //let res = await c.get(this.apiURI('/api/tags'));
      let res = await c.post(this.apiURI('/api/articles')).form(formData);

      console.log(res);
    } catch (e) {
      console.log(e);
    }
  }

  async esSearchAction(options) {
    let key = options.search || "";
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
      console.log("is_used: " + item._source.is_used);
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
        },
        "is_used": {
          "type": "boolean"
        }
      }
    });
  }

  async esIndexAction(options) {
    let res = await ArticleModel.findUnIndexed();

    for (let item of res) {
      console.log('Indexed ' + item.title);
      let doc = {
        id: item.id,
        body: {
          title: item.title,
          content: helpers.stripHtml(item.content),
          is_used: false
        }
      };
      await this.es.add(this.indexName, this.typeName, doc);
      item.indexed_at = Date.now();
      await item.save();
    }
  }

  async esIndexCleanAction(options) {
    await this.es.deleteByQuery(this.indexName, this.typeName, {
      "query": {
        "match_all": {}
      }
    });
  }

}

module.exports = JKSiteCommand;

