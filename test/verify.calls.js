/* Copyright (c) 2020-2022 Richard Rodger and other contributors, MIT License */
'use strict'

var print_calls = false

var call = {}

const Shared = require('./shared')

const LN = require('seneca-msg-test').LN

module.exports = [
  // user not found
  {
    print: print_calls,
    pattern: 'make:verify' + LN(),
    params: {},
    out: { ok: false, why: 'no-user-query' },
  },

  // mark a user email as verified
  {
    print: print_calls,
    pattern: 'make:verify' + LN(),
    params: {
      handle: 'alice',
      kind: 'email',
      valid: true,
      once: false,
      custom: {
        email: 'alice@example.com',
      },
    },
    out: {
      ok: true,
      verify: {
        email: 'alice@example.com',
        kind: 'email',
        once: false,
        used: false,
        valid: true,
      },
    },
  },

  // mark a user email as verified, convenience field
  {
    print: print_calls,
    pattern: 'make:verify' + LN(),
    params: {
      handle: 'alice',
      kind: 'email',
      valid: true,
      once: false,
      email: 'alice-other@example.com', // `kind` can go at top level
    },
    out: {
      ok: true,
      verify: {
        email: 'alice-other@example.com',
        kind: 'email',
        once: false,
        valid: true,
      },
    },
  },

  // unique verification
  {
    print: print_calls,
    pattern: 'make:verify' + LN(),
    params: {
      handle: 'alice',
      kind: 'email',
      valid: true,
      email: 'alice@example.com',
    },
    out: {
      ok: false,
      why: 'not-unique',
      details: {
        query: {
          kind: 'email',
          email: 'alice@example.com',
        },
      },
    },
  },

  {
    print: print_calls,
    pattern: 'check:verify' + LN(),
    params: {
      handle: 'alice',
      kind: 'email',
      email: 'alice@example.com',
    },
    out: {
      ok: true,
      verify: {
        used: false,
      },
    },
  },

  {
    print: print_calls,
    pattern: 'check:verify' + LN(),
    params: {
      handle: 'not-alice',
      kind: 'email',
      email: 'alice@example.com',
    },
    out: {
      ok: false,
      why: 'user-not-found',
    },
  },

  // multiple use
  {
    print: print_calls,
    pattern: 'check:verify' + LN(),
    params: {
      handle: 'alice',
      kind: 'email',
      email: 'alice@example.com',
    },
    out: {
      ok: true,
      verify: {
        used: false,
      },
    },
  },

  // password reset
  {
    print: print_calls,
    name: 'avc0',
    pattern: 'make:verify' + LN(),
    params: {
      handle: 'alice',
      kind: 'pass',
      valid: true,
      unique: false,
      expire_point: new Date().getTime() + 10 * 60 * 1000,
    },
    out: {
      ok: true,
      verify: {
        once: true,
        used: false,
      },
    },
  },

  // password reset
  {
    print: print_calls,
    name: 'avc1',
    pattern: 'make:verify' + LN(),
    params: {
      handle: 'alice',
      kind: 'pass',
      valid: true,
      unique: false,
      expire_duration: 10 * 60 * 1000,
    },
    out: {
      ok: true,
      verify: {
        once: true,
        used: false,
      },
    },
  },

  {
    print: print_calls,
    pattern: 'list:verify' + LN(),
    params: {
      handle: 'not-alice',
    },
    out: {
      ok: false,
      why: 'user-not-found',
    },
  },

  {
    print: print_calls,
    pattern: 'list:verify' + LN(),
    params: {
      handle: 'alice',
    },
    out: {
      ok: true,
      items: [],
    },
  },

  {
    print: print_calls,
    pattern: 'list:verify' + LN(),
    params: {
      handle: 'alice',
      kind: 'pass',
    },
    out: {
      ok: true,
      items: [],
    },
  },

  {
    print: print_calls,
    pattern: 'list:verify' + LN(),
    params: {
      handle: 'alice',
      kind: 'email',
      email: 'alice@example.com',
    },
    out: {
      ok: true,
      items: [],
    },
  },

  // change password with onetime code
  {
    print: print_calls,
    pattern: 'change:password' + LN(),
    params: {
      handle: 'alice',
      // email: 'alice@example.com', // TODO enable once update tests written
      pass: 'alice-pass-change-01',
      verify: '`avc0:out.verify.code`',
    },
    out: { ok: true, user: { handle: 'alice' } },
  },

  // can't change password twice with onetime code
  {
    print: print_calls,
    pattern: 'change:password' + LN(),
    params: {
      handle: 'alice',
      // email: 'alice@example.com', // TODO enable once update tests written
      pass: 'alice-pass-change-02',
      verify: '`avc0:out.verify.code`',
    },
    out: { ok: false, why: 'verify-already-used' },
  },

  // login with alice-pass-change-01
  {
    print: print_calls,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'alice',
      pass: 'alice-pass-change-01',
    },
    out: {
      ok: true,
      user: { handle: 'alice' },
      login: { handle: 'alice' },
    },
  },

  // custom, unique:true by default, so can't reuse code
  {
    print: print_calls,
    pattern: 'make:verify' + LN(),
    params: {
      handle: 'alice',
      kind: 'foo',
      code: 'foo-code-01',
      custom: {
        bar: 1,
      },
    },
    out: {
      ok: true,
      verify: {
        bar: 1,
        kind: 'foo',
        code: 'foo-code-01',
        once: true,
        used: false,
        valid: false,
      },
    },
    //verify: function(call) {
    //  console.log(call.result.out.verify.data$())
    //}
  },

  // custom
  {
    print: print_calls,
    pattern: 'make:verify' + LN(),
    params: {
      handle: 'alice',
      kind: 'foo',
      code: 'foo-code-01',
      custom: {
        bar: 1,
      },
    },
    out: {
      ok: false,
      why: 'not-unique',
      details: { query: { kind: 'foo', code: 'foo-code-01' } },
    },
  },

  {
    print: print_calls,
    pattern: 'get:user' + LN(),
    params: {
      handle: 'alice',
      verification: true,
    },
    out: {
      ok: true,
      user: {
        verified: false,
      },
      verification: {
        items: [],
      },
    },
  },

  // convenience fields
  {
    print: print_calls,
    pattern: 'list:verify' + LN(),
    params: {
      handle: 'alice',
      code: 'foo-code-01',
    },
    out: {
      ok: true,
      items: [],
    },
  },

  // custom queries
  {
    print: print_calls,
    pattern: 'list:verify' + LN(),
    params: {
      handle: 'alice',
      q: {
        bar: 1,
      },
    },
    out: {
      ok: true,
      items: [],
    },
  },

  {
    print: print_calls,
    pattern: 'list:verify' + LN(),
    params: {
      user_q: {
        handle: 'alice',
      },
      q: {
        bar: 1,
      },
    },
    out: {
      ok: true,
      items: [],
    },
  },

  {
    print: print_calls,
    pattern: 'check:verify' + LN(),
    params: {
      handle: 'alice',
      email: 'alice@example.com',
    },
    out: {
      ok: true,
      verify: {
        used: false,
      },
    },
  },

  {
    print: print_calls,
    pattern: 'check:verify' + LN(),
    params: {
      handle: 'alice',
      q: {
        email: 'not-alice@example.com',
      },
    },
    out: {
      ok: false,
      why: 'no-verify',
      details: { q: { email: 'not-alice@example.com' } },
    },
  },

  // bob

  {
    print: print_calls,
    pattern: 'make:verify' + LN(),
    params: {
      handle: 'bob',
      kind: 'foo',
      code: 'bob-foo-code-01',
      expire_duration: 1, // so that's gonna expire real soon...
      once: false,
      valid: true,
    },
    out: {
      ok: true,
      verify: {
        kind: 'foo',
        code: 'bob-foo-code-01',
      },
    },
  },

  // expired now?
  {
    print: print_calls,
    pattern: 'check:verify' + LN(),
    params: {
      handle: 'bob',
      code: 'bob-foo-code-01',
      expiry: true,
    },
    out: {
      ok: false,
      why: 'verify-expired',
    },
  },

  // go back in time
  {
    print: print_calls,
    pattern: 'check:verify' + LN(),
    params: {
      handle: 'bob',
      code: 'bob-foo-code-01',
      expiry: true,
      now: Date.now() - 1111,
    },
    out: {
      ok: true,
    },
  },

  {
    print: print_calls,
    pattern: 'check:verify' + LN(),
    params: {
      user_q: {
        handle: 'bob',
      },
      code: 'bob-foo-code-01',
      expiry: true,
      now: Date.now() - 1111,
    },
    out: {
      ok: true,
    },
  },

  // once and used

  {
    print: print_calls,
    pattern: 'make:verify' + LN(),
    params: {
      handle: 'bob',
      kind: 'foo',
      code: 'bob-foo-code-02',
      valid: true,
    },
    out: {
      ok: true,
      verify: {
        kind: 'foo',
        code: 'bob-foo-code-02',
      },
    },
  },

  {
    print: print_calls,
    pattern: 'check:verify' + LN(),
    params: {
      handle: 'bob',
      code: 'bob-foo-code-02',
    },
    out: {
      ok: true,
    },
  },

  {
    print: print_calls,
    pattern: 'check:verify' + LN(),
    params: {
      handle: 'bob',
      code: 'bob-foo-code-02',
    },
    out: {
      ok: false, // once is true, so second time fails
      why: 'verify-already-used',
      details: {
        q: { code: 'bob-foo-code-02' },
      },
    },
  },

  // not valid

  {
    print: print_calls,
    pattern: 'make:verify' + LN(),
    params: {
      handle: 'bob',
      kind: 'foo',
      code: 'bob-foo-code-03',
    },
    out: {
      ok: true,
      verify: {
        kind: 'foo',
        code: 'bob-foo-code-03',
      },
    },
  },

  {
    print: print_calls,
    pattern: 'check:verify' + LN(),
    params: {
      handle: 'bob',
      code: 'bob-foo-code-03',
      verify: true,
    },
    out: {
      ok: false,
      why: 'verify-not-valid',
    },
  },

  // verify for a registration
  {
    print: print_calls,
    name: 'vh0',
    pattern: 'make:verify' + LN(),
    params: {
      anon: true,
      kind: 'register',
      valid: true,
      custom: {
        mode: 'm01',
        email: 'hamish@example.com',
        info: {
          qaz: 1,
        },
      },
    },
    out: {
      ok: true,
      verify: {
        kind: 'register',
        once: true,
        used: false,
        valid: true,
        mode: 'm01',
        email: 'hamish@example.com',
        info: {
          qaz: 1,
        },
      },
    },
  },

  {
    print: print_calls,
    pattern: 'check:verify' + LN(),
    params: {
      anon: true,
      code: '`vh0:out.verify.code`',
    },
    out: {
      ok: true,
      verify: {
        kind: 'register',
        once: true,
        used: true,
        valid: true,
        mode: 'm01',
        email: 'hamish@example.com',
        info: {
          qaz: 1,
        },
      },
    },
  },
]
