/* Copyright (c) 2019 Richard Rodger, MIT License */
'use strict'


var Crypto = require('crypto')
const ChildProcess = require('child_process')


module.exports = function hasher(spec, done) {
  const process = ChildProcess.fork(__dirname+'/hasher.js')
  process.send(spec)
  process.on('message', async (msg) => {
    done(null, {hash:msg.hash})
  })
  process.on('error', done)
}

process.on('message', async (msg) => {
  var hash = runhash({
    src:msg.src,
    rounds:msg.rounds
  })
  
  process.send({ hash: hash })
})


function runhash(spec) {
  var out = spec.src

  for(var i = 0; i < spec.rounds; i++) {
    var shasum = Crypto.createHash('sha512')
    shasum.update(out, 'utf8')
    out = shasum.digest('hex')
  }

  return out
}
