const Joi = require('@hapi/joi')

var print_change = false

var call = {}

const Shared = require('./shared')

const LN = Shared.LN


module.exports = [

  // generate a password
  {
    print: print_change,
    pattern: 'change:pass'+LN(),
    params: {
      user: {
        email:'cathy@example.com',
      },
      generate: true,
    },
    out:{ ok:true, pass:Joi.string().min(12), user:{handle:'cathy'}}
  },

  // not a user
  {
    print: print_change,
    pattern: 'change:pass'+LN(),
    params: {
      user: {
        email:'not-cathy@example.com',
      },
      generate: true,
    },
    out:{ ok:false, why:'user-not-found'}
  },


  // by repeat password
  {
    print: print_change,
    pattern: 'change:pass'+LN(),
    params: {
      q: {
        email:'cathy@example.com',
      },
      password: 'cathy-pass-01',
      repeat: 'cathy-pass-01'
    },
    out:{ ok:true, user:{handle:'cathy'} }
  },


  // bad repeat password
  {
    print: print_change,
    pattern: 'change:pass'+LN(),
    params: {
      q: {
        email:'not-cathy@example.com',
      },
      password: 'cathy-pass-01',
      repeat: 'not-cathy-pass-01'
    },
    out:{ ok:false, why:'repeat-password-mismatch' }
  },

  
]
