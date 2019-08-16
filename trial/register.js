const Seneca = require('seneca')

Seneca({legacy:{transport:false}})
  .test()
  .use('entity')
  .use('doc')
  .use('..')
  .act('sys:user,cmd:register', {user:{email:'a@example.com'}}, Seneca.util.print)
  .act('sys:user,cmd:register', {user:{email:'b@example.com'}}, Seneca.util.print)
  .act('sys:user,cmd:register', {user:{email:'c@example.com'}}, Seneca.util.print)
  .ready(function() {
    this.close()
  })

