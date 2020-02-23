const Joi = require('@hapi/joi')

var print_adjust = false

var call = {}

const Shared = require('./shared')

const LN = Shared.LN

module.exports = [
  // user not found
  {
    print: print_adjust,
    pattern: 'adjust:user' + LN(),
    params: {},
    out: { ok: false, why: 'no-user-query' }
  },

  // user not found
  {
    print: print_adjust,
    pattern: 'adjust:user' + LN(),
    params: {
      handle: 'not-a-user'
    },
    out: {
      ok: false,
      user: null
    }
  },

  (call.get_alice_active = {
    print: print_adjust,
    pattern: 'get:user' + LN(),
    params: {
      q: {
        handle: 'alice',
        fields$: ['custom_field0'] // test retrieval of custom fields
      }
    },
    out: {
      user: { handle: 'alice', custom_field0: 'value0', active: true }
    }
  }),
  {
    print: print_adjust,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'alice',
      auto: true
    },
    out: {
      ok: true,
      user: { handle: 'alice', active: true }
    }
  },

  // do nothing
  {
    print: print_adjust,
    pattern: 'adjust:user' + LN(),
    params: {
      q: {
        handle: 'alice'
      }
    },
    out: {
      user: { handle: 'alice', active: true }
    }
  },

  call.get_alice_active,

  {
    print: print_adjust,
    pattern: 'list:login' + LN(),
    params: {
      handle: 'alice'
    },
    out: {
      ok: true,
      items: Joi.array().length(1)
    }
  },

  // deactivate
  {
    print: print_adjust,
    pattern: 'adjust:user' + LN(),
    params: {
      q: {
        handle: 'alice'
      },
      active: false,
      fields: ['custom_field0'] // test retrieval of custom fields
    },
    out: {
      user: { handle: 'alice', custom_field0: 'value0', active: false }
    }
  },

  // confirm cannot login
  {
    print: print_adjust,
    pattern: 'login:user' + LN(),
    params: {
      handle: 'alice',
      auto: true
    },
    out: {
      ok: false,
      why: 'user-not-active'
    }
  },

  // confirm no active logins
  {
    print: print_adjust,
    pattern: 'list:login' + LN(),
    params: {
      handle: 'alice'
    },
    out: {
      ok: true,
      items: Joi.array().length(0)
    }
  },

  // idempotent
  {
    print: print_adjust,
    pattern: 'adjust:user' + LN(),
    params: {
      q: {
        handle: 'alice'
      },
      active: false,
      fields: ['custom_field0']
    },
    out: {
      user: { handle: 'alice', custom_field0: 'value0', active: false }
    }
  },

  // confirm not active
  {
    print: print_adjust,
    pattern: 'get:user' + LN(),
    params: {
      q: {
        handle: 'alice',
        fields$: ['custom_field0']
      }
    },
    out: {
      user: { handle: 'alice', custom_field0: 'value0', active: false }
    }
  },

  // adjust back to active
  {
    print: print_adjust,
    pattern: 'adjust:user' + LN(),
    params: {
      q: {
        handle: 'alice'
      },
      active: true,
      fields: ['custom_field0']
    },
    out: {
      user: { handle: 'alice', custom_field0: 'value0', active: true }
    }
  },

  call.get_alice_active

  /*
  // no verifications by default
  // get:user just has boolean verified flag
  {
    print: print_adjust,
    pattern: 'get:user'+LN(),
    params: {
      handle: 'alice',
      verify: true
    },
    out: {
      user: {
        handle: 'alice',
        verified: false, // verified field automatically added if verify:true
      },
      verify:Joi.array().required()
    }
  },



  // create verification, but not yet valid
  {
    print: print_adjust,
    pattern: 'adjust:user'+LN(),
    params: {
      q: {
        handle: 'alice'
      },
      verify: {
        kind: 'code',
        code:'foo', // for multiple verifies, generate random codes so unique
      },
    },
    out: {
      // verified still false
      user: { handle: 'alice', verified: false },
      verify: [
        {
          // TODO: support inks
          user_id: Joi.string(),
          valid: false, // set by default
          since: Joi.string(), // ISO date created
          when: Joi.string(), // ISO date created,
          kind: 'code',
          code: 'foo'
        }
      ]
    }
  },

  // direct lookup of verified field
  {
    print: print_adjust,
    pattern: 'get:user'+LN(),
    params: {
      handle: 'alice',
      fields: ['verified']
    },
    out: {
      user: {
        handle: 'alice',
        verified: false,
      }
    }
  },


  // confirm verification
  {
    print: print_adjust,
    pattern: 'adjust:user'+LN(),
    params: {
      q: {
        handle: 'alice'
      },
      verify: {
        kind: 'code',
        q: { code:'foo' }, // TODO: support kind name at top level as convenience
        valid: true
      },
    },
    out: {
      // verified true if at least one verification true
      user: { handle: 'alice', verified: true },
      verify: [
        {
          kind: 'code',
          code:'foo',
          valid: true
        }
      ]
    }
  },


  // idempotent (apart from `when`)
  {
    print: print_adjust,
    pattern: 'adjust:user'+LN(),
    params: {
      q: {
        handle: 'alice'
      },
      verify: {
        kind: 'code',
        code: 'foo',
        valid: true
      },
    },
    out: {
      // verified true if at least one verification true
      user: { handle: 'alice', verified: true },
      verify: [
        {
          kind: 'code',
          code: 'foo',
          valid: true
        }
      ]
    }
  },



  // verify flag
  {
    print: print_adjust,
    pattern: 'get:user'+LN(),
    params: {
      handle: 'alice',
      verify:true
    },
    out: {
      user: {
        handle: 'alice',
        verified: true,
      },
      verify: [
        {
          kind: 'code',
          code:'foo',
          valid: true
        }
      ]
    }
  },


  {
    print: print_adjust,
    pattern: 'adjust:user'+LN(),
    params: {
      q: {
        handle: 'alice'
      },
      verify: {
        kind: 'email',
        email: 'alice-other-address@example.com',
        valid: true
      },
    },
    out: {
      user: { handle: 'alice', verified: true },
      verify: [
        {
          kind: 'code',
          code:'foo',
          valid: true
        },
        { kind: 'email', email: 'alice-other-address@example.com', valid: true }
      ]
    }
  },

  {
    print: print_adjust,
    pattern: 'get:user'+LN(),
    params: {
      handle: 'alice',
      verify:true
    },
    out: {
      user: {
        handle: 'alice',
        verified: true,
      },
      verify: [
        {
          kind: 'code',
          code:'foo',
          valid: true
        },
        { kind: 'email', email: 'alice-other-address@example.com', valid: true }
      ]
    }
  },


  // confirm other user isolated
  {
    print: print_adjust,
    pattern: 'get:user'+LN(),
    params: {
      handle: 'bob',
      verify: true
    },
    out: {
      user: {
        handle: 'bob',
        verified: false,
      },
      verify:Joi.array().required()
    }
  },



  // create verification
  {
    print: print_adjust,
    pattern: 'adjust:user'+LN(),
    params: {
      q: {
        handle: 'bob'
      },
      verify: {
        code:'bar', // for multiple verifies, generate random codes so unique
        valid: true,
      },
    },
    out: {
      // verified still false
      user: { handle: 'bob', verified: true },
      verify: [
        {
          // TODO: support inks
          user_id: Joi.string(),
          valid: true, // set by default
          since: Joi.string(), // ISO date created
          when: Joi.string(), // ISO date created
          kind: 'direct',
          code: 'bar',
        }
      ]
    }
  },


  // update verification
  {
    print: print_adjust,
    name: 'adjust-bob-1',
    pattern: 'adjust:user'+LN(),
    params: {
      q: {
        handle: 'bob'
      },
      verify: {
        // NOTE: query convenience prop ensures new verify entry
        code:'bar', // for multiple verifies, generate random codes so unique
        valid: false,
      },
    },
    out: {
      // verified still false
      user: { handle: 'bob', verified: false },
      verify: [
        {
          // TODO: support inks
          user_id: Joi.string(),
          valid: false, // set by default
          since: Joi.string(), // ISO date created
          when: Joi.string(), // ISO date created
          kind: 'direct',
          code: 'bar',
        }
      ]
    }
  },


  // create another direct verification
  {
    print: print_adjust,
    pattern: 'adjust:user'+LN(),
    params: {
      q: {
        handle: 'bob'
      },
      verify: {
        code:'zed', // for multiple verifies, generate random codes so unique
        q: {
          // MARK001
          code: 'zed' // NOTE: need this to ensure new verify entry 
        },
        valid: true,
      },
    },
    out: {
      // verified back to true as at least one validx
      user: { handle: 'bob', verified: true },
      verify: [
        {
          user_id: Joi.string(),
          valid: false, // set by default
          since: Joi.string(), // ISO date created
          when: Joi.string(), // ISO date created
          kind: 'direct',
          code: 'bar',
        },
        {
          user_id: Joi.string(),
          valid: true, // set by default
          since: Joi.string(), // ISO date created
          when: Joi.string(), // ISO date created
          kind: 'direct',
          code: 'zed',
        }
      ]
    }
  },


  // bad kind
  {
    print: print_adjust,
    pattern: 'adjust:user'+LN(),
    params: {
      q: {
        handle: 'bob'
      },
      verify: {
        kind: 'since' // reserved name
      },
    },
    err: {
      code: 'bad_verify_kind'
    }
  },

  // multiple not allowed
  {
    print: print_adjust,
    pattern: 'adjust:user'+LN(),
    params: {
      q: {
        handle: 'bob'
      },
      verify: {
        kind: 'direct', // not unique
        valid: true
      },
    },
    out: {
      ok:false,
      why: 'verify-not-unique',
      details: {
        verify: { kind: 'direct', valid: true },
        query: { kind: 'direct', user_id: Joi.string() }
      }
    }
  }

*/
]
