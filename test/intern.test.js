
const Code = require('@hapi/code')
const Lab = require('@hapi/lab')

const SenecaMsgTest = require('seneca-msg-test')
const Seneca = require('seneca')

var expect = Code.expect
var lab = (exports.lab = Lab.script())

var User = require('..')
var intern = User.intern

lab.test('make_handle', async ()=>{
  var h0 = intern.make_handle()
  expect(typeof(h0)).equal('string')
  expect(h0.length).equal(12)
  expect(h0.match(/^[a-z]+$/)).exists()
})

lab.test('ensure_handle', async ()=>{
  var opts0 = {make_handle:intern.make_handle}

  var msg0 = {handle:'foo'} 
  expect(intern.ensure_handle(msg0,opts0)).equal('foo')
  expect(msg0.handle).equal('foo')
  expect(msg0.user).not.exists()

  var msg1 = {user:{handle:'foo'}} 
  expect(intern.ensure_handle(msg1,opts0)).equal('foo')
  expect(msg1.handle).equal('foo')
  expect(msg1.user.handle).equal('foo')

  var msg2 = {email:'foo@example.com'} 
  expect(intern.ensure_handle(msg2,opts0)).startsWith('foo')
  expect(msg2.handle).startsWith('foo')
  expect(msg2.handle.length).equal(7)

  var msg3 = {user:{email:'foo@example.com'}} 
  expect(intern.ensure_handle(msg3,opts0)).startsWith('foo')
  expect(msg3.handle).startsWith('foo')
  expect(msg3.handle.length).equal(7)

  // convenience fields have precedence, and override
  var msg4 = {handle:'bar',user:{handle:'foo'}} 
  expect(intern.ensure_handle(msg4,opts0)).equal('bar')
  expect(msg4.handle).equal('bar')
  expect(msg4.user.handle).equal('bar')  
})


lab.test('fix_nick_handle', async ()=>{
  expect(intern.fix_nick_handle(null)).equal(null)
  expect(intern.fix_nick_handle({})).equal({})

  expect(intern.fix_nick_handle({handle:'foo'})).equal({handle:'foo'})
  expect(intern.fix_nick_handle({user:{handle:'foo'}})).equal({user:{handle:'foo'}})
  expect(intern.fix_nick_handle({q:{handle:'foo'}})).equal({q:{handle:'foo'}})

  expect(intern.fix_nick_handle({nick:'foo'})).equal({handle:'foo'})
  expect(intern.fix_nick_handle({user:{nick:'foo'}})).equal({user:{handle:'foo'}})
  expect(intern.fix_nick_handle({q:{nick:'foo'}})).equal({q:{handle:'foo'}})

  expect(intern.fix_nick_handle({user:{}})).equal({user:{}})
  expect(intern.fix_nick_handle({q:{}})).equal({q:{}})
})


lab.test('find_user', async ()=>{
  var si = make_seneca()
  var alice = await si.post('sys:user,register:user', {
    user: {
      handle: 'alice',
      foo: 1
    }
  })
  var bob = await si.post('sys:user,register:user', {
    user: {
      handle: 'bob',
      foo: 1
    }
  })

  var ctx = intern.make_ctx()

  var msg0 = { handle:'alice'}
  var found = await intern.find_user(si,msg0,ctx)
  expect(found.ok).true()
  expect(found.user.handle).equal('alice')
  expect(found.user.data$()).equal({
    'entity$': {
      base: 'sys',
      name: 'user',
      zone: undefined
    },
    handle: 'alice',
    id: alice.user.id
  })
  expect(found.why).undefined()
  
  var msg1 = { handle:'bob'}
  found = await intern.find_user(si,msg1,ctx)
  expect(found.ok).true()
  expect(found.user.handle).equal('bob')
  expect(found.user.data$()).equal({
    'entity$': {
      base: 'sys',
      name: 'user',
      zone: undefined
    },
    handle: 'bob',
    id: bob.user.id
  })
  expect(found.why).undefined()
  
  var msg2 = { handle:'not-bob'}
  found = await intern.find_user(si,msg2,ctx)
  expect(found.ok).false()
  expect(found.user).equal(null)
  expect(found.why).equals('user-not-found')
  
  var msg3 = { q:{foo:1} }
  found = await intern.find_user(si,msg3,ctx)
  expect(found.ok).false()
  expect(found.user).equal(null)
  expect(found.why).equals('multiple-matching-users')

  var msg4 = {}
  found = await intern.find_user(si,msg4,ctx)
  expect(found.ok).false()
  expect(found.user).equal(null)
  expect(found.why).equals('no-query')

})

function make_seneca() {
  var seneca = Seneca({legacy:false})
      .test()
      .use('promisify')
      .use('doc')
      .use('joi')
      .use('entity')
      .use('..')
  return seneca
}
