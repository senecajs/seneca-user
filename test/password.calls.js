const Joi = require('@hapi/joi')


module.exports = [

  {
    pattern: 'hook:password,cmd:encrypt',
    params: {
      pass: 'foo',
      test: true,
      rounds: 2,
    },
    out: { ok:true, salt:Joi.string().length(32), pass:Joi.string().min(32) }
  },

  {
    pattern: 'hook:password,cmd:encrypt',
    params: {
      password: 'foo',
      salt: 'bar',
      test: true,
      rounds: 2,
    },
    out: { ok:true, salt:'bar', pass:Joi.string().min(32) }
  },


  
  {
    pattern: 'hook:password,cmd:encrypt',
    params: {
      test: true,
    },
    err: { code: 'no_pass' }
  },

  {
    pattern: 'hook:password,cmd:encrypt',
    params: {
      test: true,
      pass: {}
    },
    err: { code: 'act_invalid_msg' }
  },

  {
    pattern: 'hook:password,cmd:encrypt',
    params: {
      test: true,
      pass: ''
    },
    err: { code: 'act_invalid_msg' }
  },
  
  {
    pattern: 'hook:password,cmd:encrypt',
    params: {
      fail: true,
      pass: 'zed',
    },
    err: {}
  },
]
