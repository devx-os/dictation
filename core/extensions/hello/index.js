'use strict'

const fp = require('fastify-plugin')

/**
 * This plugins adds some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
module.exports = fp(async function (dictation) {
  dictation.hooks.addFilter('registered-plugin', 'hello-plugin',  (pluginList = []) => {
    pluginList.push({
      name: 'hello',
      version: '1.0.0',
      description: 'This is a hello plugin'
    })
    return pluginList
  })

}, {dependencies: ['dictation-hooks']})
