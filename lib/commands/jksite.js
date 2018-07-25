'use strict';

const fs = require('fs');
const chalk = require('chalk');
const request = require('request');
const sleep = require('sleep');
const BaseCommand = require('./base');
const ArticleModel = require('../jksite/article');
const TagSearch = require('../jksite/tag_search');
const ESClient = require('../misc/esclient');
const helpers = require('../misc/helpers');
const logger = require('../misc/log').getLogger();
const ApiClient = require('../misc/apiclient');

module.exports = class JKSiteCommand extends BaseCommand {

  constructor() {
    super();
    this.es = new ESClient();
    this.indexName = "jksite";
    this.typeName = "article";
    this.tags = null;
  }

  apiURI(path) {
    return process.env.JKTREE_API + path;
  }

  /**
   * Fetch all tag data via API
   *
   * @returns {Void}
   */
  async _getTags() {
    if (this.tags != null) {
      return this.tags;
    }
    let c = ApiClient.getInstance();
    try {
      let res = await c.get(this.apiURI('/api/tags'));
      let obj = JSON.parse(res);
      if (obj['status'] == 200) {
        this.tags = obj['data'];
      }
    } catch (e) {
      logger.log('error', 'Failted to fetch tags "%s"', e.message);
    }
    return this.tags;
  }

  static process(action) {
    return async (args, options) => {
      JKSiteCommand.handle(new JKSiteCommand(), action, args, options);
    }
  }

  /**
   * Action prints out a random article
   *
   * @param {Array} [args]
   * @param {Array} [options]
   * @returns {Void}
   */
  async fetchRandomAction(args, options) {
    let res = await ArticleModel.findRandom(args.amount);
    console.log(res);
  }

  /**
   * Action prints out a aritcle out by giving id
   *
   * @param {Array} [args]
   * @param {Array} [options]
   * @returns {Void}
   */
  async fetchAction(args, options) {
    try {
      let res = await ArticleModel.findOne({_id: '5b49b28074f58a45acffc2f6'});
      console.log(res._images);
    } catch (e) {
      console.log(e.message);
    }
  }

  /**
   * Action prints all tags out
   *
   * @param {Array} [args]
   * @param {Array} [options]
   * @returns {Void}
   */
  async showTagsAction(args, options) {
    let tags = await this._getTags();
    for (let tag of tags) {
      console.log(tag);
    }
  }

  async testAction(args, options) {
    let res = await ArticleModel.findOne({_id: '5b49b28074f58a45acffc2f6', consumer: null});
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
      content: res.content,
      url: res.url
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

  /**
   * Action returns search result from ElasticSearch
   *
   * @param {Array} [args]
   * @param {Array} [options]
   * @returns {Void}
   */
  async esSearchAction(args, options) {
    let key = args.keyword || "";
    let res = await this.es.search(this.indexName, this.typeName, {
      "query" : {
        "multi_match": {
          "query": key,
          "fields": ["title^3", "content"]
        }
      },
      "highlight" : {
        "pre_tags" : ["<em>"],
        "post_tags" : ["</em>"],
        "fields" : {
          "title" : {},
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

  /**
   * Action returns search result from ElasticSearch
   *
   * @param {Array} [args]
   * @param {Array} [options]
   * @returns {Void}
   */
  async publishAction(args, options) {
    let key = args.keyword || "";
    let tags = await this._getTags();
    tags = helpers.arrShuffle(tags);
    //let tag  = tags[Math.floor(Math.random()*tags.length)];

    for (let tag of tags) {
      console.log("------------------------------------");
      console.log(tag);
      sleep.sleep(2);

      let ts = new TagSearch(tag);
      let res = await ts.esQuery();
      //console.log(res);
      for (let id of res) {
        let article = await ArticleModel.findOne({_id: id});
        console.log(article);
      }
      sleep.sleep(4);

    }
  }

  /**
   * Action returns search result from ElasticSearch
   *
   * @param {Array} [args]
   * @param {Array} [options]
   * @returns {Void}
   */
  async esSetupAction(args, options) {
    await this.es.dropIndex(this.indexName);
    await this.es.createIndex(this.indexName);
    await this.es.setupIndexMapping(this.indexName, this.typeName, {
      "properties": {
        "title": {
          "type": "text",
          "analyzer": "ik_smart",
          "search_analyzer": "ik_smart"
        },
        "content": {
          "type": "text",
          "analyzer": "ik_smart",
          "search_analyzer": "ik_smart"
        },
        "is_used": {
          "type": "boolean"
        }
      }
    });
    await ArticleModel.updateMany({}, {$set: {indexed_at: null}});
  }

  /**
   * Action indexes new articles from MongoDB to ElasticSearch
   *
   * @param {Array} [args]
   * @param {Array} [options]
   * @returns {Void}
   */
  async esIndexAction(args, options) {
    let res = await ArticleModel.findUnIndexed();

    for (let item of res) {
      console.log('Indexed ' + item.title);
      let doc = {
        id: item.id,
        body: {
          title: item.title,
          content: helpers.stripHtml(item.content),
          is_used: item.consumed_at == null ? false : true
        }
      };
      await this.es.add(this.indexName, this.typeName, doc);
      item.indexed_at = Date.now();
      await item.save();
    }
  }

  /**
   * Action remove all indexes from ElasticSearch and reset model.indexed_at to null
   *
   * @param {Array} [args]
   * @param {Array} [options]
   * @returns {Void}
   */
  async esIndexCleanAction(args, options) {
    await this.es.deleteByQuery(this.indexName, this.typeName, {
      "query": {
        "match_all": {}
      }
    });
    await ArticleModel.updateMany({}, {$set: {indexed_at: null}});
  }

}

