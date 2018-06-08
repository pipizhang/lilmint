'use strict';

const crypto = require('crypto');
const Buffer = require('safe-buffer').Buffer;

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function toBase64(str) {
  return Buffer.from(str || '', 'utf8').toString('base64');
}

exports.md5 = md5;
exports.toBase64 = toBase64;

