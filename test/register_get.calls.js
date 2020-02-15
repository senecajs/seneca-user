const Joi = require('@hapi/joi')

module.exports = [
  {
    // can register with just an email
    name: 'uf0',
    pattern: 'register:user',
    params: {
      email: 'foo@example.com'
    },
    out: { ok:true, user:{
      email:'foo@example.com',
      handle: Joi.string().length(7)
    } }
  },

  // get:user without query returns nothing
  {
    pattern: 'get:user',
    params: {},
    out: { ok:false }
  },

  // 
  {
    pattern: 'get:user',
    params: { handle: '' },
    err: { code: 'act_invalid_msg' }
  },

  
  // use convenience params
  {
    pattern: 'get:user',
    params: { id:'`uf0:out.user.id`' },
    out: { ok:true, user:{ email:'foo@example.com' } }
  },

  {
    pattern: 'get:user',
    params: { email:'foo@example.com' },
    out: { ok:true, user:{ email:'foo@example.com' } }
  },

  // use a proper query
  {
    pattern: 'get:user',
    params: { q: { email:'foo@example.com' } },
    out: { ok:true, user:{ email:'foo@example.com' } }
  },


  {
    // can register with just handle
    pattern: 'register:user',
    params: {
      handle:'alice',
      user: {
        custom_field0: 'value0'
      }
    },
    out: { ok:true, user:{ handle:'alice', custom_field0: 'value0' } }
  },

  {
    // handle must be unique
    pattern: 'register:user',
    params: {
      handle:'alice'
    },
    out: { ok:false, why:'handle-exists', handle:'alice' }
  },

  // use convenience params
  {
    pattern: 'get:user',
    params: { handle:'alice' },
    out: { ok:true, user:{ handle:'alice' } }
  },

  // legacy
  {
    pattern: 'get:user',
    params: { q: {nick:'alice'} },
    out: { ok:true, user:{ handle:'alice' } }
  },

  // use a proper query
  {
    pattern: 'get:user',
    params: { q: {handle:'alice'} },
    out: { ok:true, user:{ handle:'alice' } }
  },


  
  {
    // convenience and user, custom fields
    pattern: 'register:user',
    params: {
      handle:'bob',
      user: {
        email: 'bob@example.com',
        foo: 1
      }
    },
    out: { ok:true, user:{ handle:'bob', email: 'bob@example.com', foo:1 } }
  },

  // custom fields query
  {
    print: false,
    pattern: 'get:user',
    params: { handle:'bob', fields:['foo'] },
    out: { ok:true, user:{ handle:'bob', email: 'bob@example.com', foo:1 } }
  },

  {
    print: false,
    pattern: 'get:user',
    params: { q: {handle:'bob', fields$:['foo'] } },
    out: { ok:true, user:{ handle:'bob', email: 'bob@example.com', foo:1 } }
  },

  {
    print: false,
    pattern: 'get:user',
    params: { q: {handle:'not-bob', fields$:['foo'] } },
    out: { ok:false, user:null }
  },

  {
    print: false,
    pattern: 'get:user',
    params: { q: {fields$:['foo'] } },
    out: { ok:false, user:null }
  },


  {
    // legacy nick->handle
    pattern: 'register:user',
    params: {
      nick:'cathy',
      user: {
        nick:'cathy-overridden',
      }
    },
    out: { ok:true, user:{ handle:'cathy' } }
  },

  {
    // legacy nick->handle
    pattern: 'register:user',
    params: {
      nick:'derek-nope',
      handle:'derek',
      user: {
        nick:'derek-nope-nope',
        handle:'derek-overridden',
      }
    },
    out: { ok:true, user:{ handle:'derek' } }
  },

  // convenience params nick->handle
  {
    pattern: 'get:user',
    params: { nick:'alice', q: { handle:'alice-nope', nick:'alice-overridden' } },
    out: { ok:true, user:{ handle:'alice' } }
  },


  {
    // always generate a handle
    pattern: 'register:user',
    params: {
    },
    out: { ok:true, user:{ handle:Joi.string().length(12) } }
  },

  {
    // always generate a handle
    pattern: 'register:user',
    params: {
      user: {
      }
    },
    out: { ok:true, user:{ handle:Joi.string().length(12) } }
  },


  {
    // always generate a handle
    pattern: 'register:user',
    params: {
      user: {
        email: 'example.com'
      }
    },
    out: { ok:true, user:{ handle:Joi.string().length(12) } }
  },

  {
    // always generate a handle
    pattern: 'register:user',
    params: {
      user: {
        email: '@example.com'
      }
    },
    out: { ok:true, user:{ handle:Joi.string().length(12) } }
  },

  {
    pattern: 'register:user',
    params: {
      handle: ''
    },
    err: { code: 'act_invalid_msg' }
  },


]
