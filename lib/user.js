/* Copyright (c) 2012-2013 Richard Rodger, MIT License */
"use strict";


var _ = require('underscore')
var uuid = require('node-uuid')
var crypto = require('crypto')


function nil(){
  _.each(arguments,function(arg){
    if( _.isFunction(arg) ) {
      return arg()
    }
  })
}



module.exports = function user(seneca,opts,cb){
  var name = "user"

  opts = _.extend({
    user:{
      zone:null,
      base:'sys',
      name:'user',
    },
    login:{
      zone:null,
      base:'sys',
      name:'login',
    },
  },opts)
  
  var log = seneca.log


  var user_ent
  var login_ent

  // FIX!!!
  function LE_load(cmd,name,meta,log,cb,win) {
    return function(err,ent) {
      var out = {}
      out[cmd]=false
      
      if( err ) {
        log.error(cmd,'load','error',name,err,meta)
        return cb(err,out)
      }
      
      if( ent ) {
        win(ent)
      }
      else {
        log.info(cmd,'load','not_found',name,meta)
        return cb(err,out)
      }
    }
  }

  

  function hide(args,propnames){
    var outargs = _.extend({},args)
    for( var pn in propnames ) {
      outargs[pn] = '[HIDDEN]'
    }
    return outargs
  }



  // args={password}
  function cmd_encrypt_password(args,cb){
    var salt = uuid().substring(0,8)
    var shasum = crypto.createHash('sha1')
    shasum.update( args.password + salt )
    var pass = shasum.digest('hex')

    cb(null,{pass:pass,salt:salt})
  }
  cmd_encrypt_password.descdata = function(args){return hide(args,{password:1})}



  // args={proposed,pass,salt}
  function cmd_verify_password(args,cb){
    var shasum = crypto.createHash('sha1')
    shasum.update( args.proposed + args.salt )
    var check = shasum.digest('hex')
    
    var ok = (check===args.pass)
    cb(null,{ok:ok})
  }
  cmd_verify_password.descdata = function(args){return hide(args,{proposed:1})}



  function cmd_change_password(args,cb){
    var user = user_ent.make$()

    var q = {}
    if( args.nick ) {
      q.nick = args.nick
    }
    else {
      q.email = args.email
    }

    user.load$(q, function(err,user){
      if( err ) return cb(err,{ok:false});


      cmd_encrypt_password({password:args.password},function(err,out){
        user.salt = out.salt
        user.pass = out.pass
        user.save$(function(err,user){
          cb(err,{ok:true,user:user})
        })
      })
    })
  }
  cmd_change_password.descdata = function(args){return hide(args,{proposed:1})}



  function cmd_register(args,cb){
    var user = user_ent.make$()

    // FIX: handle bad input! e.g. undef nick etc

    user.nick     = args.nick || args.username || args.email
    user.email    = args.email
    user.name     = args.name || ''
    user.active   = void 0==args.active ? true : args.active
    user.when     = new Date().toISOString()

    var extra = _.omit(args,['role','cmd','nick','email','name','active','username','password','salt','pass','id'])
    _.map(extra,function(val,key){ 
      if( !key.match(/\$/) ) {
        user[key]=val 
      }
    })

    var exists = false

    checknick(
      function(){ checkemail(
        function() { saveuser() })})

    function checknick(next) {
      if( user.nick ) {
        user.load$({nick:user.nick},function(err,userfound){
          if( err ) return cb(err,{ok:false,user:user})
          if( userfound ) return cb(null,{ok:false,exists:true,check:'nick',nick:user.nick})
          next()
        })
        return
      }
      next()
    }

    function checkemail(next) {
      if( user.email ) {
        user.load$({email:user.email},function(err,userfound){
          if( err ) return cb(err,{ok:false,user:user})
          if( userfound ) return cb(null,{ok:false,exists:true,check:'email',nick:user.email})
          next()
        })
        return
      }
      next()
    }

    function saveuser() {
      // TODO: hmmm....
      args.password = void 0 == args.password ? args.pass : args.password
      args.password = _.isUndefined(args.password) ? ''+Math.random : args.password
      args.repeat   = _.isUndefined(args.repeat)   ? args.password : args.repeat

      // TODO: option: password restrictions, e.g. length
      if( args.password === args.repeat && 0 < args.password.length ) {

        cmd_encrypt_password({password:args.password},function(err,out){
          if( err ) return cb(err,{ok:false,user:user})

          user.salt = out.salt
          user.pass = out.pass
          user.save$(function(err,saveduser){
            log.info('register',user.nick,user.email,err,saveduser)
            cb(err,{ok:!err,user:saveduser})
          })
        })
      }
      else {
        cb({err:'password_mismatch'})
      }
    }
  }




  function cmd_login(args,cb){
    var user = user_ent.make$()

    var valid = false
    var q = {active:true}
    if( args.nick && 0 < args.nick.length ) {
      q.nick = args.nick
      valid = true
    }
    else if( args.email && 0 < args.email.length ) {
      q.email = args.email
      valid = true
    }

    if( !valid ) {
      log.info('login','nick_or_email_missing')
      return cb(null,{ok:false})
    }

    user.load$(q, function(err,user){
      if( err ) {
        log.info('login',q.nick,q.email,err)
        return cb(err);
      }

      if( user ) {
        var ok = args.auto
        var why = 'auto'

        if( !ok ) {
          var shasum = crypto.createHash('sha1')
          shasum.update( args.password + user.salt )
          var pass = shasum.digest('hex')

          ok = (user.pass==pass)
          why = 'password'
        }

        if( ok ) {
          var login = login_ent.make$()

          login.token   = uuid()
          login.nick    = user.nick
          login.email   = user.email
          login.user    = user.id
          login.when    = new Date().toISOString()
          login.active  = true

          login.save$(function(err,login){
            log.info('login',q.nick,q.email,why,err,login,user)
            cb(err,{user:user,login:login,ok:true})
          })
        }
        else {
          log.info('login',q.nick,q.email,'fail',why)
          cb(null,{user:user,ok:false})
        }
      }
      else {
        log.info('login',q.nick,q.email,'user_not_found')
        cb(err,{ok:false})
      }
    })
  }


  function cmd_auth(args,cb){
    var login = login_ent.make$()

    var q = {active:true}

    if( args.token && 0 < args.token.length ) {
      q.token = args.token
    }
    else {
      log.info('auth','no_token')
      return cb(null,{ok:false})
    }

    login.load$(q, LE_load(
      'auto','login',{q:q},log,cb,
      function(login){

        var user = seneca.make(args.tenant,'sys','user')
        var q = {id:login.user}

        user.load$(q, LE_load(
          'auto','user',{q:q,login:login},log,cb,
          function(user){

            log.info('auth','user',q,login,user)
            cb(null,{user:user,login:login,ok:true})
          }))
      }))
  }



  function cmd_logout(args,cb){
    var login = login_ent.make$()

    var q = {active:true}
    q.token = args.token

    if( args.token && 0 < args.token.length ) {
      q.token = args.token
    }
    else {
      log.info('logout','no_token')
      return cb(null,{ok:false})
    }

    login.load$(q, LE_load(
      'logout','login',{q:q},log,cb,
      function(login){
        login.active = false
        login.ended  = new Date().getTime()
        login.save$(function(err,login){
          if( err ) {
            log.info('logout','error','save','login',err,login)
            return cb(err,{lok:false})
          }
          else {
            var user = seneca.make(args.tenant,'sys','user')
            var q = {id:login.user}

            user.load$(q, LE_load(
              'logout','user',{q:q,login:login},log,cb,
              function(user){
                log.info('logout','user',user,login)
                cb(null,{user:user,login:login,ok:true})
              }))
          }
        })
      }))
  }






  function cmd_update(args,cb){
    var user = user_ent.make$()

    var q = {}

    args.orig_nick = args.orig_nick || args.nick
    if( args.orig_nick ) {
      q.nick = search 
    }
    else {
      q.email = args.orig_email || args.email
    }

    user.load$(q,function(err,user){

      if( err ) return cb(err,{ok:false})
      if( !user ) return cb(null,{ok:false,exists:false})

      var pwd   = args.password || ''
      var pwd2  = args.repeat || ''
  
      if( pwd ) {
        if( pwd === pwd2 && 1 < pwd.length) {
          cmd_change_password({nick:args.orig_nick,password:pwd},function(err,userpwd){
            if( err ) return cb(err);
            updateuser(userpwd.user)
          })
        }
        else {
          cb({err:'user/password_mismatch'})
        }
      }
      else {
        updateuser(user)
      }

      function updateuser(pwdupdate) {
        user.nick  = args.nick  || pwdupdate.nick
        user.name  = args.name  || pwdupdate.name
        user.email = args.email || pwdupdate.email

        user.salt = pwdupdate.salt
        user.pass = pwdupdate.pass

        if( '' == user.nick ) {
          cb({err:'empty_nick'})
        }
        else if( '' == user.email ) {
          cb({err:'empty_email'})
        }
        else {
          user.save$(function(err,user){
            cb(err,{ok:!err,user:user})
          })
        }
      }
    })
  }

  

  function cmd_clean(args,cb){
    var user = args.user.data$()
    delete user.pass
    delete user.salt
    delete user.active
    delete user.$
    cb(null,user)
  }




  seneca.add({role:name,cmd:'ping'},function(args,cb){
    cb(null,{rand:args.rand,when:new Date().getTime()})
  })



  user_ent  = seneca.make(opts.user.zone,opts.user.base,opts.user.name)
  login_ent = seneca.make(opts.login.zone,opts.login.base,opts.login.name)
    

  seneca.add({role:name, cmd:'encrypt_password'},cmd_encrypt_password)
  seneca.add({role:name, cmd:'verify_password'},cmd_verify_password)
  seneca.add({role:name, cmd:'change_password'},cmd_change_password)

  seneca.add({role:name, cmd:'register'},cmd_register)    
  seneca.add({role:name, cmd:'login'},cmd_login)

  seneca.add({role:name, cmd:'auth'},cmd_auth)
  seneca.add({role:name, cmd:'logout'},cmd_logout)

  seneca.add({role:name, cmd:'update'},cmd_update)

  seneca.add({role:name, cmd:'clean'},cmd_clean)

  seneca.add({role:name, cmd:'entity'},function(args,cb){
    var kind = args.kind || 'user'
    var ent = ( 'user' == kind ? user_ent : login_ent ).make$()
    cb(null, ent )
  })



  seneca.add({init:name},function(args,done){
    var sys_entity = seneca.make$('sys','entity')

    seneca.util.recurse(
      ['user','login'],
      function(entname,done){
        sys_entity.load$({base:'sys',name:entname},function(err,ent){
          if(err) return done(err);

          (ent?nil:sys_entity.save$)({base:'sys',name:entname},function(err,out){
            return done(err)
          })
        })
      },
      done)
  })


  cb(null,{
    name:name
  })
}
