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
  var opts0 = User.defaults

  var msg0 = { handle: 'foo' }
  expect(intern.ensure_handle(msg0, opts0)).equal('foo')

  // downcasing
  var ud0D = { handle: 'Foo' }
  expect(intern.ensure_handle(ud0D, opts0)).equal('foo')

  var ud1 = { handle: 'foo' }
  expect(intern.ensure_handle(ud1, opts0)).equal('foo')

  var ud2 = { email: 'foo@example.com' }
  expect(intern.ensure_handle(ud2, opts0)).startsWith('foo')

  var opts1 = Seneca.util.deep({}, User.defaults, {
    handle: { downcase: false },
  })

  var ud6 = { handle: 'Foo' }
  expect(intern.ensure_handle(ud6, opts1)).equal('Foo')
})

lab.test('fix_nick_handle', async () => {
  var o = { handle: { downcase: true } }

  expect(intern.fix_nick_handle(null, o)).equal(null)
  expect(intern.fix_nick_handle({}, o)).equal({})

  expect(intern.fix_nick_handle({ handle: 'foo' }, o)).equal({ handle: 'foo' })
  expect(intern.fix_nick_handle({ user_data: { handle: 'foo' } }, o)).equal({
    user_data: { handle: 'foo' },
  })
  expect(intern.fix_nick_handle({ user: { handle: 'foo' } }, o)).equal({
    user: { handle: 'foo' },
  })
  expect(intern.fix_nick_handle({ q: { handle: 'foo' } }, o)).equal({
    q: { handle: 'foo' },
  })

  expect(intern.fix_nick_handle({ nick: 'foo' }, o)).equal({ handle: 'foo' })
  expect(intern.fix_nick_handle({ nick: 'Foo' }, o)).equal({ handle: 'foo' })
  expect(intern.fix_nick_handle({ user_data: { nick: 'foo' } }, o)).equal({
    user_data: { handle: 'foo' },
  })
  expect(intern.fix_nick_handle({ user: { nick: 'foo' } }, o)).equal({
    user: { handle: 'foo' },
  })
  expect(
    intern.fix_nick_handle({ user: { nick: 'bar', handle: 'foo' } }, o)
  ).equal({ user: { handle: 'foo' } })
  expect(intern.fix_nick_handle({ q: { nick: 'foo' } }, o)).equal({
    q: { handle: 'foo' },
  })

  expect(intern.fix_nick_handle({ user_data: {} }, o)).equal({ user_data: {} })
  expect(intern.fix_nick_handle({ user: {} }, o)).equal({ user: {} })
  expect(intern.fix_nick_handle({ q: {} }, o)).equal({ q: {} })

  var o2 = { handle: { downcase: false } }
  expect(intern.fix_nick_handle({ nick: 'Foo' }, o2)).equal({ handle: 'Foo' })
  expect(intern.fix_nick_handle({ user: { nick: 'Foo' } }, o2)).equal({
    user: { handle: 'Foo' },
  })
  expect(intern.fix_nick_handle({ user_data: { nick: 'Foo' } }, o2)).equal({
    user_data: { handle: 'Foo' },
  })
  expect(intern.fix_nick_handle({ q: { nick: 'Foo' } }, o2)).equal({
    q: { handle: 'Foo' },
  })
})

lab.test('find_user', async () => {
  var si = make_seneca()
  var alice = await si.post('sys:user,register:user', {
    user_data: {
      handle: 'alice',
      foo: 1,
    },
  })
  expect(alice.ok).true()

  var bob = await si.post('sys:user,register:user', {
    user_data: {
      handle: 'bob',
      foo: 1,
      bar: 2,
    },
  })
  expect(bob.ok).true()

  var ctx = intern.make_ctx({}, User.defaults)

  var msg0 = { handle: 'alice' }
  var found = await intern.find_user(si, msg0, ctx)
  expect(found.ok).true()
  expect(found.user.handle).equal('alice')
  expect(found.user.data$()).equal({
    entity$: {
      base: 'sys',
      name: 'user',
      zone: undefined,
    },
    handle: 'alice',
    id: alice.user.id,
    active: true,
    name: 'alice',
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
      zone: undefined,
    },
    handle: 'bob',
    id: bob.user.id,
    active: true,
    name: 'bob',
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
      email: 'alice@example.com',
    },
  })

  // onetime login
  var spec = {
    seneca: si,
    user: alice.user,
    ctx: intern.make_ctx({}, si.find_plugin('user').options),
    why: 'onetime-test-0',
    login_data: { foo: 1 },
    onetime: true,
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
    onetime_active: true,
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
    why: 'auto-test-0',
  }

  var login = await intern.make_login(spec)
  expect(login.data$()).contains({
    entity$: { zone: undefined, base: 'sys', name: 'login' },
    handle: 'alice',
    email: 'alice@example.com',
    user_id: alice.user.id,
    active: true,
    why: 'auto-test-0',
  })
  expect(login.onetime_active).not.exists()
})

