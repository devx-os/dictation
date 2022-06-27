'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, /*opts*/) {
  const swaggerOpts = {
    routePrefix: '/documentation',
    swagger: {
      info: {
        title: 'Dictation',
        description: 'Fast, simple e pluggable headless CMS',
        version: '1.0.0'
      },
      externalDocs: {
        url: 'https://swagger.io',
        description: 'Find more info here'
      },
      host: 'localhost:3000',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        {name: 'plugin', description: 'Manage all the plugins'},
        {name: 'post', description: 'Posts related end-points'}
      ],
      definitions: {
      },
      securityDefinitions: {
        apiKey: {
          type: 'apiKey',
          name: 'apiKey',
          in: 'header'
        }
      }
    },
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next()
      },
      preHandler: function (request, reply, next) {
        next()
      }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    exposeRoute: true
  }
  fastify.register(require('@fastify/swagger'), swaggerOpts)
}, {name: 'swagger'})
