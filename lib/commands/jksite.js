'use strict';

const fs = require('fs');
const chalk = require('chalk');
const request = require('request');
const BaseCommand = require('./base');
const ArticleModel = require('../models/article');
const ESClient = require('../misc/esclient');
const helpers = require('../misc/helpers');
const ApiClient = require('../misc/apiclient');

module.exports =  class JKSiteCommand extends BaseCommand {

  constructor() {
    super();
    this.es = new ESClient();
    this.indexName = "jksite";
    this.typeName = "article";
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

  static process(action) {
    return async (args, options) => {
      JKSiteCommand.handle(new JKSiteCommand(), action, args, options);
    }
  }

  async fetchRandomAction(args, options) {
    let res = await ArticleModel.findRandom(args.amount);
    console.log(res);
  }

  async fetchAction(args, options) {
    try {
      let res = await ArticleModel.findOne({_id: '5b49b28074f58a45acffc2f6'});
      console.log(res._images);
    } catch (e) {
      console.log(e.message);
    }
  }

  async testAction(args, options) {
    let res = await ArticleModel.findOne({_id: '5b49b28074f58a45acffc2f6'});
    let channel_id = 10;
    let category_id = 1009;
    let mtag = 1003;
    let images = [];

    for (let img of res._images) {
      if (fs.existsSync(img)) {
        images.push(fs.createReadStream(img));
      }
    }

    // https://github.com/request/request
    let formData = {
      channel_id: channel_id,
      category_id: category_id,
      mtag: mtag,
      title: res.title,
      content: res.content
    };
    for (let i = 0; i < images.length; i++) {
      formData['image_'+i] = images[i];
    }

    let c = ApiClient.getInstance();
    try {
      //let res = await c.get(this.apiURI('/api/categories'));
      //let res = await c.get(this.apiURI('/api/tags'));
      let res = await c.post({url: this.apiURI('/api/articles'), formData: formData});

      console.log(res);
    } catch (e) {
      console.log(e);
    }
  }

  async esSearchAction(args, options) {
    let key = args.keyword || "";
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

  async esSetupAction(args, options) {
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

  async esIndexAction(args, options) {
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

  async esIndexCleanAction(args, options) {
    await this.es.deleteByQuery(this.indexName, this.typeName, {
      "query": {
        "match_all": {}
      }
    });
  }

}

