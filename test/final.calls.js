const Joi = require('@hapi/joi')

const Shared = require('./shared')

const print_calls = false

const LN = Shared.LN

module.exports = [
  {
    print: print_calls,
    pattern: 'list:user' + LN(),
    out: {
      ok: true,
      items: [
        {email:'foo@example.com',active:true},
        {name:'alice',handle:'alice',active:true},
        {name:'bob',email:'bob@example.com',handle:'bob',active:true},
        {name:'cathy',handle:'catherine',
         email:'catherinethegreat@example.com',active:true},
        {name:'derek',handle:'derek',active:false},
        {active:true},
        {active:true},
        {active:true},
        {name:'Adam Ant',active:true},
        {name:'edward',handle:'edward',email:'edward@example.com',active:true},
        {name:'frank',handle:'frank',email:'frank@example.com',active:true}
      ]
    }
  },

  {
    print: print_calls,
    pattern: 'list:user' + LN(),
    params: {
      q: {
        foo: 1
      }
    },
    out: {
      ok: true,
      items: [
        {name:'bob',email:'bob@example.com',foo:1,handle:'bob',active:true},
        {name:'frank',foo:1,handle:'frank',email:'frank@example.com',active:true}
      ]
    }
  },

  {
    print: print_calls,
    pattern: 'list:user' + LN(),
    params: {
      active: false
    },
    out: {
      ok: true,
      items: [
        {name:'derek',handle:'derek',active:false},
      ]
    }
  },

]
