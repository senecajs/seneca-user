# @seneca/user


Next version of seneca-user - work in progress!



<!--START:action-list-->


## Action Patterns

* [cmd:encrypt,hook:password,sys:user](#-cmdencrypthookpasswordsysuser-)
* [get:user,sys:user](#-getusersysuser-)
* [register:user,sys:user](#-registerusersysuser-)


<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions

### &laquo; `cmd:encrypt,hook:password,sys:user` &raquo;

Encrypt a plain text password string.




#### Examples



* `cmd:encrypt,hook:password,sys:user,password:foo,repeat:foo`
  * Result: {ok:true, pass:_encrypted-string_, salt:_string_}



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


* _handle_ : string <i><small>{presence:optional}</small></i>
* _nick_ : string <i><small>{presence:optional}</small></i>
* _q_ : object <i><small>{presence:required}</small></i>




#### Replies With


```
{
  ok: '_true_ if user found',
  user: 'user entity'
}
```


----------
### &laquo; `register:user,sys:user` &raquo;

No description provided.



----------


<!--END:action-desc-->

