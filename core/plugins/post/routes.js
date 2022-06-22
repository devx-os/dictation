'use strict'

const fp = require('fastify-plugin')
const {v4: uuidv4} = require("uuid");

// create a filter function to match query params of an url in mongo db with $and and $or condition
const createFilter = (query) => {
  const filter = {}
  if (query.q) {
    filter.$or = [{title: {$regex: query.q, $options: 'i'}}, {content: {$regex: query.q, $options: 'i'}}]
  }

  if (query.category) {
    filter.category = {$in: query.category.split(',')}
  }

  if (query.tag) {
    filter.tags = {$in: query.tag.split(',')}
  }

  if (query.author) {
    filter.author = query.author
  }

  if (query.state) {
    filter.state = query.state
  }

  return filter
}

/**
 * This plugins adds post functionality to the dictation
 */
module.exports = fp(async function (dictation) {

  // create a GET method for filter post by query params
  dictation.get('/posts', async function (request, reply) {
    const postRes = await dictation.mongo.db.collection('posts').find(request.query).toArray()
    return {posts: postRes, filters}
  })

  dictation.get('/post', async function (request, reply) {
    const {posts} = await dictation.hooks.applyFilters('posts', {})
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