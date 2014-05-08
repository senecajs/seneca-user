/* Copyright (c) 2012-2014 Richard Rodger, MIT License */
"use strict";


var crypto = require('crypto')

var _    = require('underscore')
var uuid = require('node-uuid')


// WARNING: this plugin is for *internal* use, DO NOT expose via an API.
// See the seneca-auth plugin for an example of an API that uses this plugin.


function conditionalExtend(user, args) {
  var extra = _.omit(args,[
    'role','cmd','nick','email','name','active','username','password','salt','pass','id','confirmed','confirmcode'
  ])
  _.map(extra,function(val,key){
    if( !key.match(/\$/) ) {
      user[key]=val
    }
  })
}
module.exports = function user(options) {
  var seneca = this

  // # Plugin options.
  // These are the defaults. You can override using the _options_ argument.
  // Example: `seneca.use("user",{mustrepeat:true})`.
  options = seneca.util.deepextend({
    role:        'user',
    rounds:      11111,
    autopass:    true,    // generate a password if none provided
    mustrepeat:  false, // password repeat arg needed
    resetperiod: (24*60*60*1000), // must reset within this time period, default: 24 hours
    confirm:     false,
    oldsha:      true,
    user:{
      fields:[
        {name:'pass',hide:true},
        {name:'salt',hide:true}
      ]
    },
    login:{
      fields:[]
    },
    reset:{
      fields:[]
    },
  },options)


  // You can change the _role_ value for the plugin patterns.
  // Use this when you want to load multiple versions of the plugin
  // and expose them via different patterns.
  var role = options.role


  // There are the data entities that the plugin uses
  // _userent_: standard user entity sys/user - user details are stored here
  // _loginent_: standard login entity sys/login - valid logins are stored here
  // _resetent_: standard user entity sys/user - reset tokens are stored here
  var userent  = seneca.make('sys/user')
  var loginent = seneca.make('sys/login')
  var resetent = seneca.make('sys/reset')


  // # Action patterns
  // These define the pattern interface for this plugin.
  ;


  // ### Encrypt a plain text password string
  // Pattern: _**role**:user, **cmd**:encrypt_password_
  seneca.add({
    role: role,
    cmd:  'encrypt_password',

    password: {type:'string$'}, // password plain text string
    repeat:   {type:'string$'}, // password plain text string, repeated
  }, cmd_encrypt_password )



  // ### Verify a password string
  // Pattern: _**role**:user, **cmd**:verify_password_
  // Has the user entered the correct password?
  seneca.add({
    role: role,
    cmd:  'verify_password',

    proposed: {required$:true,string$:true},
    pass:     {required$:true,string$:true},
    salt:     {required$:true,string$:true}
  }, cmd_verify_password )



  // ### Change password
  // Pattern: _**role**:user, **cmd**:change_password_
  seneca.add({
    role: role,
    cmd:  'change_password',

    // identify user, various options
    atleastone$:['nick','email','user','username'],
    nick:     {string$:true},
    email:    {string$:true},
    username: {string$:true},
    user:     {object$:true},

    password: {string$:true,required$:true}, // new password plain text string
    repeat:   {string$:true}                 // new password plain text string, repeated
  }, resolve_user(cmd_change_password,true))



  // ### Register a new user
  // Pattern: _**role**:user, **cmd**:register_
  seneca.add({
    role: role,
    cmd:  'register',

    // identify user, various options
    atleastone$: ['nick','email','username'],
    nick:        {string$:true},
    email:       {string$:true},
    username:    {string$:true},

    password:    {string$:true},  // password plain text string
    repeat:      {string$:true},  // password plain text string, repeated

    name:        {string$:true},  // full name, as one string
    active:      {boolean$:true}, // is user active?

    confirm:     {boolean$:true}, // is user confirmed?
  }, cmd_register )



  // ### Login a user
  // Pattern: _**role**:user, **cmd**:login_
  // Creates an entry in _sys/login_ and generates a login token
  seneca.add({
    role:role,
    cmd:'login',

    // identify user, various options
    atleastone$:['nick','email','user','username'],
    nick:     {string$:true},
    email:    {string$:true},
    username: {string$:true},
    user:     {object$:true},

    password: {string$:true}, // password plain text
    auto:     {boolean$:true} // login without password

  }, resolve_user(cmd_login,false) )



  // ### Confirm user
  // Pattern: _**role**:user, **cmd**:confirm_
  // Use confirmation code, provided to user by email (say), to confirm registration.
  seneca.add({
    role: role,
    cmd:  'confirm',

    code:{string$:true,required$:true} // confirmation code
  }, cmd_confirm )



  // ### Authorize user
  // Pattern: _**role**:user, **cmd**:auth_
  // Validates that the token exists and is active
  seneca.add({
    role: role,
    cmd:  'auth',

    token:{required$:true,string$:true} // login token
  }, cmd_auth )



  // ### Logout user
  // Pattern: _**role**:user, **cmd**:logout_
  // Mark token record in _sys/login_ as inactive
  seneca.add({
    role: role,
    cmd:  'logout',

    token:{required$:true,string$:true} // login token
  }, cmd_logout )



  // ### Clean user data
  // Pattern: _**role**:user, **cmd**:clean_
  // Remove sensitive data fields such as password hash.
  seneca.add({
    role: role,
    cmd:  'clean',

    user:{required$:true,entity$:'sys/user'}, // sys/user entity
  }, cmd_clean )



  // ### Create a password reset entry
  // Pattern: _**role**:user, **cmd**:create_reset_
  // Create an entry in _sys/reset_ that provides a reset token
  seneca.add( {role:role, cmd:'create_reset'},
              resolve_user(cmd_create_reset,false) )


  // ### Load a password reset entry
  // Pattern: _**role**:user, **cmd**:load_reset_
  // Load a _sys/reset_ entry by reset token
  seneca.add( {role:role, cmd:'load_reset'},
              cmd_load_reset )


  // ### Execute a password reset
  // Pattern: _**role**:user, **cmd**:execute_reset_
  // Execute a _sys/reset_ entry by reset token, providing the new password.
  seneca.add( {role:role, cmd:'execute_reset'},
              cmd_execute_reset )


  // ### Update user details
  // Pattern: _**role**:user, **cmd**:update_
  seneca.add( {role:role, cmd:'update'},
              cmd_update )


  // ### Enable user
  // Pattern: _**role**:user, **cmd**:_
  // TODO: rename to activate for consistency
  seneca.add( {role:role, cmd:'enable'},
              cmd_enable )


  // ### Disable user
  // Pattern: _**role**:user, **cmd**:_
  // TODO: rename to deactivate for consistency
  seneca.add( {role:role, cmd:'disable'},
              cmd_disable )


  // ### Delete user
  // Pattern: _**role**:user, **cmd**:_
  // TODO: rename to remove for consistency
  seneca.add( {role:role, cmd:'delete'},
              cmd_delete )




  // DEPRECATED
  seneca.add({role:role, cmd:'entity'},function(args,done){
    var kind = args.kind || 'user'
    var ent = ( 'user' == kind ? userent : loginent ).make$()
    done(null, ent )
  })



  // Action Implementations
  ;


  function resolve_user( cmd, fail ) {
    return function( args, done ) {
      var seneca = this

      if( args.user && args.user.entity$ ) {
        return cmd.call( seneca, args, done )
      }
      else {
        var q = {}, valid = false


        if( args.email && args.nick ) {

          // email wins
          if( args.email !== args.nick ) {
            q.email = args.email
            valid = true
          }
          else if( ~args.email.indexOf('@') ) {
            q.email = args.email
            valid = true
          }
          else {
            q.nick = args.nick
            valid = true
          }
        }
        else if( args.email ) {
          q.email = args.email
          valid = true
        }
        else if( args.nick ) {
          q.nick = args.nick
          valid = true
        }
        else if( args.username ) {
          q.nick = args.username
          valid = true
        }
        else if( args.user && !args.user.entity$) {
          q.id = args.user
          valid = true
        }

        if( !valid ) {
          return done(null,{ok:false,why:'nick_or_email_missing'})
        }

        userent.load$(q, function( err, user ){
          if( err ) return done(err);
          if( !user ) {
            if( fail ) {
              return seneca.fail({code:'user/not-found',q:q});
            }
            else return done(null,{ok:false,why:'user-not-found',nick:q.nick,email:q.email})
          }
          args.user = user

          return cmd.call( seneca, args, done )
        })
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



  function hasher( src, rounds, done ) {
    var out = src, i = 0

    // don't chew up the CPU
    function round() {
      i++
      var shasum = crypto.createHash('sha512')
      shasum.update( out, 'utf8' )
      out = shasum.digest('hex')
      if( rounds <= i ) { return done(out);}
      if( 0 == i % 88 ) { return process.nextTick(round);}
      round()
    }
    round()
  }



  // Encrypt password using a salt and multiple SHA512 rounds
  // Override for password strength checking
  // - password: password string
  // - repeat: password repeat, optional
  // Provides: {pass:,salt:,ok:,why:}
  // use why if password too weak
  function cmd_encrypt_password( args, done ){
    var password = void 0 == args.password ? args.pass : args.password
    var repeat   = args.repeat

    if( _.isUndefined( password ) ) {
      if( options.autopass ) {
        password = uuid()
      }
      else return seneca.fail({code:'user/no-password',whence:args.whence},done);
    }

    if( _.isUndefined( repeat ) ) {
      if( options.mustrepeat ) {
        return seneca.fail({code:'user/no-password-repeat',whence:args.whence},done);
      }
      else repeat = password
    }

    if( password !== repeat ) {
      return done(null,{ok:false,why:'password_mismatch',whence:args.whence})
    }


    var salt = uuid().substring(0,8)
    hasher( args.password + salt, options.rounds, function(pass){
      done(null,{ok:true,pass:pass,salt:salt})
    })
  }
  cmd_encrypt_password.descdata = function(args){return hide(args,{password:1,repeat:1})}



  // Verify proposed password is correct, redoing SHA512 rounds
  // - proposed: trial password string
  // - pass:     password hash
  // - salt:     password salt
  // Provides: {ok:}
  function cmd_verify_password( args, done ){
    hasher( args.proposed + args.salt, options.rounds, function(pass){
      var ok = (pass===args.pass)

      // for backwards compatibility with <= 0.2.3
      if( !ok && options.oldsha ) {
        var shasum = crypto.createHash('sha1')
        shasum.update( args.proposed + args.salt )
        pass = shasum.digest('hex')

        ok = (pass===args.pass)
        return done(null,{ok:ok});
      }
      else return done(null,{ok:ok});
    })
  }
  cmd_verify_password.descdata = function(args){return hide(args,{proposed:1})}



  // Change password using user's nick or email
  // - nick, email: to resolve user
  // - user: user entity
  // - password: new password
  // - repeat: password repeat, optional
  // Provides: {ok:,user:}
  function cmd_change_password( args, done ){
    var seneca = this
    var user = args.user

    seneca.act(
      { role:role, cmd:'encrypt_password', whence:'change/user='+user.id+','+user.nick,
        password: args.password, repeat: args.repeat },
      function( err, out ){
        if( err ) return done(err);
        if( !out.ok ) return done(null,out);

        user.salt = out.salt
        user.pass = out.pass
        user.save$(function(err,user){
          if( err ) return done(err);

          done(null,{ok:true,user:user})
        })
      })
  }
  cmd_change_password.descdata = function(args){return hide(args,{password:1,repeat:1})}



  // Register a new user
  // - nick:     username, data store should ensure unique, alias: username, email used if not present
  // - email:    primary email address, data store should ensure unique
  // - name:     full name of user
  // - active:   status of user, active==true means login succeeds
  // - password: password text, alias: pass
  // - confirmed:  user already confirmed, default: false
  // Generated fields:
  // - when: date and time of registration
  // - confirmcode: used for confirmation
  // Provides:
  // - success: {ok:true,user:}
  // - failure: {ok:false,why:,nick:}
  function cmd_register(args,done){
    var user = userent.make$()

    user.nick     = args.nick || args.username || args.email
    user.email    = args.email
    user.name     = args.name || ''
    user.active   = void 0==args.active ? true : args.active
    user.when     = new Date().toISOString()

    if( options.confirm ) {
      user.confirmed = args.confirmed || false
      user.confirmcode = uuid()
    }

    conditionalExtend(user, args)

    var exists = false

    return checknick(
      function(){ checkemail(
        function() { saveuser() })});

    // unsafe nick unique check, data store should also enforce !!
    function checknick(next) {
      if( user.nick ) {
        userent.load$({nick:user.nick},function(err,userfound){
          if( err ) return done(err,{ok:false,user:user})
          if( userfound ) return done(null,{ok:false,why:'nick-exists',nick:args.nick})
          next()
        })
        return
      }
      next()
    }

    // unsafe email unique check, data store should also enforce !!
    function checkemail(next) {
      if( user.email ) {
        userent.load$({email:user.email},function(err,userfound){
          if( err ) return done(err,{ok:false,user:user})
          if( userfound ) return done(null,{ok:false,why:'email-exists',nick:args.nick})
          next()
        })
        return
      }
      next()
    }

    function saveuser() {
      seneca.act({ role:role, cmd:'encrypt_password', whence:'register/user='+user.nick,
                   password: args.password, repeat: args.repeat },function( err, out ){
                     if( err ) return done(err);
                     if( !out.ok ) return done(null,out);

                     user.salt = out.salt
                     user.pass = out.pass

                     user.save$( function( err, user ){
                       if( err ) return done(err)

                       seneca.log.debug('register',user.nick,user.email,user)
                       done(null,{ok:true,user:user})
                     })
                   })
    }
  }



  // Login an existing user - generates a login token. User must be active
  // - nick, email: to resolve user
  // - user:     user entity
  // - password: password text, alias: pass
  // Provides:
  // - success: {ok:true,user:,login:}
  // - failure: {ok:false,why:,nick:}
  function cmd_login(args,done){
    var seneca = this, user = args.user, why;

    if( !user.active ) {
      seneca.log.debug('login/fail',why='not-active', user)
      return done(null,{ok:false,why:why,user:user})
    }

    if( args.auto ) {
      return make_login( user, 'auto' );
    }
    else {
      seneca.act({role:role,cmd:'verify_password',proposed:args.password,pass:user.pass,salt:user.salt}, function(err,out){
        if( err ) return done(err);
        if( !out.ok ) {
          seneca.log.debug('login/fail',why='invalid-password',user)
          return done(null,{ok:false,why:why})
        }
        else return make_login( user, 'password' );
      })
    }


    function make_login( user, why ) {
      var cleanargs = seneca.util.clean(_.clone(args))

      var login = loginent.make$( seneca.util.argprops(
        {},
        cleanargs,
        {
          id$     : uuid(),
          nick    : user.nick,
          user    : user.id,
          when    : new Date().toISOString(),
          active  : true,
          why     : why
        },
        "role,cmd,password"))

      login.token = login.id$, // DEPRECATED

      login.save$( function( err, login ){
        if( err ) return done(err);

        seneca.log.debug('login/ok',why,user,login)
        done(null,{ok:true,user:user,login:login,why:why})
      })
    }
  }



  // Confirm an existing user - using confirm code sent to user
  // - nick, email: to resolve user
  // - code: confirmcode
  // Provides:
  // - success: {ok:true,user:}
  // - failure: {ok:false,why:,nick:}
  function cmd_confirm(args,done){
    var seneca = this, user = args.user, why;

    userent.load$({confirmcode:args.code}, function(err,user){
      if( err ) return done(err);

      if( user ) {
        if( user.active ) {
          user.confirmed = true
          user.save$( function( err, user ){
            if( err ) return done(err);
            done(null,{ok:true,user:user})
          })
        }
        else {
          seneca.log.debug('confirm/fail',why='not-active',args.code,user)
          return done(null,{ok:false,why:why,user:user})
        }
      }
      else {
        seneca.log.debug('confirm/fail',why='invalid-code',args.code,user)
        return done(null,{ok:false,why:why})
      }
    })
  }



  // Authorize an existing user - resolve using token
  // - token:    login token
  // Provides:
  // - success: {ok:true,user:,login:}
  // - failure: {ok:false,why:,token:}
  function cmd_auth(args,done){
    var q = {id:args.token}

    loginent.load$(q, function( err, login ) {
      if( err ) return done(err);

      if( !login ) {
        return done(null,{ok:false,token:args.token,why:'login-not-found'})
      }

      userent.load$( {id:login.user}, function( err, user ) {
        if( err ) return done(err);

        if( !user ) {
          return done(null,{ok:false,token:args.token,user:login.user,why:'user-not-found'})
        }

        done(null,{user:user,login:login,ok:true})
      })
    })
  }



  // Logout an existing user - resolve using token, idempotent
  // - token:    login token
  // Provides:
  // - success: {ok:true,user:,login:}
  function cmd_logout(args,done){
    var q = {id:args.token}

    loginent.load$(q, function( err, login ){
      if( err ) return done(err);

      if( !login ) {
        return {ok:true}
      }

      login.active = false
      login.ended  = new Date().getTime()
      login.save$( function( err, login ){
        if( err ) return done(err);

        userent.load$({id:login.user}, function( err, user ){
          seneca.log.debug('logout',user,login)
          done(null,{user:user,login:login,ok:true})
        })
      })
    })
  }



  // Create a password reset token
  // - nick, email: to resolve user
  // - user:     user entity
  // Provides: {ok:,reset:,user:}
  function cmd_create_reset( args, done ){
    var user = args.user

    resetent.make$({
      id$:    uuid(),
      nick:   user.nick,
      user:   user.id,
      when:   new Date().toISOString(),
      active: true

    }).save$( function( err, reset ) {
      if( err ) return done(err);

      done(null,{reset:reset,user:user,ok:true})
    })
  }



  // Load a password reset token
  // - token: reset token string
  // Provides: {ok:,reset:,user:}
  function cmd_load_reset( args, done ){
    var q = {id:args.token}

    resetent.load$(q, function( err, reset ) {
      if( err ) return done(err);

      if( !reset ) {
        return done(null,{ok:false,token:args.token,why:'reset-not-found'})
      }

      userent.load$( {id:reset.user}, function( err, user ) {
        if( err ) return done(err);

        if( !user ) {
          return done(null,{ok:false,token:args.token,user:reset.user,why:'user-not-found'})
        }

        done(null,{user:user,reset:reset,ok:true})
      })
    })
  }



  // Execute a password change using a reset token
  // - token: reset token string
  // - password: new password
  // - repeat: password repeat, optional
  // Provides: {ok:,reset:,user:}
  function cmd_execute_reset( args, done ){
    var seneca = this
    var q = {id:args.token}

    resetent.load$(q, function( err, reset ) {
      if( err ) return done(err);

      if( !reset ) {
        return done(null,{ok:false,token:args.token,why:'reset-not-found'})
      }

      if( !reset.active ) {
        return done(null,{ok:false,token:args.token,why:'reset-not-active'})
      }

      if( new Date() < new Date(reset.when)+ options.resetperiod ) {
        return done(null,{ok:false,token:args.token,why:'reset-stale'})
      }

      seneca.act({ role:role,cmd:'change_password',user:reset.user,
                   password:args.password,repeat:args.repeat },
                 function( err, out ) {
                   if( err ) return done(err);

                   out.reset = reset
                   if( !out.ok ) return done(null,out)

                   reset.active = false
                   reset.save$( function( err, reset ) {
                     if( err ) return done(err);

                     seneca.log.debug('reset',reset.id,user.id,user.nick,user,reset)
                     done(null,{user:user,reset:reset,ok:true})
                   })
                 })
    })
  }


  function cmd_delete(args,done){
    var user = userent.make$()

    var q = {}

    if( args.nick ) {
      q.nick = args.nick
    } else if( args.email ) {
      q.email = args.email
    } else {
      return done({err:'cannot identify user to delete'})
    }

    user.load$(q,function(err,user){

      if( err ) return done(err,{ok:false})
      if( !user ) return done(null,{ok:false,exists:false})

      var nick = user.nick
      q = {nick: nick}
      // delete from login
      var login = loginent.make$()
      login.remove$(q, function(err, data){
        if( err ) return seneca.log.warn(err)

        // delete now from resetent
        var reset = resetent.make$()
        reset.remove$(q, function(err, data){
          if( err ) return seneca.log.warn(err)

          user.remove$(q, function(err, data){
            if( err ) return done(err,{ok:false})
            done(null,{ok:true})
          })
        })
      })
    })
  }

  function cmd_update(args,done){
    var user = userent.make$()

    var q = {}

    args.orig_nick = args.orig_nick || args.nick
    if( args.orig_nick ) {
      q.nick = args.orig_nick
    }
    else {
      q.email = args.orig_email || args.email
    }

    user.load$(q,function(err,user){

      if( err ) return done(err,{ok:false})
      if( !user ) return done(null,{ok:false,exists:false})

      var pwd   = args.password || ''
      var pwd2  = args.repeat || ''

      if( pwd ) {
        if( pwd === pwd2 && 1 < pwd.length) {
          // FIX: needs to a proper action call
          cmd_change_password({nick:args.orig_nick,password:pwd},function(err,userpwd){
            if( err ) return done(err);
            user = userpwd
          })
        }
        else {
          return done({err:'user/password_mismatch'})
        }
      }

      delete args.orig_nick
      delete args.orig_email

      return checknick(
        function(){ checkemail(
          function() { updateuser(user) })});

      // unsafe nick unique check, data store should also enforce !!
      function checknick(next) {
        if( args.nick ) {
          userent.list$({nick:args.nick},function(err,users){
            if( err ) return done(err,{ok:false,user:user})
            for(var i = 0; i < users.length; i++) {
              var each = users[i]
              if (each.id !== user.id){
                return done(null,{ok:false,why:'nick-exists',nick:args.nick})
              }
            }

            next()
          })
          return
        }
        next()
      }

      // unsafe email unique check, data store should also enforce !!
      function checkemail(next) {
        if( args.email ) {
          userent.list$({email:args.email},function(err,users){
            if( err ) return done(err,{ok:false,user:user})
            for(var i = 0; i < users.length; i++) {
              var each = users[i]
              if (each.id !== user.id){
                return done(null,{ok:false,why:'email-exists',nick:args.nick})
              }
            }

            next()
          })
          return
        }
        next()
      }

      function updateuser(pwdupdate) {
        user.nick  = args.nick  || pwdupdate.nick
        user.name  = args.name  || pwdupdate.name
        user.email = args.email || pwdupdate.email

        user.salt = pwdupdate.salt
        user.pass = pwdupdate.pass

        if( '' == user.nick ) {
          done({err:'empty_nick'})
        }
        else if( '' == user.email ) {
          done({err:'empty_email'})
        }
        else {
          conditionalExtend(user, args)
          user.save$(function(err,user){
            done(err,{ok:!err,user:user})
          })
        }
      }
    })
  }

  function cmd_disable(args, done){
    cmd_change_active(args, false, done)
  }

  function cmd_enable(args, done){
    cmd_change_active(args, true, done)
  }

  function cmd_change_active(args, active, done){
    var user = userent.make$()

    var q = {}

    if( args.nick ) {
      q.nick = args.nick
    } else if( args.email ) {
      q.email = args.email
    }

    if ( !q.nick && !q.email ){
      return done(null,{ok:false,why:'cannot-identify-user'})
    }

    user.load$(q,function(err,user){
      if( err ) return done(err,{ok:false})
      if( !user ) return done(null,{ok:false,exists:false})

      user.active = active
      user.save$(function(err,user){
        done(err,{ok:!err,user:user})
      })
    })
  }


  // DEPRECATED - do this in seneca-auth
  function cmd_clean(args,done){
    var user = args.user.data$()
    delete user.pass
    delete user.salt
    delete user.active
    delete user.$
    done(null,user)
  }



  seneca.add({init:role},function(args,done){
    this.act('role:util, cmd:define_sys_entity', {list:[
      { entity:userent.entity$, fields:options.user.fields},
      { entity:loginent.entity$,fields:options.login.fields},
      { entity:resetent.entity$,fields:options.reset.fields}
    ]},done)
  })


  return {
    name:role
  }
}
