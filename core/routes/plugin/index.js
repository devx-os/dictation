'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/available', async function (request, reply) {
    return fastify.hooks.applyFilters('registered-plugin', [])
  })
}
