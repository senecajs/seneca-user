const Joi = require('@hapi/joi')

const Shared = require('./shared')

const LN = Shared.LN

var print_logout = true

module.exports = [
  {
    print: print_logout,
    pattern: 'list:login'+LN(),
    params: {
      handle: 'alice'
    },
    out: {
      ok: true,
      items: Joi.array().length(1)
    }
  },

  {
    print: print_logout,
    pattern: 'list:login'+LN(),
    params: {
      handle: 'alice',
      active:false
    },
    out: {
      ok: true,
      items: Joi.array().length(1)
    }
  },

  {
    print: print_logout,
    pattern: 'logout:user'+LN(),
    params: {
      handle: 'alice',
    },
    out: {
      ok: true,
      count: 1,
      batch: Joi.string().min(1),
    }
  },

  {
    print: print_logout,
    pattern: 'list:login'+LN(),
    params: {
      handle: 'alice',
      active:false
    },
    out: {
      ok: true,
      items: Joi.array().length(2)
    }
  },


  // another foo:1 login
  {
    print: print_logout,
    pattern: 'login:user',
    params: {
      handle: 'bob',
      auto: true,
      login_data: {
        foo: 1
      }
    },
    out: {
      ok: true,
      user: { handle: 'bob' },
      login: { handle: 'bob', foo: 1 }
    }
  },


  // a foo:2 login
  {
    print: print_logout,
    pattern: 'login:user',
    params: {
      handle: 'bob',
      auto: true,
      login_data: {
        foo: 2
      }
    },
    out: {
      ok: true,
      user: { handle: 'bob' },
      login: { handle: 'bob', foo: 2 }
    }
  },

  {
    print: print_logout,
    pattern: 'list:login'+LN(),
    params: {
      handle: 'bob'
    },
    out: {
      ok: true,
      items: Joi.array().length(3)
    }
  },

  {
    print: print_logout,
    pattern: 'logout:user'+LN(),
    params: {
      handle: 'bob',
      q: {
        foo:1
      },
      load_logins: true
    },
    out: {
      ok: true,
      count: 2,
      batch: Joi.string().min(1),
      items:[
        {handle:'bob',foo:1},
        {handle:'bob',foo:1}
      ]
    }
  },

  {
    print: print_logout,
    pattern: 'list:login'+LN(),
    params: {
      handle: 'bob'
    },
    out: {
      ok: true,
      items: Joi.array().ordered(Joi.object({foo:2}).unknown()).length(1)
    }
  },

  {
    print: print_logout,
    pattern: 'logout:user'+LN(),
    params: {
      handle: 'not-bob',
    },
    out: {
      ok: false,
      why: 'user-not-found'
    }
  },

  {
    print: print_logout,
    pattern: 'login:user',
    params: {
      handle: 'bob',
      auto: true,
      login_data: {
        foo: 3
      }
    },
    out: {
      ok: true,
      user: { handle: 'bob' },
      login: { handle: 'bob', foo: 3 }
    }
  },

  // logs out all active
  {
    print: print_logout,
    pattern: 'logout:user'+LN(),
    params: {
      handle: 'bob',
      load_logins: true
    },
    out: {
      ok: true,
      count: 2,
      batch: Joi.string().min(1),
      items:[
        {handle:'bob',foo:2},
        {handle:'bob',foo:3}
      ]
    }
  },


  {
    print: print_logout,
    name: 'bob-login-foo4',
    pattern: 'login:user',
    params: {
      handle: 'bob',
      auto: true,
      login_data: {
        foo: 4
      }
    },
    out: {
      ok: true,
      user: { handle: 'bob' },
      login: { handle: 'bob', foo: 4 }
    }
  },

  {
    print: print_logout,
    name: 'bob-login-foo5',
    pattern: 'login:user',
    params: {
      handle: 'bob',
      auto: true,
      login_data: {
        foo: 5
      }
    },
    out: {
      ok: true,
      user: { handle: 'bob' },
      login: { handle: 'bob', foo: 5 }
    }
  },

  {
    print: print_logout,
    pattern: 'logout:user'+LN(),
    params: {
      handle: 'bob',
      token: '`bob-login-foo4:out.login.token`',
      load_logins: true
    },
    out: {
      ok: true,
      count: 1,
      batch: Joi.string().min(1),
      items:[
        {handle:'bob',foo:4},
      ]
    }
  },

  {
    print: print_logout,
    pattern: 'logout:user'+LN(),
    params: {
      handle: 'bob',
      login_id: '`bob-login-foo5:out.login.id`',
      load_logins: true
    },
    out: {
      ok: true,
      count: 1,
      batch: Joi.string().min(1),
      items:[
        {handle:'bob',foo:5},
      ]
    }
  },

]
