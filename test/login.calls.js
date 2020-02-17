const Joi = require('@hapi/joi')

var print_login = true

var call = {}

// NOTE: assumes register_get.calls

module.exports = [
  // test setting: options.password.minlen = 2
  {
    print: print_login,
    pattern: 'hook:password,cmd:encrypt',
    params: {
      pass: 'ab',
      salt: 'bar'
    },
    out: {
      ok: false,
      why: 'password-too-short',
      details: { password_length: 2, minimum: 3 }
    }
  },

  {
    name: 'fbp0',
    print: print_login,
    pattern: 'hook:password,cmd:encrypt',
    params: {
      pass: 'foo',
      salt: 'bar'
    },
    out: {
      ok: true,
      salt: 'bar'
    }
  },

  {
    print: print_login,
    pattern: 'hook:password,cmd:verify',
    params: {
      proposed: 'foo',
      pass: '`fbp0:out.pass`',
      salt: 'bar'
    },
    out: {
      ok: true
    }
  },

  {
    print: print_login,
    pattern: 'hook:password,cmd:verify',
    params: {
      proposed: 'x',
      pass: '`fbp0:out.pass`',
      salt: 'bar'
    },
    out: {
      ok: false,
      why: 'password-too-short'
    }
  },

  {
    print: print_login,
    pattern: 'hook:password,cmd:verify',
    params: {
      proposed: 'not-foo',
      pass: '`fbp0:out.pass`',
      salt: 'bar'
    },
    out: {
      ok: false,
      why: 'no-match'
    }
  },

  {
    print: print_login,
    pattern: 'hook:password,cmd:verify',
    params: {
      proposed: 'foo',
      pass: '`fbp0:out.pass`',
      salt: 'not-bar'
    },
    out: {
      ok: false,
      why: 'no-match'
    }
  },

  {
    print: print_login,
    pattern: 'login:user',
    params: {
      handle: 'not-a-user'
    },
    out: {
      ok: false,
      user: null,
      why: 'user-not-found'
    }
  },

  {
    name: 'al0',
    print: print_login,
    pattern: 'login:user',
    params: {
      handle: 'alice',
      auto: true
    },
    out: {
      ok: true,
      user: { handle: 'alice' },
      login: { handle: 'alice' }
    }
  },

  {
    name: 'bl0',
    print: print_login,
    pattern: 'login:user',
    params: {
      handle: 'bob',
      auto: true,
      login_data: {
        handle: 'wrong', // will get overridden
        foo: 1
      }
    },
    out: {
      ok: true,
      user: { handle: 'bob' },
      login: { handle: 'bob', foo: 1 }
    }
  },

  {
    print: print_login,
    pattern: 'register:user',
    params: {
      handle: 'edward',
      email: 'edward@example.com',
      password: 'edward123',
      repeat: 'not-a-repeat'
    },
    out: {
      ok: false,
      why: 'repeat-password-mismatch'
    }
  },

  {
    print: print_login,
    pattern: 'register:user',
    params: {
      handle: 'edward',
      email: 'edward@example.com',
      password: 'edward123',
      repeat: 'edward123'
    },
    out: {
      ok: true,
      user: { handle: 'edward', email: 'edward@example.com' }
    }
  },

  {
    name: 'el0',
    print: print_login,
    pattern: 'login:user',
    params: {
      handle: 'edward'
    },
    out: {
      ok: false,
      why: 'no-login-method'
    }
  },

  {
    name: 'el0',
    print: print_login,
    pattern: 'login:user',
    params: {
      handle: 'edward',
      password: 'edward123',
      login_data: {
        foo: 1 // add extra login fields
      }
    },
    out: {
      ok: true,
      user: { handle: 'edward', email: 'edward@example.com' },
      login: { handle: 'edward', email: 'edward@example.com', foo: 1 }
    }
  },

  {
    print: print_login,
    pattern: 'register:user',
    params: {
      handle: 'frank',
      email: 'frank@example.com',
      pass: 'frank123', // repeat is optional
      user_data: {
        foo: 1
      }
    },
    out: {
      ok: true,
      user: { foo: 1, handle: 'frank', email: 'frank@example.com' }
    }
  },

  {
    name: 'fl0',
    print: print_login,
    pattern: 'login:user',
    params: {
      handle: 'frank',
      password: 'frank123',
      q: {
        fields$: ['foo'] // load extra fields from user
      }
    },
    out: {
      ok: true,
      user: { handle: 'frank', email: 'frank@example.com', foo: 1 },
      login: { handle: 'frank', email: 'frank@example.com' }
    }
  },

  // multiple active logins
  {
    print: print_login,
    pattern: 'login:user',
    params: {
      handle: 'frank',
      pass: 'frank123',
      q: {
        fields$: ['foo'] // load extra fields from user
      },
      login_data: {
        bar: 1
      }
    },
    out: {
      ok: true,
      user: { handle: 'frank', email: 'frank@example.com', foo: 1 },
      login: { handle: 'frank', email: 'frank@example.com' }
    }
  },

  {
    print: print_login,
    pattern: 'login:user',
    params: {
      handle: 'frank',
      password: 'not-franks-password'
    },
    out: {
      ok: false,
      why: 'invalid-password'
    }
  },

  {
    print: print_login,
    pattern: 'list:login',
    params: {
      handle: 'frank',
      active: true
    },
    out: {
      ok: true,
      items: Joi.array().length(2) // 2 active logins
    }
  },

  {
    print: print_login,
    pattern: 'list:login',
    params: {
      handle: 'frank',
      login_q: {
        // specify a subset of logins
        bar: 1
      }
    },
    out: {
      ok: true,
      items: Joi.array().length(1) // 1 matching active login
    }
  },

  {
    print: print_login,
    pattern: 'list:login',
    params: {
      handle: 'not-frank'
    },
    out: {
      ok: false,
      why: 'user-not-found'
    }
  },

  {
    print: print_login,
    pattern: 'list:login',
    params: {
      handle: 'frank',
      active: false
    },
    out: {
      ok: true,
      items: Joi.array().length(0) // 0 non-active logins
    }
  }
]
