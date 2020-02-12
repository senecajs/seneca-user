
const Code = require('@hapi/code')
const Lab = require('@hapi/lab')
const Joi = require('@hapi/joi')

const SenecaMsgTest = require('seneca-msg-test')
const Seneca = require('seneca')

var expect = Code.expect
var lab = (exports.lab = Lab.script())


lab.test('messages', async ()=>{
  var seneca = Seneca({legacy:false})
      .test()
      .use('promisify')
      .use('entity')
      .use('..')

  var run = SenecaMsgTest(seneca,{
    print: true,
    allow: {
      missing: true
    },
    pattern:'sys:user',
    calls:[
      {
        // can register with just an email
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

      // use convenience params
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
          handle:'alice'
        },
        out: { ok:true, user:{ handle:'alice' } }
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

      // use a proper query
      {
        pattern: 'get:user',
        params: { q: {handle:'alice'} },
        out: { ok:true, user:{ handle:'alice' } }
      },



      {
        // convenience and user
        pattern: 'register:user',
        params: {
          handle:'bob',
          user: {
            email: 'bob@example.com'
          }
        },
        out: { ok:true, user:{ handle:'bob', email: 'bob@example.com' } }
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
        // always generate a handle
        pattern: 'register:user',
        params: {
          handle: ''
        },
        out: { ok:true, user:{ handle:Joi.string().length(12) } }
      },

    ]
  })

  await run()
})

