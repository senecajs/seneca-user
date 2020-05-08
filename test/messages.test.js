/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Code = require('@hapi/code')
const Lab = require('@hapi/lab')
const Joi = require('@hapi/joi')
const expect = Code.expect
const lab = (exports.lab = Lab.script())

const Shared = require('./shared')

const SenecaMsgTest = require('seneca-msg-test')
const Seneca = require('seneca')

lab.test('messages', { timeout: 5555 }, async () => {
  var seneca = Shared.make_seneca()

  var run = SenecaMsgTest(seneca, {
    pattern: 'sys:user',
    print: false,
    log: false,

    // NOTE: order is significant
    calls: []
      .concat(require('./register_get.calls.js'))
      .concat(require('./password.calls.js'))
      .concat(require('./adjust.calls.js'))
      .concat(require('./verify.calls.js'))
      .concat(require('./login.calls.js'))
      .concat(require('./logout.calls.js'))
      .concat(require('./change.calls.js'))
      .concat(require('./final.calls.js')),
  })

  // TODO seneca-msg-test should handle this
  try {
    await run()
  } finally {
    await seneca.close()
  }
})
