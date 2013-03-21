/* Copyright (c) 2010-2013 Richard Rodger */
"use strict";

// mocha user.test.js


var seneca  = require('seneca')

var assert  = require('chai').assert

var gex     = require('gex')
var async   = require('async')





function cberr(win){
  return function(err){
    if(err) {
      assert.fail(err, 'callback error')
    }
    else {
      win.apply(this,Array.prototype.slice.call(arguments,1))
    }
  }
}




var si = seneca()
si.use( '..' )


describe('user', function() {
  
  it('version', function() {
    assert.ok(gex(si.version),'0.5.*')
  }),


  it('happy', function() {

    var userpin = si.pin({role:'user',cmd:'*'})
    var userent = si.make('test','sys','user')
    
    async.series({
      prep: function(cb){
        userent.load$({nick:'nick1'},cberr(function(user){
          if( user ) {
            user.remove$({nick:'nick1'},cb)
          }
          else cb();
        }))
      },

      reg1: function(cb) {
        userpin.register({
          nick:'nick1',
          email:'nick1@example.com',
          password:'testtest',
          active:true
        }, cberr(cb))
      },

      login1: function(cb) {
        userpin.login({
          nick:'nick1',
          password:'testtest'
        }, cberr(function(out){
          assert.ok(out.ok)
          var token = out.login.token
        }))
      }
    })
  })
})