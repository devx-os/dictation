'use strict'

const fp = require('fastify-plugin')
const {v4: uuidv4} = require("uuid");
/**
 * This plugins adds post functionality to the dictation
 */
module.exports = fp(async function (dictation) {
  dictation.get('/plugin/available', async function (request, reply) {
    return dictation.hooks.applyFilters('registered-plugin', [])
  })
}, {dependencies: ['dictation-hooks']})