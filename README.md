# seneca-user

## A user management plugin for the [Seneca](http://senecajs.org) toolkit

This module is a plugin for the Seneca framework. It provides business logic for user management, such as:

   * login
   * logout
   * registration
   * password handling

There are two core concepts: user and login. A _user_, storing the user account details and encrypted passwords, 
and a _login_, representing an instance of a user that has been authenticated. A user can have multiple logins.

This module does not make any assumptions about the context it runs in. 
Use the [seneca-auth](http://github.com/rjrodger/seneca-auth) plugin to handle web and social media authentication.


## Support

If you're using this module, feel free to contact me on twitter if you
have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

Current Version: 0.2.1 

Tested on: node 0.8.16, seneca 0.5.3

[![Build Status](https://secure.travis-ci.org/rjrodger/seneca-user.png)](http://travis-ci.org/rjrodger/seneca-user)



## Quick example

```JavaScript
var seneca = require('seneca')()
seneca.use('user')

seneca.ready(function(){

  var userpin = seneca.pin({role:'user',cmd:'*'})

  userpin.register( {name:"Flann O'Brien",email:'nincompoop@deselby.com',password:'blackair'}, function(err,out) {

    userpin.login({email:'nincompoop@deselby.com',password:'bicycle'}, function(err,out){
      console.log('login success: '+out.ok)

      userpin.login({email:'nincompoop@deselby.com',password:'blackair'}, function(err,out){
        console.log('login success: '+out.ok)
        console.log('login instance: '+out.login)
      })
    })
  })
})
```

This example, uses a _pin_ for convenience: <code>userpin.register( ... )</code> is the same as 
<code>seneca.act({role:'user',cmd:'register', ... )</code>.

In the example code, a user is registered, and then two login attempts are made. The first with an incorrect password, the second with the correct
password. The successful login provides a login instance. The _login.token_ property can be used to authenticate this login. For example,
the [seneca-auth](http://github.com/rjrodger/seneca-auth) plugin uses this token as a HTTP authentication cookie.


## Deeper example

Take a look at the <a href="http://github.com/rjrodger/seneca-examples">user accounts example</a>.



## Install

```sh
npm install seneca
npm install seneca-user
```

You'll need the [seneca](http://github.com/rjrodger/seneca) module to use this module - it's just a plugin.



## Usage

To load the plugin:

```JavaScript
seneca.use('user', { ... options ... })
```

The user and login data is persisted using seneca entities. These have
names _sys_user_ and _sys_login_ by default, but can be changed in the
options.

Passwords are not stored in plaintext, but using a salted SHA hash. In
the context of password reminder functionality, this means you can
generate new passwords, but cannot recover old ones. 
[This is what you want](http://www.codinghorror.com/blog/2007/09/youre-probably-storing-passwords-incorrectly.html).

There are separate actions to encrypt and verify passwords, so you can do things your own way if you like.

To support different use cases, users can be identified by either a
_nick_ or their email address. The _nick_ property is the traditional
'username', but does not need to be used in this fashion (hence the name 'nick').



## Options

   * _user_: spec for user entity type, default: {zone:null, base:'sys', name:'user'}. 
   * _login_: spec for login entity type, default: {zone:null, base:'sys', name:'login'}. 


## Entities

### User

The user entity has a default type of _-/sys/user_ and standard properties:

   * _nick_: username

You can add your own properties, but be careful not to use the standard property names.


### Login

The login entity has a default type of _-/sys/login_ and standard properties:

   * _token_: authentication token

You can add your own properties, but be careful not to use the standard property names.



## Actions

### role:user, cmd:login

Login an existing user. Creates a new sys_login entry.

#### Arguments:
   
   * _nick_: required if no email, identifies user
   * _email_: required if no nick, identifies user
   * _password_: password as entered by user
   * _auto_: automatic login without password, default: _false_. Use this to generate login tokens.

#### Provides:

Object with properties:

   * _ok_: true if login succeeded, false if not
   * _login_: login entity, includes login.token property
   * _user_: user entity


### role:user, cmd:entity

Provide an instance of the user or login entities. Used by other
plugins to get the right entity type for additional user operations.

#### Arguments:
   
   * _kind_: 'user' or 'login'

#### Provides:

Seneca entity object for user or login.






