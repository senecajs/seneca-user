/* Copyright (c) 2019 Richard Rodger and other contributors, MIT License */
'use strict'


const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const Plugin = require('..')

const PluginValidator = require('seneca-plugin-validator')

lab.test('validate', PluginValidator(Plugin, module))

