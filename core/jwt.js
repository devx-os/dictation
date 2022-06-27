'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify) {
    fastify.register(require('@fastify/jwt'), {
        secret: process.env.JWT_SECRET
    })

    fastify.decorate('authenticate', async function(request, reply) {
        await request.jwtVerify()
    })

    fastify.decorate('isAdmin', async function(request, reply) {
        await request.jwtVerify()
        if(request.user.roles.includes('admin')) {
            return true
        } else {
            return false
        }
    })

}, {
  name: 'jwt',
})