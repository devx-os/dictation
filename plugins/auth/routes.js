'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (dictation) {
  dictation.post('/signin', {
    schema: {
      tags: ['auth'],
    }
  }, async function (request, reply) {
    dictation.hooks.doAction('before_sign_in', request.body)
    const user = await dictation.hooks.applyFilters('sign_in', request.body)
    dictation.hooks.doAction('after_sign_in', user)
    reply.send({token: user.token})
  })

  dictation.post('/create-user', {
    onRequest: [dictation.isAdmin],
    schema: {
      tags: ['auth'],
    }
  }, async function (request, reply) {
    dictation.hooks.doAction('before_create_user', request.body)
    const user = await dictation.hooks.applyFilters('create_user', request.body)
    dictation.hooks.doAction('after_create_user', user)
    reply.send({message: 'User created'})
  })
})