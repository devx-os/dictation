'use strict'

const fp = require('fastify-plugin')
const {v4: uuidv4} = require("uuid");
const {createPagination, createFilter} = require("./utils");

/**
 * This plugins adds post functionality to the dictation
 */
module.exports = fp(async function (dictation) {

  dictation.get('/post', async function (request, reply) {
    const {posts} = await dictation.hooks.applyFilters('posts', {pagination: createPagination(request.query), filters: createFilter(request.query)})
    return posts
  })

  dictation.post('/post', async function (request, reply) {
    const id = uuidv4()
    const postsColl = dictation.mongo.db.collection('posts')
    const postBody = {...request.body, id, state: 'draft'}
    const result = await postsColl.insertOne({...postBody})
    if (!result) {
      return dictation.httpErrors.badRequest()
    }
    dictation.hooks.doAction('save-post', {id, post: postBody})
    const {post} = await dictation.hooks.applyFilters('post', {id})
    return post
  })

  dictation.put('/post/:id', async function (request, reply) {
    const postsColl = dictation.mongo.db.collection('posts')
    const postBody = {...request.body}
    const {id} = request.params
    const result = await postsColl.updateOne({id: id}, {$set: postBody})
    if (!result) {
      return dictation.httpErrors.badRequest()
    }
    dictation.hooks.doAction('save-post', {id, post: postBody})
    const {post} = await dictation.hooks.applyFilters('post', {id})
    return post
  })

  dictation.get('/post/:id', async function (request, reply) {
    const {id} = request.params
    const {post} = await dictation.hooks.applyFilters('post', {id})
    return post
  })

  dictation.delete('/post/:id', async function (request, reply) {
    const {id} = request.params
    const postsColl = dictation.mongo.db.collection('posts')
    await postsColl.deleteOne({id})
    reply.status(204).send()
  })
}, {dependencies: ['dictation-hooks']})