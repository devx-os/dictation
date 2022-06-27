'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify) {

    fastify.setErrorHandler(async function (error, request, reply) {
        // Log error
        fastify.log.error(error)
        // Send error response
        reply.status(error.statusCode).send({ message: error.message })
    })

    fastify.decorate('error', function(data) {
        let err = new Error()
        err.statusCode = data.statusCode
        err.message = data.message
        return err
    })

}, {
  name: 'errorHandler',
})