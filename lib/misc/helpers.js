'use strict';

const crypto = require('crypto');
const Buffer = require('safe-buffer').Buffer;
const sanitizeHtml = require('sanitize-html');
const jsonSafeStringify = require('json-stringify-safe');

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function toBase64(str) {
  return Buffer.from(str || '', 'utf8').toString('base64');
}

function stripHtml(html) {
  return sanitizeHtml(html, {allowedTags: [], allowedAttributes: []});
}

function safeStringify (obj, replacer) {
  let ret;
  try {
    ret = JSON.stringify(obj, replacer);
  } catch (e) {
    ret = jsonSafeStringify(obj, replacer);
  }
  return ret;
}

function arrShuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

exports.md5 = md5;
exports.toBase64 = toBase64;
exports.stripHtml = stripHtml;
exports.safeStringify = safeStringify;
exports.arrShuffle = arrShuffle;

