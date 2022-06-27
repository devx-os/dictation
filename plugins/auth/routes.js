'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (dictation) {
    dictation.post('/signin', {
        schema: {
          tags: ['auth'],
        }
      }, async function (request, reply) {
        const token = await dictation.hooks.applyFilters('signin', request.body)
        reply.send(token)
      })

      dictation.post('/create-user', {
        onRequest: [dictation.isAdmin],
        schema: {
          tags: ['auth'],
        }
      }, async function (request, reply) {
        const token = await dictation.hooks.applyFilters('create-user', request.body)
        reply.send(token)
      })
})