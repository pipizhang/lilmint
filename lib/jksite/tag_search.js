'use strict';

const ArticleModel = require('../jksite/article');
const ESClient = require('../misc/esclient');
const logger = require('../misc/log').getLogger();

/**
 * https://n3xtchen.github.io/n3xtchen/elasticsearch/2017/07/05/elasticsearch-23-useful-query-example
 */
module.exports = class TagSearch {

  constructor(tag) {
    this.tag = tag;
    this.es = new ESClient();
    this.indexName = "jksite";
    this.typeName = "article";
    this.parseIncludeWord();
    this.parseExcludeWord();
    this.parseMustWord();
  }

  parseMustWord() {
    this.mustWord = [];
    if (this.tag['must_word'] != null) {
      for (let item of this.tag['must_word'].split(',')) {
        this.mustWord.push(item.split('&'));
      }
    }
  }

  parseIncludeWord() {
    this.includeWord = [];
    if (this.tag['include_word'] != null) {
      this.includeWord = this.tag['include_word'].split(',');
    }
  }

  parseExcludeWord() {
    this.excludeWord = [];
    if (this.tag['exclude_word'] != null) {
      this.excludeWord = this.tag['exclude_word'].split(',');
    }
  }

  checkMustWord(content) {
    if (this.mustWord.length < 1) return true;
    for (let item of this.mustWord) {
      let n = 0;
      for (let v of item) {
        if (content.indexOf(v.trim()) > -1) {
          n = n + 1;
        }
      }
      if (n == item.length) {
        return true;
      }
    }
    return false;
  }

  checkIncludeWord(content) {
    if (this.includeWord.length < 1) return true;
    for (let v of this.includeWord) {
      if (content.indexOf(v.trim()) > -1) {
        return true;
      }
    }
    return false;
  }

  checkExcludeWord(content) {
    if (this.excludeWord.length < 1) return true;
    for (let v of this.excludeWord) {
      if (content.indexOf(v.trim()) > -1) {
        return false;
      }
    }
    return true;
  }

  async esQuery() {
    // Define minimum required score
    let minScore = 10;

    let mustQuery = [{"multi_match": {
      "query": this.tag['related'],
      "fields": ["title^3", "content"],
      "slop": 0
    }}];

    if (this.tag['include_word'] != null) {
      mustQuery.push({"match": {
        "content": this.tag['include_word']
      }});
    }

    if (this.tag['must_word'] != null) {
      mustQuery.push({"match": {
        "content": this.tag['must_word']
      }});
    }

    let res = await this.es.search(this.indexName, this.typeName, {
      "query" : {
        "bool": {
          "must": mustQuery
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

    let match = [];
    for (let item of res.hits.hits) {
      if (item._score > minScore) {
        if (this.checkIncludeWord(item._source.content)
          && this.checkMustWord(item._source.content)
          && this.checkExcludeWord(item._source.content)
        ) {
          match.push(item._id);
          //console.log("-------[ok]-----------");
          //console.log(chalk.blue(item._score));
          //console.log(chalk.red(item._source.title));
          //console.log(chalk.gray(item._source.content));
          //console.log("");
          //console.log(chalk.yellow(item.highlight.content.join("...")));
          //console.log("is_used: " + item._source.is_used);
          //console.log("\n");
        } else {
          //console.log("=======[no]===========");
          //console.log(chalk.blue(item._score));
          //console.log(chalk.red(item._source.title));
          //console.log("\n");
        }
      }
    }
    return match;
  }

}


