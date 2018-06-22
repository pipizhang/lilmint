'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articleSchema = new Schema({
  title: String,
  content: String,
  provider: String,
  url: String,
  image_urls: [String],
  images: [{url: String, path: String, checksum: String}],
  updated_at: {type: Date, default: null},
  created_at: {type: Date, default: Date.now},
  indexed_at: {type: Date, default: null},
}, { collection: 'jkArticle' });

articleSchema.statics.findUnIndexed = async function() {
  try{
    let list = await this.find({$or: [
      {indexed_at: {$exists: false}},
      {indexed_at: null}
    ]});
    return list;
  } catch (err) {
    throw new Error(err);
  }
};

articleSchema.statics.findRandom = async function(n) {
  let count  = await this.count();
  let random = Math.floor(Math.random() * count) - n;
  let skip   = Math.max(0, random);
  let res    = this.find().skip(skip).limit(n);
  return res;
};

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;

