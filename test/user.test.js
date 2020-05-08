/* Copyright (c) 2019-2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const Seneca = require('seneca')
const Plugin = require('..')
const PluginValidator = require('seneca-plugin-validator')

const Shared = require('./shared')

lab.test('validate', PluginValidator(Plugin, module))

lab.test('happy', async () => {
  var si = Shared.make_seneca()
  await si.ready()
  expect(si.find_plugin('user')).exists()

  // double load works
  si.use('..')
  await si.ready()
  expect(si.find_plugin('user')).exists()
})

lab.test('export', async () => {
  var si = Shared.make_seneca()
  await si.ready()

  var find_user = si.export('user/find_user')
  expect(find_user).function()

  var alice = await si.post('sys:user,register:user', {
    handle: 'alice',
  })

  expect(alice.ok).true()
  expect(alice.user.handle).equals('alice')

  var found = await find_user(si, { handle: 'alice' })
  expect(found.ok).true()
  expect(found.why).not.exists()
  expect(alice.user.data$()).contains(found.user.data$())

  found = await find_user(
    si,
    { handle: 'alice' },
    { standard_user_fields: ['name'] }
  )
  expect(found.ok).true()
  expect(found.why).not.exists()
  expect(found.user.handle).not.exists()
  expect(alice.user.data$()).contains(found.user.data$())
})

lab.test('bad-data', async () => {
  var si = Shared.make_seneca()
  await si.ready()

  var bad_login0 = await si
    .entity('sys/login')
    .data$({ token: 'bad0', active: true, user_id: 'not-a-user' })
    .save$()

  var out = await si.post('sys:user,auth:user', { token: 'bad0' })

  expect(out).equal({
    login_id: bad_login0.id,
    ok: false,
    token: 'bad0',
    why: 'user-not-found',
  })
})

lab.test('legacy-data', async () => {
  var si = Shared.make_seneca()
  await si.ready()

  var alice = await si.post('sys:user,register:user', {
    handle: 'alice',
  })

  var legacy_login0 = await si
    .entity('sys/login')
    .data$({ token: 'al0', handle: 'alice', active: true, user: alice.user.id })
    .save$()

  var out = await si.post('sys:user,auth:user', { token: 'al0' })

  expect(out.ok).true()
  expect(out.user).contains({ handle: 'alice' })
  expect(out.login).contains({ token: 'al0', handle: 'alice' })
})

lab.test('handle-sanitize', async () => {
  var si = Shared.make_seneca()
  await si.ready()

  var opts = si.find_plugin('user').options
  var sanitize = opts.handle.sanitize

  expect(sanitize('alice.anderson')).equal('alice_anderson')
})
