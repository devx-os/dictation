'use strict'

const fp = require('fastify-plugin')
const {v4: uuidv4} = require("uuid");
const {createPagination, createFilter, slugify, createSort} = require("./utils");

/**
 * This plugins adds post functionality to the dictation
 */
module.exports = fp(async function (dictation) {

  dictation.get('/post', async function (request, reply) {
    const {posts} = await dictation.hooks.applyFilters('filter_posts', {
      pagination: createPagination(request.query),
      filters: createFilter(request.query),
      sort: createSort(request.query)
    })
    return posts
  })

  dictation.post('/post', async function (request, reply) {
    const id = uuidv4()
    const postsColl = dictation.mongo.db.collection('posts')
    const postBody = {
      ...request.body,
      id,
      type: request.body.type || 'post',
      state: request.body.state || 'draft',
      slug: slugify(request.body.slug || request.body.title)
    }

    // trigger a post_validation filter
    try {
      await dictation.hooks.applyFilters('save_post_validation', {id, body: postBody})
    } catch (e) {
      return dictation.httpErrors.badRequest(e.message)
    }

    // trigger a pre_save  event
    dictation.hooks.doAction('pre_save_post', {id, post: postBody})

    const result = await postsColl.insertOne({...postBody})
    if (!result) {
      return dictation.httpErrors.badRequest()
    }

    // trigger a post created event
    dictation.hooks.doAction('save_post', {id, post: postBody})

    // return the post
    const {post} = await dictation.hooks.applyFilters('get_post', {id})
    return post
  })

  dictation.put('/post/:id', async function (request, reply) {
    const postsColl = dictation.mongo.db.collection('posts')
    const {id} = request.params
    const slug = request.body.slug ? slugify(request.body.slug) : null

    const postBody = {...request.body}
    if(slug){
      postBody.slug = slug
    }

    const {post: oldPost} = await dictation.hooks.applyFilters('get_post', {id})

    // trigger a post_validation  event
    try {
      await dictation.hooks.applyFilters('edit_post_validation', {id, body: postBody, old: oldPost})
    } catch (e) {
      return dictation.httpErrors.badRequest(e.message)
    }

    // trigger a post updated event
    dictation.hooks.doAction('pre_edit_post', {id, post: postBody})

    const result = await postsColl.updateOne({id: id}, {$set: postBody})
    if (!result) {
      return dictation.httpErrors.badRequest()
    }

    // trigger a post updated event
    dictation.hooks.doAction('edit_post', {id, post: postBody})

    const {post} = await dictation.hooks.applyFilters('get_post', {id})
    return post
  })

  dictation.get('/post/:id', async function (request, reply) {
    const {id} = request.params
    const {post} = await dictation.hooks.applyFilters('get_post', {id})
    return post
  })

  dictation.delete('/post/:id', async function (request, reply) {
    const {id} = request.params
    const postsColl = dictation.mongo.db.collection('posts')
    await postsColl.deleteOne({id})
    reply.status(204).send()
  })
}, {dependencies: ['dictation-hooks']})