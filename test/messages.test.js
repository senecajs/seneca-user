/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Code = require('@hapi/code')
const Lab = require('@hapi/lab')
const Joi = require('@hapi/joi')
const expect = Code.expect
const lab = (exports.lab = Lab.script())

const SenecaMsgTest = require('seneca-msg-test')
const Seneca = require('seneca')

lab.test('messages', { timeout: 5555 }, async () => {
  var seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('doc')
    .use('joi')
    .use('entity')
    .use('..', {
      password: {
        minlen: 3
      }
    })

  var run = SenecaMsgTest(seneca, {
    print: false,
    allow: {
      missing: true
    },
    pattern: 'sys:user',

    // NOTE: order is significant
    calls: []
      .concat(require('./register_get.calls.js'))
      .concat(require('./password.calls.js'))
      .concat(require('./adjust.calls.js'))
      .concat(require('./verify.calls.js'))
      .concat(require('./login.calls.js'))
      .concat(require('./logout.calls.js'))
      .concat(require('./change.calls.js'))
  })

  try {
    await run()
  } finally {
    await seneca.close()
  }
})
