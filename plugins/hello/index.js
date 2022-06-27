'use strict'

const fp = require('fastify-plugin')

/**
 * Hello plugin
 */
module.exports = fp(async function (dictation) {
  dictation.hooks.addFilter('registered_plugin', 'hello-plugin', (pluginList = []) => {
    pluginList.push({
      name: 'hello',
      version: '1.0.0',
      description: 'This is a hello plugin, add hello: "world" to a post detail'
    })
    return pluginList
  })

  // dictation.hooks.addFilter('get_post', 'hello-plugin', async (params) => {
  //   const {id, post = {}} = await params
  //   return {id, post: {...post, hello: 'world'}}
  // })

}, {dependencies: ['dictation-hooks']})
