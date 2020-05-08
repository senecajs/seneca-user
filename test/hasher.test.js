const Code = require('@hapi/code')
const Lab = require('@hapi/lab')

const SenecaMsgTest = require('seneca-msg-test')
const Seneca = require('seneca')

var expect = Code.expect
var lab = (exports.lab = Lab.script())

var Hasher = require('../lib/hasher')

lab.test('happy-test', async () => {
  var seneca = Seneca().test()
  return new Promise((resolve) => {
    Hasher(seneca, { src: 'foo', test: true }, function (err, out) {
      expect(err).not.exists()
      expect(out.hash).string()
      seneca.close(resolve)
    })
  })
})

lab.test('happy-real', { timeout: 5555 }, async () => {
  var seneca = Seneca().test()
  return new Promise((resolve) => {
    setTimeout(function () {
      Hasher(seneca, { src: 'foo', interval: 1111 }, function (err, out1) {
        //console.log('AAA',err,out1)
        expect(err).not.exists()
        expect(out1.hash).string()

        Hasher(seneca, { src: 'bar', interval: 1111 }, function (err, out2) {
          //console.log('BBB',err,out2)
          expect(err).not.exists()
          expect(out1.hash).string()
          expect(out1.hash).not.equal(out2.has)
          seneca.close(resolve)
        })
      })
    }, 555)
  })
})

lab.test('close', async () => {
  Hasher.close()
})

lab.test('accept_msg', async () => {
  await Hasher.accept_msg({ src: 'foo', rounds: 1 })

  try {
    await Hasher.accept_msg({ src: 'foo', rounds: 0 })
    Code.fail()
  } catch (e) {
    expect(e.details[0].type).equal('number.min')
  }

  try {
    await Hasher.accept_msg({ test: false, src: 'foo', rounds: 0 })
    Code.fail()
  } catch (e) {
    expect(e).exist()
  }
})

lab.test('prepare_close', async () => {
  var seneca = Seneca().test()
  expect(Hasher.prepare_close(false, seneca)).true()
  expect(Hasher.prepare_close(true, seneca)).true()
})

lab.test('clean_waiting', async () => {
  var waiting = { a: { when: Date.now() }, b: { when: Date.now() - 222 } }
  Hasher.make_clean_waiting(waiting, 111)()
  expect(Object.keys(waiting)).equal(['a'])
})

lab.test('handle_exit', async () => {
  var seneca = Seneca().test()
  Hasher.make_handle_exit(seneca)()
  Hasher.make_handle_exit(seneca, {})()
})

lab.test('handle_message', async () => {
  Hasher.make_handle_message({})({})
  Hasher.make_handle_message({})({ id: 1 })
  Hasher.make_handle_message({
    2: function (err, out) {
      expect(err).not.exists()
      expect(out.hash).equals('h0')
    },
  })({ id: 2, hash: 'h0' })
})
