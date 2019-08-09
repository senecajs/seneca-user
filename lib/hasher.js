/* Copyright (c) 2019 Richard Rodger, MIT License */
'use strict'

const Crypto = require('crypto')
const ChildProcess = require('child_process')

const Nid = require('nid')

var make_hash_id = Nid({ length: 11 })
var hasher_process
var clean_interval
var close_defined
var waiting = {}

module.exports = hasher
module.exports.close = close

function hasher(seneca, spec, done) {
  if (spec.test) {
    var hash = runhash({ src: spec.src, rounds: 1 })
    return done(null, { hash: hash })
  } else {
    if (null == hasher_process) {
      hasher_process = ChildProcess.fork(__dirname + '/hasher.js')

      hasher_process.on('message', async msg => {
        var spec_done = waiting[msg.id]
        if (spec_done) {
          spec_done(null, { hash: msg.hash })
        }
      })
      hasher_process.on('error', seneca.die)
      hasher_process.on('exit', function() {
        if (null != hasher_process) {
          seneca.log.warn({ user: 'hasher', exit: arguments })
          hasher_process = null
        }
        clearInterval(clean_interval)
      })

      clean_interval = setInterval(function clean_waiting() {
        var now = Date.now()
        Object.keys(waiting).forEach(function(w) {
          if (111111 < now - w.when) {
            delete waiting[w.id]
          }
        })
      }, 11111)

      if (!close_defined) {
        seneca.add('role:seneca,cmd:close', function hasher_close(msg, reply) {
          close()
          this.prior(msg, reply)
        })
        close_defined = true
      }
    }

    spec.id = make_hash_id()
    waiting[spec.id] = done
    done.id = spec.id
    done.when = Date.now()

    hasher_process.send(spec)
  }
}

function close() {
  if (hasher_process) {
    hasher_process.kill()
    hasher_process = null
    clearInterval(clean_interval)
  }
}

if (require.main === module) {
  process.on('message', async msg => {
    var hash = runhash({
      src: msg.src,
      rounds: msg.rounds
    })

    process.send({ hash: hash, id: msg.id })
  })
}

function runhash(spec) {
  var out = spec.src

  for (var i = 0; i < spec.rounds; i++) {
    var shasum = Crypto.createHash('sha512')
    shasum.update(out, 'utf8')
    out = shasum.digest('hex')
  }

  return out
}