lab.test('build_pass_fields', async () => {
  var si = make_seneca()

  var ctx = intern.make_ctx({}, User.defaults)

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
    details: { password_length: 3, minimum: 8 },
  })

  var msg2 = { pass: 'abcabcabc' }
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
    why: 'repeat-password-mismatch',
  })
})

lab.test('load_user_field', () => {
  expect(intern.load_user_fields({})).equal({ q: { fields$: [] } })
  expect(intern.load_user_fields({ a: 1 })).equal({ a: 1, q: { fields$: [] } })
  expect(intern.load_user_fields({ a: 1 })).equal({ a: 1, q: { fields$: [] } })
  expect(intern.load_user_fields({ a: 1 }, null)).equal({
    a: 1,
    q: { fields$: [] },
  })
  expect(intern.load_user_fields({ a: 1 }, '')).equal({
    a: 1,
    q: { fields$: [] },
  })
  expect(intern.load_user_fields({ a: 1 }, 1)).equal({
    a: 1,
    q: { fields$: [] },
  })
  expect(intern.load_user_fields({ a: 1 }, 'x')).equal({
    a: 1,
    q: { fields$: ['x'] },
  })
  expect(intern.load_user_fields({ a: 1 }, 'x', 'y')).equal({
    a: 1,
    q: { fields$: ['x', 'y'] },
  })
  expect(intern.load_user_fields({ a: 1 }, ['x', 'y'])).equal({
    a: 1,
    q: { fields$: ['x', 'y'] },
  })
  expect(intern.load_user_fields({ a: 1 }, 'x', ['y', 'z'])).equal({
    a: 1,
    q: { fields$: ['x', 'y', 'z'] },
  })

  expect(intern.load_user_fields({ a: 1, q: {} }, 'x', ['y', 'z'])).equal({
    a: 1,
    q: { fields$: ['x', 'y', 'z'] },
  })
  expect(
    intern.load_user_fields({ a: 1, q: { k: 1 } }, 'x', ['y', 'z'])
  ).equal({ a: 1, q: { k: 1, fields$: ['x', 'y', 'z'] } })

  expect(
    intern.load_user_fields({ a: 1, q: { fields$: [] } }, 'x', ['y', 'z'])
  ).equal({ a: 1, q: { fields$: ['x', 'y', 'z'] } })
  expect(
    intern.load_user_fields({ a: 1, q: { k: 1, fields$: [] } }, 'x', ['y', 'z'])
  ).equal({ a: 1, q: { k: 1, fields$: ['x', 'y', 'z'] } })

  expect(
    intern.load_user_fields({ a: 1, q: { fields$: ['q'] } }, 'x', ['y', 'z'])
  ).equal({ a: 1, q: { fields$: ['q', 'x', 'y', 'z'] } })
  expect(
    intern.load_user_fields({ a: 1, q: { k: 1, fields$: ['q'] } }, 'x', [
      'y',
      'z',
    ])
  ).equal({ a: 1, q: { k: 1, fields$: ['q', 'x', 'y', 'z'] } })

  expect(
    intern.load_user_fields({ a: 1, q: { fields$: ['q', 'x'] } }, 'x', [
      'y',
      'z',
    ])
  ).equal({ a: 1, q: { fields$: ['q', 'x', 'y', 'z'] } })
  expect(
    intern.load_user_fields({ a: 1, q: { k: 1, fields$: ['q', 'x'] } }, 'x', [
      'y',
      'z',
    ])
  ).equal({ a: 1, q: { k: 1, fields$: ['q', 'x', 'y', 'z'] } })
})

