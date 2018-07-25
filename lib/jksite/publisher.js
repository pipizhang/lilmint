'use strict';

const ArticleModel = require('../jksite/article');
const ESClient = require('../misc/esclient');
const logger = require('../misc/log').getLogger();

module.exports = class Publisher {

  constructor(tag, articleId) {
    this.tag = tag;
    this.es = new ESClient();
    this.indexName = "jksite";
    this.typeName = "article";
    this.setArticle(articleId);
  }

  async setArticle(articleId) {
    this.article = await ArticleModel.find({_id: articleId});
  }

  async beforePublish() {

  }

  async afterPublish() {

  }

  /**
   * Method publish article through remote API
   *
   * @returns {Void}
   */
  async publish() {
    this.beforePublish();

    this.afterPublish();
  }

}



