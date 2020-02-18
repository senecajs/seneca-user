/* Copyright (c) 2019-2020 Richard Rodger and other contributors, MIT License */
'use strict'

//const Util = require('util')

//const Seneca = require('seneca')

module.exports = {
  LN: ()=>(',LN:'+new Error().stack.split('\n')[2]
           .match(/\/([^.\/]+)[^\/]*\.js:(\d+):/)
           .filter((x,i)=>i==1||i==2).join('~'))


  /*
  seneca_instance: function(opts) {
    opts = opts || {}
    return (
      Seneca()
        .test(opts.fin)
        .use('promisify')
        //.use('basic')
        .use('entity')
        .use('..', opts.user)
    )
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
  */
}
