'use strict';

module.exports = class Commander {

  static call(receiver) {
    let m = receiver.split("::");
    return require('../commands/'+m[0]).process(m[1]);
  }

}

