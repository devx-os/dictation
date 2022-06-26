'use strict'

const fp = require('fastify-plugin')
const {v4: uuidv4} = require("uuid");
const {createFilter, createProjection} = require("./utils");
const {createSort, createPagination, slugify} = require("../../utils/common");

/**
 * This plugins adds post functionality to the dictation core
 */
module.exports = fp(async function (dictation) {
  const postsColl = dictation.mongo.db.collection('post')

  dictation.get('/post', {
    schema: {
      tags: ['post'],
      // response: {
      //   200: {
      //     description: 'response and schema description',
      //     type: 'array',
      //   }
      // }
    }
  }, async function (request, reply) {
    const {posts} = await dictation.hooks.applyFilters('filter_posts', {
      pagination: createPagination(request.query),
      filters: createFilter(request.query),
      sort: createSort(request.query),
      projection: createProjection(request.query)
    })
    reply.send(posts)
  })

  dictation.post('/post', {
    schema: {
      tags: ['post'],
    }
  }, async function (request, reply) {
    const id = uuidv4()

    let postBody = {
      ...request.body,
      id,
      state: request.body.state || 'draft',
      meta: request.body.meta || {},
      slug: slugify(request.body.slug || request.body.title),
      lastEdit: {
        user: '',
        date: new Date()
      }
    }

    // trigger a post_validation filter
    try {
      const {body: bodyAfterValidation} = await dictation.hooks.applyFilters('save_post_validation', {id, body: postBody})
      postBody = bodyAfterValidation
    } catch (e) {
      return dictation.httpErrors.badRequest(e.message)
    }

    // trigger a pre_save  event
    dictation.hooks.doAction('pre_save_post', {id, body: postBody})

    const result = await postsColl.insertOne({...postBody})
    if (!result) {
      return dictation.httpErrors.badRequest()
    }

    // trigger a post created event
    dictation.hooks.doAction('save_post', {id, body: postBody})

    // return the post
    const {post} = await dictation.hooks.applyFilters('get_post', {id, projection: createProjection(request.query)})
    reply.send(post)
  })

  dictation.put('/post/:id', {
    schema: {
      tags: ['post'],
    }
  }, async function (request, reply) {
    const {id} = request.params

    let postBody = {
      ...request.body
    }

    const {post: oldPost} = await dictation.hooks.applyFilters('get_post', {id, projection: createProjection({fields: '*'})})

    // trigger a post_validation  event
    try {
      const {body: bodyAfterValidation} = await dictation.hooks.applyFilters('edit_post_validation', {id, body: postBody, old: oldPost})
      postBody = bodyAfterValidation
    } catch (e) {
      return dictation.httpErrors.badRequest(e.message)
    }

    // trigger a post updated event
    dictation.hooks.doAction('pre_edit_post', {id, body: postBody})

    const result = await postsColl.updateOne({id: id}, {$set: postBody})
    if (!result) {
      return dictation.httpErrors.badRequest()
    }

    // trigger a post updated event
    dictation.hooks.doAction('edit_post', {id, body: postBody})

    const {post} = await dictation.hooks.applyFilters('get_post', {id, projection: createProjection(request.query)})
    reply.send(post)
  })

  dictation.get('/post/:id', {
    schema: {
      tags: ['post'],
    }
  }, async function (request, reply) {
    const {id} = request.params
    const {post} = await dictation.hooks.applyFilters('get_post', {id, projection: createProjection(request.query)})
    reply.send(post)
  })

  dictation.delete('/post/:id', {
    schema: {
      tags: ['post'],
    }
  }, async function (request, reply) {
    const {id} = request.params
    const {post} = await dictation.hooks.applyFilters('get_post', {id, projection: {fields: '*'}})
    dictation.hooks.doAction('pre_delete_post', {id, post})
    await postsColl.deleteOne({id})
    dictation.hooks.doAction('delete_post', {id, post})
    reply.status(204).send()
  })

}, {})