# @seneca/user


Next version of seneca-user - work in progress!



<!--START:action-list-->


## Action Patterns

* [adjust:user,sys:user](#-adjustusersysuser-)
* [change:pass,sys:user](#-changepasssysuser-)
* [change:password,sys:user](#-changepasswordsysuser-)
* [check:verify,sys:user](#-checkverifysysuser-)
* [cmd:encrypt,hook:password,sys:user](#-cmdencrypthookpasswordsysuser-)
* [cmd:pass,hook:password,sys:user](#-cmdpasshookpasswordsysuser-)
* [get:user,sys:user](#-getusersysuser-)
* [list:login,sys:user](#-listloginsysuser-)
* [list:verify,sys:user](#-listverifysysuser-)
* [login:user,sys:user](#-loginusersysuser-)
* [logout:user,sys:user](#-logoutusersysuser-)
* [make:verify,sys:user](#-makeverifysysuser-)
* [register:user,sys:user](#-registerusersysuser-)


<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions

### &laquo; `adjust:user,sys:user` &raquo;

Adjust user status idempotently (activated, etc.).


#### Parameters


* _active_ : boolean <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user found',
  user: 'user entity'
}
```


----------
### &laquo; `change:pass,sys:user` &raquo;

No description provided.



----------
### &laquo; `change:password,sys:user` &raquo;

No description provided.



----------
### &laquo; `check:verify,sys:user` &raquo;

No description provided.



----------
### &laquo; `cmd:encrypt,hook:password,sys:user` &raquo;

Encrypt a plain text password string.




#### Examples



* `cmd:encrypt,hook:password,sys:user,pass:foofoobarbar`
  * Result: {ok:true, pass:_encrypted-string_, salt:_string_}
#### Parameters


* _salt_ : string <i><small>{presence:optional}</small></i>
* _pass_ : string <i><small>{presence:optional}</small></i>
* _password_ : string <i><small>{presence:optional}</small></i>
* _rounds_ : number <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if encryption succeeded',
  pass: 'encrypted password string',
  salt: 'salt value string'
}
```


----------
### &laquo; `cmd:pass,hook:password,sys:user` &raquo;

No description provided.



----------
### &laquo; `get:user,sys:user` &raquo;

Get user details


#### Parameters


* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user found',
  user: 'user entity'
}
```


----------
### &laquo; `list:login,sys:user` &raquo;

No description provided.



----------
### &laquo; `list:verify,sys:user` &raquo;

Create a verification entry (multiple use cases).


#### Parameters


* _kind_ : string
* _code_ : string <i><small>{presence:optional}</small></i>
* _once_ : boolean <i><small>{presence:optional}</small></i>
* _valid_ : boolean <i><small>{presence:optional}</small></i>
* _custom_ : object <i><small>{presence:optional}</small></i>
* _expire_point_ : number <i><small>{presence:optional}</small></i>
* _expire_duration_ : number <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user found',
  verify: 'verify entity'
}
```


----------
### &laquo; `login:user,sys:user` &raquo;

No description provided.



----------
### &laquo; `logout:user,sys:user` &raquo;

No description provided.



----------
### &laquo; `make:verify,sys:user` &raquo;

Create a verification entry (multiple use cases).


#### Parameters


* _kind_ : string
* _code_ : string <i><small>{presence:optional}</small></i>
* _once_ : boolean <i><small>{presence:optional}</small></i>
* _valid_ : boolean <i><small>{presence:optional}</small></i>
* _custom_ : object <i><small>{presence:optional}</small></i>
* _expire_point_ : number <i><small>{presence:optional}</small></i>
* _expire_duration_ : number <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
* _user_id_ : string <i><small>{presence:optional}</small></i>
* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:optional}</small></i>
* _fields_ : array <i><small>{presence:optional}</small></i>




#### Replies With


```
{
  ok: '_true_ if user found',
  verify: 'verify entity'
}
```


----------
### &laquo; `register:user,sys:user` &raquo;

Register a new user


#### Parameters


* _email_ : string <i><small>{presence:optional}</small></i>
* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _user_ : object <i><small>{unknown:true}</small></i>




#### Replies With


```
{
  ok: '_true_ if user registration succeeded',
  user: 'user entity'
}
```


----------


<!--END:action-desc-->

