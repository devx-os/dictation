'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (dictation) {
  dictation.get('/user-info', {
    onRequest: [dictation.authenticate],
    schema: {
      tags: ['auth'],
    }
  }, async function (request, reply) {
    reply.send({ ...request.user })
  })
  dictation.post('/sign-in', {
    schema: {
      tags: ['auth'],
    }
  }, async function (request, reply) {
    dictation.hooks.doAction('before_sign_in', request.body)
    const token = await dictation.hooks.applyFilters('sign_in', request.body)
    dictation.hooks.doAction('after_sign_in', token)
    reply.send({ token: token.token, refreshToken: token.refreshToken })
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

  dictation.post('/refresh-token', {
    schema: {
      tags: ['auth'],
    }
  }, async function (request, reply) {
    dictation.hooks.doAction('before_refresh_token', request.body)
    const refreshToken = await dictation.hooks.applyFilters('refresh_token', request.body)
    dictation.hooks.doAction('after_refresh_token', refreshToken)
    reply.send({ token: refreshToken.token, refreshToken: refreshToken.newRefreshToken })
  })
})