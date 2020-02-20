/* Copyright (c) 2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Code = require('@hapi/code')
const Lab = require('@hapi/lab')

const SenecaMsgTest = require('seneca-msg-test')
const Seneca = require('seneca')

var expect = Code.expect
var lab = (exports.lab = Lab.script())

var User = require('..')
var intern = User.intern

lab.test('make_handle', async () => {
  var h0 = intern.make_handle()
  expect(typeof h0).equal('string')
  expect(h0.length).equal(12)
  expect(h0.match(/^[a-z]+$/)).exists()
})

lab.test('ensure_handle', async () => {
  var opts0 = { make_handle: intern.make_handle }

  var msg0 = { handle: 'foo' }
  expect(intern.ensure_handle(msg0, opts0)).equal('foo')
  expect(msg0.handle).equal('foo')
  expect(msg0.user).not.exists()

  var msg1 = { user_data: { handle: 'foo' } }
  expect(intern.ensure_handle(msg1, opts0)).equal('foo')
  expect(msg1.handle).equal('foo')
  expect(msg1.user_data.handle).equal('foo')

  var msg2 = { email: 'foo@example.com' }
  expect(intern.ensure_handle(msg2, opts0)).startsWith('foo')
  expect(msg2.handle).startsWith('foo')
  expect(msg2.handle.length).equal(7)

  var msg3 = { user_data: { email: 'foo@example.com' } }
  expect(intern.ensure_handle(msg3, opts0)).startsWith('foo')
  expect(msg3.handle).startsWith('foo')
  expect(msg3.handle.length).equal(7)

  // convenience fields have precedence, and override
  var msg4 = { handle: 'bar', user_data: { handle: 'foo' } }
  expect(intern.ensure_handle(msg4, opts0)).equal('bar')
  expect(msg4.handle).equal('bar')
  expect(msg4.user_data.handle).equal('bar')

  // user shortcut prop
  var msg5 = { handle: 'bar', user: { handle: 'foo' } }
  expect(intern.ensure_handle(msg5, opts0)).equal('bar')
  expect(msg5.handle).equal('bar')
  expect(msg5.user.handle).equal('bar')
})

lab.test('fix_nick_handle', async () => {
  expect(intern.fix_nick_handle(null)).equal(null)
  expect(intern.fix_nick_handle({})).equal({})

  expect(intern.fix_nick_handle({ handle: 'foo' })).equal({ handle: 'foo' })
  expect(intern.fix_nick_handle({ user_data: { handle: 'foo' } })).equal({
    user_data: { handle: 'foo' }
  })
  expect(intern.fix_nick_handle({ user: { handle: 'foo' } })).equal({
    user: { handle: 'foo' }
  })
  expect(intern.fix_nick_handle({ q: { handle: 'foo' } })).equal({
    q: { handle: 'foo' }
  })

  expect(intern.fix_nick_handle({ nick: 'foo' })).equal({ handle: 'foo' })
  expect(intern.fix_nick_handle({ user_data: { nick: 'foo' } })).equal({
    user_data: { handle: 'foo' }
  })
  expect(intern.fix_nick_handle({ user: { nick: 'foo' } })).equal({
    user: { handle: 'foo' }
  })
  expect(
    intern.fix_nick_handle({ user: { nick: 'bar', handle: 'foo' } })
  ).equal({ user: { handle: 'foo' } })
  expect(intern.fix_nick_handle({ q: { nick: 'foo' } })).equal({
    q: { handle: 'foo' }
  })

  expect(intern.fix_nick_handle({ user_data: {} })).equal({ user_data: {} })
  expect(intern.fix_nick_handle({ user: {} })).equal({ user: {} })
  expect(intern.fix_nick_handle({ q: {} })).equal({ q: {} })
})

lab.test('find_user', async () => {
  var si = make_seneca()
  var alice = await si.post('sys:user,register:user', {
    user_data: {
      handle: 'alice',
      foo: 1
    }
  })

  var bob = await si.post('sys:user,register:user', {
    user_data: {
      handle: 'bob',
      foo: 1,
      bar: 2
    }
  })

  var ctx = intern.make_ctx({}, { fields: { standard: ['handle'] } })

  var msg0 = { handle: 'alice' }
  var found = await intern.find_user(si, msg0, ctx)
  expect(found.ok).true()
  expect(found.user.handle).equal('alice')
  expect(found.user.data$()).equal({
    entity$: {
      base: 'sys',
      name: 'user',
      zone: undefined
    },
    handle: 'alice',
    id: alice.user.id
  })
  expect(found.why).undefined()

  var msg1 = { handle: 'bob' }
  found = await intern.find_user(si, msg1, ctx)
  expect(found.ok).true()
  expect(found.user.handle).equal('bob')
  expect(found.user.data$()).equal({
    entity$: {
      base: 'sys',
      name: 'user',
      zone: undefined
    },
    handle: 'bob',
    id: bob.user.id
  })
  expect(found.why).undefined()

  var msg2 = { handle: 'not-bob' }
  found = await intern.find_user(si, msg2, ctx)
  expect(found.ok).false()
  expect(found.user).equal(null)
  expect(found.why).equals('user-not-found')

  var msg3 = { q: { foo: 1 } }
  found = await intern.find_user(si, msg3, ctx)
  expect(found.ok).false()
  expect(found.user).equal(null)
  expect(found.why).equals('multiple-matching-users')

  var msg4 = {}
  found = await intern.find_user(si, msg4, ctx)
  expect(found.ok).false()
  expect(found.user).equal(null)
  expect(found.why).equals('no-user-query')

  // unique field works
  var msg5 = { q: { bar: 2 } }
  found = await intern.find_user(si, msg5, ctx)
  expect(found.ok).true()
  expect(found.user.handle).equal('bob')

  // nobody matches
  var msg5 = { q: { 'not-a-field': 3 } }
  found = await intern.find_user(si, msg5, ctx)
  expect(found.ok).false()
  expect(found.why).equals('user-not-found')

  // by id
  var msg6 = { id: alice.user.id }
  var found = await intern.find_user(si, msg6, ctx)
  expect(found.ok).true()
  expect(alice.user.data$()).contains(found.user.data$())
  expect(found.why).undefined()

  // by user
  var msg7 = { user: alice.user }
  var found = await intern.find_user(si, msg7, ctx)
  expect(found.ok).true()
  expect(alice.user.data$()).equals(found.user.data$())
  expect(found.why).undefined()

  // by user as query
  var msg8 = { user: alice.user.data$(false) }
  var found = await intern.find_user(si, msg8, ctx)
  expect(found.ok).true()
  expect(alice.user.data$()).contains(found.user.data$())
  expect(found.why).undefined()
})

lab.test('make_login', async () => {
  var si = await make_seneca().ready()

  var alice = await si.post('sys:user,register:user', {
    user_data: {
      handle: 'alice',
      email: 'alice@example.com'
    }
  })

  // onetime login
  var spec = {
    seneca: si,
    user: alice.user,
    ctx: intern.make_ctx({}, si.find_plugin('user').options),
    why: 'onetime-test-0',
    login_data: { foo: 1 },
    onetime: true
  }

  var login = await intern.make_login(spec)
  expect(login.data$()).contains({
    entity$: { zone: undefined, base: 'sys', name: 'login' },
    foo: 1,
    handle: 'alice',
    email: 'alice@example.com',
    user_id: alice.user.id,
    active: true,
    why: 'onetime-test-0',
    onetime_active: true
  })

  expect(login.token).string()
  expect(login.token.length).above(31)
  //token: '252f1fb7-9725-4994-99c0-25054b95c36a',

  expect(login.when).string()
  expect(login.when.length).above(22)
  //when: '2020-02-16T12:32:45.303Z',

  expect(login.onetime_token).string()
  expect(login.onetime_token.length).above(31)
  //onetime_token: '9dfbcfb4-6aaf-4abd-9b12-959c9192a0c8',

  expect(login.onetime_expiry).number()
  expect(login.onetime_expiry).above(Date.now())
  //onetime_expiry: 1581857265303,

  // auto login
  spec = {
    seneca: si,
    user: alice.user,
    ctx: intern.make_ctx({}, si.find_plugin('user').options),
    why: 'auto-test-0'
  }

  var login = await intern.make_login(spec)
  expect(login.data$()).contains({
    entity$: { zone: undefined, base: 'sys', name: 'login' },
    handle: 'alice',
    email: 'alice@example.com',
    user_id: alice.user.id,
    active: true,
    why: 'auto-test-0'
  })
  expect(login.onetime_active).not.exists()
})

lab.test('build_pass_fields', async () => {
  var si = make_seneca()

  var ctx = intern.make_ctx({}, { fields: { standard: ['handle'] } })

  var msg0 = { pass: 'abcabcabc' }
  var pf0 = await intern.build_pass_fields(si, msg0, ctx)
  expect(pf0.ok).true()
  expect(pf0.fields.pass.length).above(32)
  expect(pf0.fields.salt.length).above(16)

  var msg1 = { pass: 'abc' }
  var pf1 = await intern.build_pass_fields(si, msg1, ctx)
  expect(pf1).equal({
    ok: false,
    why: 'password-too-short',
    details: { password_length: 3, minimum: 8 }
  })

  var msg2 = { password: 'abcabcabc' }
  var pf2 = await intern.build_pass_fields(si, msg2, ctx)
  expect(pf2.ok).true()
  expect(pf2.fields.pass.length).above(32)
  expect(pf2.fields.salt.length).above(16)
  expect(pf2.fields.salt).not.equal(pf0.fields.salt)
  expect(pf2.fields.pass).not.equal(pf0.fields.pass) // as salts differ

  var msg3 = { pass: 'abcabcabc', salt: 'foo' }
  var pf3 = await intern.build_pass_fields(si, msg3, ctx)
  expect(pf3.ok).true()

  var msg4 = { pass: 'abcabcabc', salt: 'foo' }
  var pf4 = await intern.build_pass_fields(si, msg4, ctx)
  expect(pf4.ok).true()

  expect(pf3.fields.salt).equal(pf4.fields.salt)
  expect(pf3.fields.pass).equal(pf4.fields.pass)

  var msg5 = { pass: 'abcabcabc', repeat: 'abcabcabc' }
  var pf5 = await intern.build_pass_fields(si, msg5, ctx)
  expect(pf5.ok).true()

  var msg6 = { pass: 'abcabcabc', repeat: 'xyzxyzxyz' }
  var pf6 = await intern.build_pass_fields(si, msg6, ctx)
  expect(pf6).equal({
    ok: false,
    why: 'repeat-password-mismatch'
  })
})

lab.test('load_user_field', () => {
  expect(intern.load_user_fields({})).equal({q:{fields$:[]}})
  expect(intern.load_user_fields({a:1})).equal({a:1,q:{fields$:[]}})
  expect(intern.load_user_fields({a:1})).equal({a:1,q:{fields$:[]}})
  expect(intern.load_user_fields({a:1},null)).equal({a:1,q:{fields$:[]}})
  expect(intern.load_user_fields({a:1},'')).equal({a:1,q:{fields$:[]}})
  expect(intern.load_user_fields({a:1},1)).equal({a:1,q:{fields$:[]}})
  expect(intern.load_user_fields({a:1},'x')).equal({a:1,q:{fields$:['x']}})
  expect(intern.load_user_fields({a:1},'x','y')).equal({a:1,q:{fields$:['x','y']}})
  expect(intern.load_user_fields({a:1},['x','y'])).equal({a:1,q:{fields$:['x','y']}})
  expect(intern.load_user_fields({a:1},'x',['y','z']))
    .equal({a:1,q:{fields$:['x','y','z']}})

  expect(intern.load_user_fields({a:1,q:{}},'x',['y','z']))
    .equal({a:1,q:{fields$:['x','y','z']}})
  expect(intern.load_user_fields({a:1,q:{k:1}},'x',['y','z']))
    .equal({a:1,q:{k:1,fields$:['x','y','z']}})

  expect(intern.load_user_fields({a:1,q:{fields$:[]}},'x',['y','z']))
    .equal({a:1,q:{fields$:['x','y','z']}})
  expect(intern.load_user_fields({a:1,q:{k:1,fields$:[]}},'x',['y','z']))
    .equal({a:1,q:{k:1,fields$:['x','y','z']}})

  expect(intern.load_user_fields({a:1,q:{fields$:['q']}},'x',['y','z']))
    .equal({a:1,q:{fields$:['q','x','y','z']}})
  expect(intern.load_user_fields({a:1,q:{k:1,fields$:['q']}},'x',['y','z']))
    .equal({a:1,q:{k:1,fields$:['q','x','y','z']}})

  expect(intern.load_user_fields({a:1,q:{fields$:['q','x']}},'x',['y','z']))
    .equal({a:1,q:{fields$:['q','x','y','z']}})
  expect(intern.load_user_fields({a:1,q:{k:1,fields$:['q','x']}},'x',['y','z']))
    .equal({a:1,q:{k:1,fields$:['q','x','y','z']}})

})



function make_seneca() {
  var seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('doc')
    .use('joi')
    .use('entity')
    .use('..')
  return seneca
}
