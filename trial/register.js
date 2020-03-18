const Seneca = require('seneca')

Seneca({legacy:{transport:false}})
  .test()
  .use('promisify')
  .use('entity')
  .use('doc')
  .use('..')
  .act('sys:user,register:user', {user:{email:'a@example.com'}}, Seneca.util.print)
  .act('sys:user,register:user', {user:{email:'b@example.com'}}, Seneca.util.print)
  .act('sys:user,register:user', {user:{email:'c@example.com'}}, Seneca.util.print)
  .ready(function() {
    this.close()
  })

