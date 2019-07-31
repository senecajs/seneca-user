/* Copyright (c) 2019 Richard Rodger and other contributors, MIT License */
'use strict'

var Util = require('util')

var Seneca = require('seneca')

module.exports = {
  seneca_instance: function(opts) {
    opts = opts || {}
    return Seneca()
      .test(opts.fin)
      .use('promisify')
      .use('basic')
      .use('entity')
      .use('..', opts.user)
  },

  make_it: function(lab) {
    return function it(name, opts, func) {
      if ('function' === typeof opts) {
        func = opts
        opts = {}
      }

      lab.it(
        name,
        opts,
        Util.promisify(function(x, fin) {
          func(fin)
        })
      )
    }
  }
}
