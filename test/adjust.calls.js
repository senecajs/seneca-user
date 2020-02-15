var print_adjust = true

var call = {}

module.exports = [

  // user not found
  {
    print: print_adjust,
    pattern: 'adjust:user',
    params: {},
    out: {ok:false, why:'no-query'}
  },


  // user not found
  {
    print: print_adjust,
    pattern: 'adjust:user',
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
    pattern: 'get:user',
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
  
  // TODO: confirm can login


  // do nothing
  {
    print: print_adjust,
    pattern: 'adjust:user',
    params: {
      q: {
        handle: 'alice',
      }
    },
    out: {
      user: { handle: 'alice', active: true }
    }
  },

  call.get_alice_active,
  
  
  // deactivate
  {
    print: print_adjust,
    pattern: 'adjust:user',
    params: {
      q: {
        handle: 'alice',
      },
      active: false,
      fields: ['custom_field0'] // test retrieval of custom fields
    },
    out: {
      user: { handle: 'alice', custom_field0: 'value0', active: false }
    }
  },

  // TODO: confirm cannot login


  // idempotent
  {
    print: print_adjust,
    pattern: 'adjust:user',
    params: {
      q: {
        handle: 'alice',
      },
      active: false,
      fields: ['custom_field0']
    },
    out: {
      user: { handle: 'alice', custom_field0: 'value0', active: false }
    }
  },
  

  {
    print: print_adjust,
    pattern: 'get:user',
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
  
  {
    print: print_adjust,
    pattern: 'adjust:user',
    params: {
      q: {
        handle: 'alice',
      },
      active: true,
      fields: ['custom_field0']
    },
    out: {
      user: { handle: 'alice', custom_field0: 'value0', active: true }
    }
  },

  call.get_alice_active
]
