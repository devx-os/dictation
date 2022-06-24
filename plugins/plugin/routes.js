'use strict'

const fp = require('fastify-plugin')
/**
 * This plugins adds post functionality to the dictation
 */
module.exports = fp(async function (dictation) {
  dictation.get('/plugin/available', {
    schema: {
      tags: ['plugin'],
    }
  },async function (request, reply) {
    return dictation.hooks.applyFilters('registered_plugin', [])
  })
}, {dependencies: ['dictation-hooks']})