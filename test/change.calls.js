/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Joi = require('@hapi/joi')

var print_calls = false

var call = {}

const Shared = require('./shared')

const LN = require('seneca-msg-test').LN

module.exports = [
  // generate a password
  {
    print: print_calls,
    pattern: 'change:pass' + LN(),
    params: {
      user: {
        email: 'cathy@example.com',
      },
      generate: true,
    },
    out: { ok: true, pass: Joi.string().min(12), user: { handle: 'cathy' } },
  },

  // not a user
  {
    print: print_calls,
    pattern: 'change:pass' + LN(),
    params: {
      user: {
        email: 'not-cathy@example.com',
      },
      generate: true,
    },
    out: { ok: false, why: 'user-not-found' },
  },

  // by repeat password
  {
    print: print_calls,
    pattern: 'change:pass' + LN(),
    params: {
      q: {
        email: 'cathy@example.com',
      },
      password: 'cathy-pass-01',
      repeat: 'cathy-pass-01',
    },
    out: { ok: true, user: { handle: 'cathy' } },
  },

  // verify login works
  {
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      q: {
        email: 'cathy@example.com',
      },
      pass: 'cathy-pass-01',
    },
    out: {
      ok: true,
      user: { handle: 'cathy' },
      login: { handle: 'cathy' },
    },
  },

  // bad repeat password
  {
    print: print_calls,
    pattern: 'change:pass' + LN(),
    params: {
      q: {
        email: 'not-cathy@example.com',
      },
      password: 'cathy-pass-01',
      repeat: 'not-cathy-pass-01',
    },
    out: { ok: false, why: 'repeat-password-mismatch' },
  },

  // verify login still works using correct pass
  {
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      q: {
        email: 'cathy@example.com',
      },
      pass: 'cathy-pass-01',
    },
    out: {
      ok: true,
      user: { handle: 'cathy' },
      login: { handle: 'cathy' },
    },
  },

  // simple
  {
    print: print_calls,
    pattern: 'change:pass' + LN(),
    params: {
      email: 'cathy@example.com',
      password: 'cathy-pass-02',
    },
    out: { ok: true, user: { handle: 'cathy' } },
  },

  // verify login works with new pass
  {
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      q: {
        email: 'cathy@example.com',
      },
      pass: 'cathy-pass-02',
    },
    out: {
      ok: true,
      user: { handle: 'cathy' },
      login: { handle: 'cathy' },
    },
  },

  // check handle is valid and available
  {
    print: print_calls,
    pattern: 'check:handle' + LN(),
    params: {
      handle: 'catherine',
    },
    out: { ok: true, handle: 'catherine' },
  },

  // check handle - used
  {
    print: print_calls,
    pattern: 'check:handle' + LN(),
    params: {
      handle: 'cathy',
    },
    out: { ok: false, handle: 'cathy', why: 'handle-exists' },
  },

  // check handle - bad
  {
    print: print_calls,
    pattern: 'check:handle' + LN(),
    params: {
      handle: 'cathy!',
    },
    out: { ok: false, handle: 'cathy!', why: 'invalid-chars' },
  },

  {
    print: print_calls,
    pattern: 'change:handle' + LN(),
    params: {
      handle: 'cathy',
      new_handle: 'catherine',
    },
    out: {
      ok: true,
      user: { handle: 'catherine', email: 'cathy@example.com' },
    },
  },

  // change to same has no effect
  {
    print: print_calls,
    pattern: 'change:handle' + LN(),
    params: {
      email: 'cathy@example.com',
      new_handle: 'catherine',
    },
    out: {
      ok: true,
      user: { handle: 'catherine', email: 'cathy@example.com' },
    },
  },

  // can't use existing handle
  {
    print: print_calls,
    pattern: 'change:handle' + LN(),
    params: {
      handle: 'catherine',
      new_handle: 'alice',
    },
    out: {
      ok: false,
      why: 'handle-exists',
      details: {
        handle: 'alice',
        user_handle: 'catherine',
      },
    },
  },

  //
  {
    print: print_calls,
    pattern: 'change:handle' + LN(),
    params: {
      handle: 'not-catherine',
      new_handle: 'alice',
    },
    out: {
      ok: false,
      why: 'user-not-found',
    },
  },

  // change email

  {
    print: print_calls,
    pattern: 'change:email' + LN(),
    params: {
      email: 'cathy@example.com',
      new_email: 'catherine@example.com',
    },
    out: {
      ok: true,
      user: { handle: 'catherine', email: 'catherine@example.com' },
    },
  },

  {
    print: print_calls,
    pattern: 'change:email' + LN(),
    params: {
      email: 'cathy@example.com',
      new_email: 'not-an-email',
    },
    err: { code: 'act_invalid_msg' },
  },

  // email change with code
  {
    print: print_calls,
    name: 'emailcode0',
    pattern: 'make:verify' + LN(),
    params: {
      handle: 'catherine',
      kind: 'email',
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
    /*
    verify: function(call) {
      console.log(call.result.out.verify.data$())
    }
    */
  },

  {
    print: print_calls,
    pattern: 'change:email' + LN(),
    params: {
      email: 'not-catherine@example.com',
      new_email: 'catherinethegreat@example.com',
    },
    out: { ok: false, why: 'user-not-found' },
  },

  {
    print: print_calls,
    pattern: 'change:email' + LN(),
    params: {
      email: 'catherine@example.com',
      new_email: 'catherinethegreat@example.com',
      verify: 'bad-code',
    },
    out: {
      ok: false,
      why: 'no-verify',
      details: { q: { kind: 'email', code: 'bad-code' } },
    },
  },

  {
    print: print_calls,
    pattern: 'get:user' + LN(),
    params: {
      email: 'catherine@example.com',
    },
    out: { ok: true, user: { email: 'catherine@example.com' } },
  },

  {
    print: print_calls,
    pattern: 'change:email' + LN(),
    params: {
      email: 'catherine@example.com',
      new_email: 'catherinethegreat@example.com',
      verify: '`emailcode0:out.verify.code`',
    },
    out: { ok: true, user: { email: 'catherinethegreat@example.com' } },
  },

  {
    print: print_calls,
    pattern: 'get:user' + LN(),
    params: {
      email: 'catherinethegreat@example.com',
    },
    out: { ok: true, user: { email: 'catherinethegreat@example.com' } },
  },

  {
    print: print_calls,
    pattern: 'change:email' + LN(),
    params: {
      handle: 'catherine',
      new_email: 'catherinethegreat@example.com',
      verify: '`emailcode0:out.verify.code`',
    },
    out: { ok: false, why: 'verify-already-used' },
  },

  {
    print: print_calls,
    pattern: 'change:email' + LN(),
    params: {
      handle: 'catherine',
      new_email: 'catherinethegreat@example.com',
    },
    out: { ok: true },
  },

  {
    print: print_calls,
    pattern: 'change:email' + LN(),
    params: {
      handle: 'catherine',
      new_email: 'bob@example.com',
    },
    out: {
      ok: false,
      why: 'email-exists',
      details: {
        new_email: 'bob@example.com',
        old_email: 'catherinethegreat@example.com',
      },
    },
  },

  {
    print: print_calls,
    pattern: 'update:user' + LN(),
    params: {
      handle: 'frank',
      user: {
        foo: 1,
        zed: 'a',
      },
    },
    out: {
      ok: true,
      user: {
        handle: 'frank',
        foo: 1,
        zed: 'a',
      },
    },
  },

  {
    print: print_calls,
    pattern: 'get:user' + LN(),
    params: {
      handle: 'frank',
      fields: ['foo', 'zed'],
    },
    out: {
      ok: true,
      user: {
        handle: 'frank',
        foo: 1,
        zed: 'a',
      },
    },
  },

  {
    print: print_calls,
    pattern: 'update:user' + LN(),
    params: {
      handle: 'frank',
      user: {
        email: 'frankly@example.com',
      },
    },
    out: {
      ok: true,
      user: {
        handle: 'frank',
        email: 'frankly@example.com',
      },
    },
  },

  {
    print: print_calls,
    pattern: 'update:user' + LN(),
    params: {
      handle: 'not-frank',
      user: {
        email: 'frankly2@example.com',
      },
    },
    out: {
      ok: false,
      why: 'user-not-found',
    },
  },

  {
    print: print_calls,
    pattern: 'update:user' + LN(),
    params: {
      handle: 'frank',
      pass: 'frank001',
    },
    out: {
      ok: true,
      user: {
        handle: 'frank',
      },
    },
  },

  {
    print: print_calls,
    pattern: 'update:user' + LN(),
    params: {
      handle: 'frank',
      user: {
        pass: 'frank002',
      },
    },
    out: {
      ok: true,
      user: {
        handle: 'frank',
      },
    },
  },

  {
    print: print_calls,
    pattern: 'update:user' + LN(),
    params: {
      handle: 'frank',
      user_data: {
        pass: 'frank002',
      },
    },
    out: {
      ok: true,
      user: {
        handle: 'frank',
      },
    },
  },

  {
    print: print_calls,
    pattern: 'update:user' + LN(),
    params: {
      handle: 'frank',
      user: {
        handle: 'franklymaybe',
      },
    },
    out: {
      ok: true,
      user: {
        handle: 'franklymaybe',
      },
    },
  },

  {
    print: print_calls,
    pattern: 'update:user' + LN(),
    params: {
      handle: 'franklymaybe',
      user_data: {
        handle: 'frankly',
      },
    },
    out: {
      ok: true,
      user: {
        handle: 'frankly',
      },
    },
  },

  {
    print: print_calls,
    pattern: 'update:user' + LN(),
    params: {
      handle: 'frankly',
      user_data: {
        handle: 'bob',
      },
    },
    out: {
      ok: false,
    },
  },

  {
    print: print_calls,
    pattern: 'update:user' + LN(),
    params: {
      handle: 'frankly',
      user_data: {
        email: 'bob@example.com',
      },
    },
    out: {
      ok: false,
    },
  },

  {
    print: print_calls,
    pattern: 'update:user' + LN(),
    params: {
      handle: 'frankly',
      user_data: {
        pass: 'aaa',
        repeat: 'bbb',
      },
    },
    out: {
      ok: false,
    },
  },
]
