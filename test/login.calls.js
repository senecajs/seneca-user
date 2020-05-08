/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Joi = require('@hapi/joi')

var print_calls = false

var call = {}

const Shared = require('./shared')

const LN = require('seneca-msg-test').LN

// NOTE: assumes register_get.calls

module.exports = [
  // test setting: options.password.minlen = 2
  {
    print: print_calls,
    pattern: 'hook:password,cmd:encrypt' + LN(),
    params: {
      pass: 'ab',
      salt: 'bar',
    },
    out: {
      ok: false,
      why: 'password-too-short',
      details: { password_length: 2, minimum: 3 },
    },
  },

  {
    name: 'fbp0',
    print: print_calls,
    pattern: 'hook:password,cmd:encrypt' + LN(),
    params: {
      pass: 'foo',
      salt: 'bar',
    },
    out: {
      ok: true,
      salt: 'bar',
    },
  },

  {
    print: print_calls,
    pattern: 'hook:password,cmd:pass' + LN(),
    params: {
      proposed: 'foo',
      pass: '`fbp0:out.pass`',
      salt: 'bar',
    },
    out: {
      ok: true,
    },
  },

  {
    print: print_calls,
    pattern: 'hook:password,cmd:pass' + LN(),
    params: {
      proposed: 'x',
      pass: '`fbp0:out.pass`',
      salt: 'bar',
    },
    out: {
      ok: false,
      why: 'password-too-short',
    },
  },

  {
    print: print_calls,
    pattern: 'hook:password,cmd:pass' + LN(),
    params: {
      proposed: 'not-foo',
      pass: '`fbp0:out.pass`',
      salt: 'bar',
    },
    out: {
      ok: false,
      why: 'no-match',
    },
  },

  {
    print: print_calls,
    pattern: 'hook:password,cmd:pass' + LN(),
    params: {
      proposed: 'foo',
      pass: '`fbp0:out.pass`',
      salt: 'not-bar',
    },
    out: {
      ok: false,
      why: 'no-match',
    },
  },

  {
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'not-a-user',
    },
    out: {
      ok: false,
      user: null,
      why: 'user-not-found',
    },
  },

  {
    name: 'al0',
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'alice',
      auto: true,
    },
    out: {
      ok: true,
      user: { handle: 'alice' },
      login: { handle: 'alice' },
    },
    /*
    verify: function(call) {
      console.log(call.result.out.user.data$())
      console.log(call.result.out.login.data$())
    }
    */
  },

  {
    print: print_calls,
    pattern: 'auth:user' + LN(),
    params: {
      token: '`al0:out.login.token`',
    },
    out: {
      ok: true,
      user: { handle: 'alice' },
      login: { handle: 'alice' },
    },
  },

  {
    print: print_calls,
    pattern: 'auth:user' + LN(),
    params: {
      token: 'not-a-token',
    },
    out: {
      ok: false,
      token: 'not-a-token',
      why: 'login-not-found',
    },
  },

  {
    name: 'bl0',
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'bob',
      auto: true,
      login_data: {
        handle: 'wrong', // will get overridden
        bar: 1,
      },
    },
    out: {
      ok: true,
      user: { handle: 'bob' },
      login: { handle: 'bob', bar: 1 },
    },
  },

  {
    print: print_calls,
    pattern: 'auth:user' + LN(),
    params: {
      token: '`bl0:out.login.token`',
      user_fields: ['foo'],
    },
    out: {
      ok: true,
      user: { handle: 'bob', foo: 1 },
      login: { handle: 'bob', bar: 1 },
    },
  },

  {
    print: print_calls,
    pattern: 'register:user' + LN(),
    params: {
      handle: 'edward',
      email: 'edward@example.com',
      password: 'edward123',
      repeat: 'not-a-repeat',
    },
    out: {
      ok: false,
      why: 'repeat-password-mismatch',
    },
  },

  {
    print: print_calls,
    pattern: 'register:user' + LN(),
    params: {
      handle: 'edward',
      email: 'edward@example.com',
      password: 'edward123',
      repeat: 'edward123',
    },
    out: {
      ok: true,
      user: { handle: 'edward', email: 'edward@example.com' },
    },
  },

  {
    name: 'el0',
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'edward',
    },
    out: {
      ok: false,
      why: 'no-login-method',
    },
  },

  {
    name: 'el0',
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'edward',
      password: 'edward123',
      login_data: {
        foo: 1, // add extra login fields
      },
    },
    out: {
      ok: true,
      user: { handle: 'edward', email: 'edward@example.com' },
      login: { handle: 'edward', email: 'edward@example.com', foo: 1 },
    },
  },

  {
    print: print_calls,
    pattern: 'register:user' + LN(),
    params: {
      handle: 'frank',
      email: 'frank@example.com',
      pass: 'frank123', // repeat is optional
      user_data: {
        foo: 1,
      },
    },
    out: {
      ok: true,
      user: { foo: 1, handle: 'frank', email: 'frank@example.com' },
    },
  },

  {
    name: 'fl0',
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'frank',
      password: 'frank123',
      q: {
        fields$: ['foo'], // load extra fields from user
      },
    },
    out: {
      ok: true,
      user: { handle: 'frank', email: 'frank@example.com', foo: 1 },
      login: { handle: 'frank', email: 'frank@example.com' },
    },
  },

  // multiple active logins
  {
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'frank',
      pass: 'frank123',
      q: {
        fields$: ['foo'], // load extra fields from user
      },
      login_data: {
        bar: 1,
      },
    },
    out: {
      ok: true,
      user: { handle: 'frank', email: 'frank@example.com', foo: 1 },
      login: { handle: 'frank', email: 'frank@example.com' },
    },
  },

  {
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'frank',
      password: 'not-franks-password',
    },
    out: {
      ok: false,
      why: 'invalid-password',
    },
  },

  {
    print: print_calls,
    pattern: 'list:login' + LN(),
    params: {
      handle: 'frank',
      active: true,
    },
    out: {
      ok: true,
      items: Joi.array().length(2), // 2 active logins
    },
  },

  {
    print: print_calls,
    pattern: 'list:login' + LN(),
    params: {
      handle: 'frank',
      login_q: {
        // specify a subset of logins
        bar: 1,
      },
    },
    out: {
      ok: true,
      items: Joi.array().length(1), // 1 matching active login
    },
  },

  {
    print: print_calls,
    pattern: 'list:login' + LN(),
    params: {
      handle: 'not-frank',
    },
    out: {
      ok: false,
      why: 'user-not-found',
    },
  },

  {
    print: print_calls,
    pattern: 'list:login' + LN(),
    params: {
      handle: 'frank',
      active: false,
    },
    out: {
      ok: true,
      items: Joi.array().length(0), // 0 non-active logins
    },
  },

  {
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'frank',
      verify: 'bad-login-code',
    },
    out: {
      ok: false,
      why: 'no-verify',
      details: { q: { kind: 'login', code: 'bad-login-code' } },
    },
  },

  // login code for frank...
  {
    print: print_calls,
    name: 'franklogin0',
    pattern: 'make:verify' + LN(),
    params: {
      handle: 'frank',
      kind: 'login',
      valid: true,
      unique: false,
      expire_point: new Date().getTime() + 10 * 60 * 1000,
    },
    out: {
      ok: true,
      verify: {
        code: Joi.string(),
        once: true,
        used: false,
      },
    },
  },

  {
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'frank',
      verify: '`franklogin0:out.verify.code`',
    },
    out: {
      ok: true,
      user: { handle: 'frank' },
      login: { handle: 'frank' },
      why: 'verify',
    },
  },
]
