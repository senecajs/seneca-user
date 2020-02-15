
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
      .use('doc')
      .use('joi')
      .use('entity')
      .use('..')

  var run = SenecaMsgTest(seneca,{
    print: false,
    allow: {
      missing: true
    },
    pattern:'sys:user',
    calls: []
      .concat(require('./register_get.calls.js'))
      .concat(require('./password.calls.js'))
      .concat(require('./adjust.calls.js'))
  })

  try {
    await run()
  }
  finally {
    await seneca.close()
  }
})

