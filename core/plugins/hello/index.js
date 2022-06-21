'use strict'

const fp = require('fastify-plugin')

/**
 * Hello plugin
 */
module.exports = fp(async function (dictation) {
  dictation.hooks.addFilter('registered-plugin', 'hello-plugin', (pluginList = []) => {
    pluginList.push({
      name: 'hello',
      version: '1.0.0',
      description: 'This is a hello plugin, add hello: "world" to a post detail'
    })
    return pluginList
  })

  dictation.hooks.addFilter('post', 'plugin-post', async (prevPromise) => {
    const [id, post] = await prevPromise
    return [id, {...post, hello: 'world'}]
  })

}, {dependencies: ['dictation-hooks']})
