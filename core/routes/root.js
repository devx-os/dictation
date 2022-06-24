'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/', {
    onRequest: [fastify.authenticate]
  }, async function (request, reply) {
    return { root: true }
  })
}
