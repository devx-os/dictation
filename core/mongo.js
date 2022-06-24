'use strict'

const fp = require('fastify-plugin')
module.exports = fp(async function (fastify, opts) {
  fastify.register(require('@fastify/mongodb'), {
    // force to close the mongodb connection when app stopped
    // the default value is false
    forceClose: true,
    url: process.env.MONGO_CONNECTION_STRING
  })
}, {
  fastify: '>=3.0.0',
  name: 'mongo'
})
