'use strict'

const {v4: uuidv4} = require("uuid");
module.exports = async function (fastify, opts) {
  fastify.get('', async function (request, reply) {
    const [posts] = await fastify.hooks.applyFilters('all-posts', [], {})
    return posts
  })

  fastify.get('/:id', async function (request, reply) {
    const [, post] = await fastify.hooks.applyFilters('post', request.params.id)
    return post
  })

  fastify.post('', async function (request, reply) {
    const id = uuidv4()
    const postsColl = fastify.mongo.db.collection('posts')
    const postBody = {...request.body, id, state: 'draft'}
    const result = await postsColl.insertOne({...postBody})
    await fastify.hooks.doAction('save-post', id, postBody)
    if (!result) {
      return fastify.httpErrors.badRequest()
    }
    return fastify.hooks.applyFilters('post', id)
  })

  fastify.put('/:id', async function (request, reply) {
    const postsColl = dictation.mongo.db.collection('posts')
    return fastify.hooks.doAction('save-post', request.params.id, request.body)
  })
}
