'use strict';

const elasticsearch = require('elasticsearch');

class ESClient {

  constructor(esURI) {
    let _esURI = esURI || process.env.ELASTICSEARCH_URI;
    this.client = new elasticsearch.Client({
      host: _esURI,
      log: 'error'
    });
  }

  getClient() {
    return this.client;
  }

  async createIndex(name) {
    let alreadyExists = await this.client.indices.exists({
      index: name
    });
    if (alreadyExists) {
      throw new Error('Index "'+name+'" exists already');
    }

    let response = await this.client.indices.create({
      index: name
    });
    alreadyExists = await this.client.indices.exists({
      index: name
    });
    return alreadyExists;
  }

  async dropIndex(name) {
    let response = await this.client.indices.delete({
      index: name
    });
    let alreadyExists = await this.client.indices.exists({
      index: name
    });
    return !alreadyExists;
  }

  async setupIndexMapping(index, type, body) {
    return await this.client.indices.putMapping({
      index: index,
      type: type,
      body: body
    });
  }

  async add(index, type, doc) {
    let alreadyExists = await this.client.exists({
      index: index,
      type: type,
      id: doc.id
    });
    if (alreadyExists) {
      return;
    }
    let response = await this.client.index({
      index: index,
      type: type,
      id: doc.id,
      body: doc.body
    });
    return response;
  }

  async update(index, type, doc) {
    let response = await this.client.update({
      index: index,
      type: type,
      id: doc.id,
      body: doc.body
    });
    return response;
  }

  async buck(items) {
    return await this.client.buck({
      body: items
    });
  }

  async get(index, type, id) {
    let response = await this.client.get({
      index: index,
      type: type,
      id: id.toString(),
    });
    return response;
  }

  async search(index, type, query) {
    let response = await this.client.search({
      index: index,
      type: type,
      body: query
    });
    return response;
  }

  async deleteByQuery(index, type, query) {
    let response = await this.client.deleteByQuery({
      index: index,
      type: type,
      body: query
    });
    return response;
  }

}

module.exports = ESClient;

