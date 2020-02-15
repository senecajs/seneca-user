# @seneca/user


Next version of seneca-user - work in progress!



<!--START:action-list-->


## Action Patterns

* [adjust:user,sys:user](#-adjustusersysuser-)
* [cmd:encrypt,hook:password,sys:user](#-cmdencrypthookpasswordsysuser-)
* [get:user,sys:user](#-getusersysuser-)
* [register:user,sys:user](#-registerusersysuser-)


<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions

### &laquo; `adjust:user,sys:user` &raquo;

Adjust user status idempotently (activated, etc.).


#### Parameters


* _active_ : boolean <i><small>{presence:optional}</small></i>
* _id_ : string <i><small>{presence:optional}</small></i>
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
### &laquo; `get:user,sys:user` &raquo;

Get user details


#### Parameters


* _id_ : string <i><small>{presence:optional}</small></i>
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

