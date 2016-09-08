var seneca = require('seneca')()
seneca.use(require('seneca-basic'))
seneca.use(require('seneca-entity'))
seneca.use(require('seneca-user'))

seneca.ready((msg, done) => {
  seneca.act({role: 'user', cmd: 'register', name: "Flann O'Brien", email: 'nincompoop@deselby.com', password: 'blackair'},
   (msg, done) => {
     if (msg) {
       console.log('err: ', msg)
       return
     }
     seneca.act({role: 'user', cmd: 'login', email: 'nincompoop@deselby.com', password: 'bicycle'}, (msg, done) => {
       if (msg) {
         console.log('err: ', msg)
         return
       }
       console.log('login success: ' + done.ok)

       seneca.act({role: 'user', cmd: 'login', email: 'nincompoop@deselby.com', password: 'blackair'}, (msg, done) => {
         if (msg) {
           console.log('err: ', msg)
           return
         }
         console.log('login success: ' + done.ok)
         console.log('login instance: ' + done.login)
       })
     })
   })
})
