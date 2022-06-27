'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (dictation) {
  dictation.post('/signin', {
    schema: {
      tags: ['auth'],
    }
  }, async function (request, reply) {
    const {token} = await dictation.hooks.applyFilters('sign_in', request.body)
    reply.send({token})
  })

  dictation.post('/create-user', {
    onRequest: [dictation.isAdmin],
    schema: {
      tags: ['auth'],
    }
  }, async function (request, reply) {
    await dictation.hooks.applyFilters('create_user', request.body)
    reply.send({message: 'User created'})
  })
})