lab.test('valid_handle', async () => {
  var si = make_seneca()

  await si.ready()

  var ctx = intern.make_ctx({}, si.find_plugin('user').options)

  // console.dir(ctx)

  // naughty naughty
  expect(await intern.valid_handle(si, '\x73\x68\x69\x74', ctx)).equals({
    ok: false,
    why: 'disallowed',
    details: {
      handle_base64: 'c2hpdA==',
    },
  })

  expect(await intern.valid_handle(si, 'guest', ctx)).equals({
    ok: false,
    why: 'reserved',
    details: {
      handle: 'guest',
    },
  })

  expect(await intern.valid_handle(si, 'aa', ctx)).equals({
    ok: false,
    why: 'handle-too-short',
    details: {
      handle: 'aa',
      handle_length: 2,
      minimum: 3,
    },
  })

  expect(await intern.valid_handle(si, '0123456789123456', ctx)).equals({
    ok: false,
    why: 'handle-too-long',
    details: {
      handle: '0123456789123456',
      handle_length: 16,
      maximum: 15,
    },
  })

  expect(await intern.valid_handle(si, 'aaa', ctx)).equals({
    handle: 'aaa',
    ok: true,
  })

  expect(await intern.valid_handle(si, '012345678912345', ctx)).equals({
    handle: '012345678912345',
    ok: true,
  })

  expect(await intern.valid_handle(si, null, ctx)).equals({
    ok: false,
    why: 'not-string',
    details: {
      handle: null,
    },
  })

  expect(await intern.valid_handle(si, {}, ctx)).equals({
    ok: false,
    why: 'not-string',
    details: {
      handle: {},
    },
  })

  expect(await intern.valid_handle(si, 'AAA', ctx)).equals({
    handle: 'aaa',
    ok: true,
  })

  expect(await intern.valid_handle(si, '***', ctx)).equals({
    ok: false,
    why: 'invalid-chars',
    details: { handle: '***' },
  })

  var ctx0 = ctx
  ctx0.options = si.util.deep({}, ctx.options, {
    handle: {
      must_match: (handle) => handle.match(/^[A-Za-z0-9_]+$/),
      downcase: false,
    },
  })
  expect(await intern.valid_handle(si, 'AAA', ctx0)).equals({
    handle: 'AAA',
    ok: true,
  })
})

lab.test('valid_email', async () => {
  var si = make_seneca()

  await si.ready()

  var ctx = intern.make_ctx({}, si.find_plugin('user').options)

  expect(await intern.valid_email(si, 'aaa@example.com', ctx)).equals({
    ok: true,
    email: 'aaa@example.com',
    why: null,
  })

  expect(await intern.valid_email(si, '@example.com', ctx)).equals({
    ok: false,
    email: '@example.com',
    why: 'email-invalid-format',
  })

  var alice = await si.post('sys:user,register:user', {
    email: 'alice@example.com',
  })

  expect(await intern.valid_email(si, 'alice@example.com', ctx)).equals({
    ok: false,
    email: 'alice@example.com',
    why: 'email-exists',
  })
})

lab.test('normalize_user_data', async () => {
  var si = await make_seneca().ready()
  var ctx = intern.make_ctx({}, si.find_plugin('user').options)

  var nud = (x) => intern.normalize_user_data(x, ctx)

  // convenience field
  var r0 = { name: 'a' }
  expect(nud({ name: 'a' })).equal(r0)
  expect(nud({ user: { name: 'a' } })).equal(r0)
  expect(nud({ user_data: { name: 'a' } })).equal(r0)
  expect(nud({ name: 'a', user_data: { name: 'c' } })).equal(r0)
  expect(nud({ user: { name: 'b' }, user_data: { name: 'a' } })).equal(r0)
  expect(
    nud({ name: 'a', user: { name: 'b' }, user_data: { name: 'c' } })
  ).equal(r0)
  expect(nud({ name: 'a', email: void 0 })).equal(r0)

  // normal field
  var r1a = { foo: 1 }
  var r1b = {}
  expect(nud({ foo: 3 })).equal(r1b)
  expect(nud({ user: { foo: 1 } })).equal(r1a)
  expect(nud({ user_data: { foo: 1 } })).equal(r1a)
  expect(nud({ foo: 2, user_data: { foo: 1 } })).equal(r1a)
  expect(nud({ user: { foo: 2 }, user_data: { foo: 1 } })).equal(r1a)
  expect(nud({ foo: 3, user: { foo: 2 }, user_data: { foo: 1 } })).equal(r1a)
  expect(nud({ foo: 3, bar: undefined })).equal(r1b)
  expect(nud({ user: { foo: 1, bar: undefined } })).equal(r1a)

  // pass field
  var r2 = { pass: 'a' }
  expect(nud({ pass: 'a' })).equal(r2)
  expect(nud({ user: { pass: 'a' } })).equal(r2)
  expect(nud({ user_data: { pass: 'a' } })).equal(r2)
  expect(nud({ pass: 'a', user_data: { pass: 'c' } })).equal(r2)
  expect(nud({ user: { pass: 'b' }, user_data: { pass: 'a' } })).equal(r2)
  expect(
    nud({ pass: 'a', user: { pass: 'b' }, user_data: { pass: 'c' } })
  ).equal(r2)

  // password -> pass
  var r3 = { pass: 'a' }
  expect(nud({ password: 'a' })).equal(r3)
  expect(nud({ user: { password: 'a' } })).equal(r3)
  expect(nud({ user_data: { password: 'a' } })).equal(r3)
  expect(nud({ password: 'a', user_data: { password: 'c' } })).equal(r3)
  expect(nud({ user: { password: 'b' }, user_data: { password: 'a' } })).equal(
    r3
  )
  expect(
    nud({
      password: 'a',
      user: { password: 'b' },
      user_data: { password: 'c' },
    })
  ).equal(r3)
  expect(nud({ password: 'b', pass: 'a' })).equal(r3)
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
