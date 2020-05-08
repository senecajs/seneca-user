/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Joi = require('@hapi/joi')

const Shared = require('./shared')

const LN = require('seneca-msg-test').LN

const print_calls = false

module.exports = [
  // continuity
  {
    pattern: 'hook:password,cmd:encrypt' + LN(),
    print: print_calls,
    params: {
      pass: '1*92hmddCTd#',
      salt: 'abe44aba97de143916a27522ab365ccb',
      rounds: 11111,
    },
    out: {
      ok: true,
      salt: 'abe44aba97de143916a27522ab365ccb',
      pass:
        'fd61a166af8a86b2e6f43415e175c3459b22741b4936c6beb71ae65d374115b5dfd89e8fae61100e1454b8bc48a18fd24bf9d0d6f316fe9791d1ca387f6b83ae',
    },
  },

  {
    pattern: 'hook:password,cmd:encrypt' + LN(),
    print: print_calls,
    params: {
      pass: 'foo',
      test: true,
      rounds: 2,
    },
    out: {
      ok: true,
      salt: Joi.string().length(32),
      pass: Joi.string().min(32),
    },
  },

  {
    pattern: 'hook:password,cmd:encrypt' + LN(),
    params: {
      password: 'foo',
      salt: 'bar',
      test: true,
      rounds: 2,
    },
    out: { ok: true, salt: 'bar', pass: Joi.string().min(32) },
  },

  {
    pattern: 'hook:password,cmd:encrypt' + LN(),
    params: {
      password: 'foo',
      salt: 'zed',
      test: true,
    },
    out: { ok: true, salt: 'zed', pass: Joi.string().min(32) },
  },

  {
    pattern: 'hook:password,cmd:encrypt' + LN(),
    params: {
      test: true,
    },
    err: { code: 'no_pass' },
  },

  {
    pattern: 'hook:password,cmd:encrypt' + LN(),
    params: {
      test: true,
      pass: {},
    },
    err: { code: 'act_invalid_msg' },
  },

  {
    pattern: 'hook:password,cmd:encrypt' + LN(),
    params: {
      test: true,
      pass: '',
    },
    err: { code: 'act_invalid_msg' },
  },

  {
    pattern: 'hook:password,cmd:encrypt' + LN(),
    params: {
      fail: true,
      pass: 'zed',
    },
    err: {},
  },
]
