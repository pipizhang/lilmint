'use strict';

const request = require('request-promise-native');
const util = require('util');
const helpers = require('./helpers');

class ApiClient {

  static getInstance() {
    return (new ApiClient).client;
  }

  constructor() {
    this.user_agent = process.env.USER_AGENT;
    this.api_key = process.env.API_KEY;
    this.client = request.defaults({
      headers: {
        'User-Agent': this.user_agent,
        'Authorization': util.format('Token %s', this.getToken())
      },
      timeout: 30 * 1000
    });
  }

  getToken() {
    let ua_encode = helpers.md5(this.user_agent);
    return helpers.md5(util.format('%s %s', this.api_key, ua_encode));
  }

}

module.exports = ApiClient;

