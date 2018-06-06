'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articleSchema = new Schema({
  title: String,
  content: String,
  url: String,
  image_urls: [String],
  images: [{url: String, path: String, checksum: String}],
  updated_at: {type: Date, default: None}
  created_at: {type: Date, default: Date.now}
});

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;

