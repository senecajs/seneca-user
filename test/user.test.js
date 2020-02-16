/* Copyright (c) 2019-2020 Richard Rodger and other contributors, MIT License */
'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const Seneca = require('seneca')
const Plugin = require('..')
const PluginValidator = require('seneca-plugin-validator')



lab.test('validate', PluginValidator(Plugin, module))

lab.test('happy', async ()=>{
  var si = make_seneca()
  await si.ready()
  expect(si.find_plugin('user')).exists()
})


lab.test('export', async ()=>{
  var si = make_seneca()
  await si.ready()

  var find_user = si.export('user/find_user')
  expect(find_user).function()

  var alice = await si.post('sys:user,register:user', {
    handle: 'alice',
  })

  var found = await find_user(si,{handle:'alice'})
  expect(found.ok).true()
  expect(found.why).not.exists()
  expect(alice.user.data$()).contains(found.user.data$())

  found = await find_user(si,{handle:'alice'},{standard_user_fields:['name']})
  expect(found.ok).true()
  expect(found.why).not.exists()
  expect(found.user.handle).not.exists()
  expect(alice.user.data$()).contains(found.user.data$())

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
