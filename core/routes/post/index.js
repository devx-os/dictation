'use strict'

const {v4: uuidv4} = require("uuid");
module.exports = async function (fastify, opts) {
  fastify.get('', async function (request, reply) {
    const {posts} = await fastify.hooks.applyFilters('all-posts', {})
    return posts
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
    const {post} = await fastify.hooks.applyFilters('post', {id})
    return post
  })

  fastify.put('/:id', async function (request, reply) {
    const postsColl = fastify.mongo.db.collection('posts')
    const postBody = {...request.body}
    const {id} = request.params
    const result = await postsColl.updateOne({id: id}, {$set: postBody})
    await fastify.hooks.doAction('save-post', id, postBody)
    if (!result) {
      return fastify.httpErrors.badRequest()
    }
    const {post} = await fastify.hooks.applyFilters('post', {id})
    return post
  })

  fastify.get('/:id', async function (request, reply) {
    const {id} = request.params
    const {post} = await fastify.hooks.applyFilters('post', {id})
    return post
  })

  fastify.delete('/:id', async function (request, reply) {
    const {id} = request.params
    const postsColl = fastify.mongo.db.collection('posts')
    await postsColl.deleteOne({id})
    reply.status(204).send()
  })
}
