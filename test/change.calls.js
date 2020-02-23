const Joi = require('@hapi/joi')

var print_change = true

var call = {}

const Shared = require('./shared')

const LN = Shared.LN

module.exports = [
  // generate a password
  {
    print: print_change,
    pattern: 'change:pass' + LN(),
    params: {
      user: {
        email: 'cathy@example.com'
      },
      generate: true
    },
    out: { ok: true, pass: Joi.string().min(12), user: { handle: 'cathy' } }
  },

  // not a user
  {
    print: print_change,
    pattern: 'change:pass' + LN(),
    params: {
      user: {
        email: 'not-cathy@example.com'
      },
      generate: true
    },
    out: { ok: false, why: 'user-not-found' }
  },

  // by repeat password
  {
    print: print_change,
    pattern: 'change:pass' + LN(),
    params: {
      q: {
        email: 'cathy@example.com'
      },
      password: 'cathy-pass-01',
      repeat: 'cathy-pass-01'
    },
    out: { ok: true, user: { handle: 'cathy' } }
  },

  // verify login works
  {
    print: print_change,
    pattern: 'login:user' + LN(),
    params: {
      q: {
        email: 'cathy@example.com'
      },
      pass: 'cathy-pass-01'
    },
    out: {
      ok: true,
      user: { handle: 'cathy' },
      login: { handle: 'cathy' }
    }
  },

  // bad repeat password
  {
    print: print_change,
    pattern: 'change:pass' + LN(),
    params: {
      q: {
        email: 'not-cathy@example.com'
      },
      password: 'cathy-pass-01',
      repeat: 'not-cathy-pass-01'
    },
    out: { ok: false, why: 'repeat-password-mismatch' }
  },

  // verify login still works using correct pass
  {
    print: print_change,
    pattern: 'login:user' + LN(),
    params: {
      q: {
        email: 'cathy@example.com'
      },
      pass: 'cathy-pass-01'
    },
    out: {
      ok: true,
      user: { handle: 'cathy' },
      login: { handle: 'cathy' }
    }
  },

  // simple
  {
    print: print_change,
    pattern: 'change:pass' + LN(),
    params: {
      email: 'cathy@example.com',
      password: 'cathy-pass-02'
    },
    out: { ok: true, user: { handle: 'cathy' } }
  },

  // verify login works with new pass
  {
    print: print_change,
    pattern: 'login:user' + LN(),
    params: {
      q: {
        email: 'cathy@example.com'
      },
      pass: 'cathy-pass-02'
    },
    out: {
      ok: true,
      user: { handle: 'cathy' },
      login: { handle: 'cathy' }
    }
  },

  {
    print: print_change,
    pattern: 'change:handle' + LN(),
    params: {
      handle: 'cathy',
      new_handle: 'catherine'
    },
    out: { ok: true, user: { handle: 'catherine', email: 'cathy@example.com' } }
  },

  // change to same has no effect
  {
    print: print_change,
    pattern: 'change:handle' + LN(),
    params: {
      email: 'cathy@example.com',
      new_handle: 'catherine'
    },
    out: { ok: true, user: { handle: 'catherine', email: 'cathy@example.com' } }
  },

  // can't use existing handle
  {
    print: print_change,
    pattern: 'change:handle' + LN(),
    params: {
      handle: 'catherine',
      new_handle: 'alice'
    },
    out: {
      ok: false,
      why: 'handle-exists',
      details: {
        handle: 'alice',
        user_handle: 'catherine'
      }
    }
  },

  //
  {
    print: print_change,
    pattern: 'change:handle' + LN(),
    params: {
      handle: 'not-catherine',
      new_handle: 'alice'
    },
    out: {
      ok: false,
      why: 'user-not-found'
    }
  }
]
