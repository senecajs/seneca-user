module.exports = function senecaUse(seneca) {
  if (seneca.version >= '3.0.0') {
    seneca.use(require('seneca-basic'))
  }
  if (seneca.version >= '2.0.0') {
    seneca.use(require('seneca-entity'))
  }
}
