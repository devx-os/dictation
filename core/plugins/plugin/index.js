'use strict'

const fp = require('fastify-plugin')

/**
 * This plugins adds post functionality to the dictation
 */
module.exports = fp(async function (dictation) {
  dictation.register(require('./routes'))
}, {dependencies: ['dictation-hooks']})
