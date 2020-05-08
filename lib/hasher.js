/* Copyright (c) 2019-2020 Richard Rodger, MIT License */
'use strict'

const Crypto = require('crypto')
const ChildProcess = require('child_process')

const Joi = require('@hapi/joi')
const Nid = require('nid')

var make_hash_id = Nid({ length: 11 })
var hasher_process
var clean_interval
var close_defined
var waiting = {}

module.exports = hasher
module.exports.close = close
module.exports.runhash = runhash
module.exports.accept_msg = accept_msg
module.exports.make_clean_waiting = make_clean_waiting
module.exports.make_handle_exit = make_handle_exit
module.exports.make_handle_message = make_handle_message
module.exports.prepare_close = prepare_close

/* $lab:coverage:off$ */
if (require.main === module) {
  process.on('message', accept_msg)
}
/* $lab:coverage:on$ */

function hasher(seneca, spec, done) {
  spec.interval = spec.interval || 11111
  spec.rounds = spec.rounds || 1

  if (spec.fail) {
    return done(new Error('DELIBERATE TEST FAIL'))
  }

  if (spec.test) {
    var hash = runhash({ src: spec.src, rounds: 1 })
    return done(null, { hash: hash })
  } else {
    if (null == hasher_process) {
      hasher_process = ChildProcess.fork(__dirname + '/hasher.js')

      hasher_process.on('message', make_handle_message(waiting))
      hasher_process.on('error', seneca.die)
      hasher_process.on('exit', make_handle_exit(seneca, hasher_process))

      clean_interval = setInterval(
        make_clean_waiting(waiting, spec.interval),
        spec.interval
      )

      close_defined = prepare_close(close_defined, seneca)
    }

    spec.id = make_hash_id()
    var waiter = (waiting[spec.id] = function (err, out) {
      done(err, out)
    })
    waiter.id = spec.id
    waiter.when = Date.now()

    // console.log('--HASHER', process.pid, 'send', spec, waiting)
    hasher_process.send(spec)
  }
}

function prepare_close(close_defined, seneca) {
  if (!close_defined) {
    seneca.add('role:seneca,cmd:close', function hasher_close(msg, reply) {
      close()
      this.prior(msg, reply)
    })
  }
  return (close_defined = true)
}

function make_handle_message(waiting) {
  return async function handle_message(msg) {
    // console.log('--HASHER', process.pid, 'handle_message', msg, waiting)
    var waiter = waiting[msg.id]
    if (waiter) {
      waiter(null, { hash: msg.hash })
    }
  }
}

function make_handle_exit(seneca, hasher_process) {
  return function handle_exit() {
    if (null != hasher_process) {
      seneca.log.warn({ user: 'hasher', exit: arguments })
      hasher_process = null
    }
    clearInterval(clean_interval)
  }
}

function close() {
  if (hasher_process) {
    hasher_process.kill()
    hasher_process = null
    clearInterval(clean_interval)
  }
}

function make_clean_waiting(waiting, interval) {
  return function clean_waiting() {
    var now = Date.now()
    Object.keys(waiting).forEach(function (k) {
      var w = waiting[k]
      if (interval < now - w.when) {
        delete waiting[k]
      }
    })
  }
}

var msg_schema = Joi.object({
  test: Joi.boolean().default(false),
  fail: Joi.boolean().default(false),
  src: Joi.string().min(1),
  rounds: Joi.number().min(1),
  interval: Joi.number().min(1).optional(),
  id: Joi.string().optional(),
})

async function accept_msg(msg) {
  // console.log('--HASHER', process.pid, 'accept_msg', msg)

  msg = Joi.attempt(msg, msg_schema)

  var hash = runhash(msg)

  /* $lab:coverage:off$ */
  process.send && process.send({ hash: hash, id: msg.id })
  /* $lab:coverage:on$ */
}

function runhash(spec) {
  var out = spec.src

  for (var i = 0; i < spec.rounds; i++) {
    var shasum = Crypto.createHash('sha512')
    shasum.update(out, 'utf8')
    out = shasum.digest('hex')
  }

  // console.log('--HASHER', process.pid, 'runhash', spec.src, spec.rounds, i, out)
  return out
}
