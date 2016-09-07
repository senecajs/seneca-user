var seneca = require('seneca')()
seneca.use(require('seneca-basic'))
seneca.use(require('seneca-entity'))
seneca.use(require('seneca-user'))

seneca.ready(() => {
  seneca.act({role: 'user', cmd: 'register', name: "Flann O'Brien", email: 'nincompoop@deselby.com', password: 'blackair'},
  function (err, out) {
    if (err) {
      console.log('err: ', err)
      return
    }
    seneca.act({role: 'user', cmd: 'login', email: 'nincompoop@deselby.com', password: 'bicycle'}, function (err, out) {
      if (err) {
        console.log('err: ', err)
        return
      }
      console.log('login success: ' + out.ok)

      seneca.act({role: 'user', cmd: 'login', email: 'nincompoop@deselby.com', password: 'blackair'}, function (err, out) {
        if (err) {
          console.log('err: ', err)
          return
        }
        console.log('login success: ' + out.ok)
        console.log('login instance: ' + out.login)
      })
    })
  })
})
