'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify) {
    fastify.register(require('@fastify/jwt'), {
        secret: process.env.JWT_SECRET,
        decode: {
            complete: true
        },
        sign: {
            algorithm: 'HS512',
            expiresIn: '300s',
        }
    })
}, {
  name: 'jwt',
})