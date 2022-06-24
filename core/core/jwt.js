'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify) {
    fastify.register(require('@fastify/jwt'), {
        secret: process.env.JWT_SECRET
    })

    fastify.decorate('authenticate', async function(request, reply) {
        await request.jwtVerify()
    })
}, {
  name: 'jwt',
})
