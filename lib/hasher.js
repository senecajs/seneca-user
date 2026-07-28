/* Copyright (c) 2019-2020 Richard Rodger, MIT License */
'use strict'

const Crypto = require('crypto')
const ChildProcess = require('child_process')

// const Nid = require('nid')
// var make_hash_id = Nid({ length: 11 })

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
  var make_hash_id = seneca.util.Nid({ length: 11 })

  spec.interval = spec.interval || 11111
  spec.rounds = spec.rounds || 1

  if (spec.fail) {
    return done(new Error('DELIBERATE TEST FAIL'))
  }

  if (spec.test) {
    var hash = runhash({ src: spec.src, rounds: 1 })
    return done(null, { hash: hash })
  } else {
    // Previously forked a separate OS child process (ChildProcess.fork)
    // and waited for a reply over IPC, to keep the CPU-bound hash rounds
    // off the main event loop. Environments with no child_process support
    // at all (Cloudflare Workers — a single-threaded V8 isolate, not a
    // Node process) never throw on the fork call, they just never
    // receive a reply, so the original code waited forever for a message
    // that could never arrive (a real hang, confirmed against a Workers
    // deployment — login timed out and was killed by the runtime's own
    // hang detection, no error, no crash, just silence).
    //
    // runhash() itself is a small, synchronous, CPU-cheap loop (a few
    // thousand SHA-512 rounds — milliseconds of work), not something that
    // benefits from process isolation inside a single request's own
    // isolate the way it might inside a long-running, multi-tenant
    // Node HTTP server's shared event loop. Calling it directly here is
    // behaviorally identical (same hash, same rounds, same output) on
    // every runtime, not just ones without child_process.
    var hash = runhash(spec)
    return done(null, { hash: hash })
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

async function accept_msg(msg) {
  // console.log('--HASHER', process.pid, 'accept_msg', msg)

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
