'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify) {
    fastify.register(require('@fastify/jwt'), {
        secret: process.env.JWT_SECRET
    })
}, {
  name: 'jwt',
})