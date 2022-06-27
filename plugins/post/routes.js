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
    onRequest: [dictation.canEdit],
    schema: {
      tags: ['post'],
    }
  }, async function (request, reply) {
    let postBody = {...request.body}
    const id = postBody.id || uuidv4()
    // trigger a post_validation filter
    try {
      const {body: bodyAfterValidation} = await dictation.hooks.applyFilters('save_post_validation', {
        id,
        body: postBody
      })
      postBody = bodyAfterValidation
    } catch (e) {
      return dictation.httpErrors.badRequest(e.message)
    }

    // trigger a pre_save  event
    dictation.hooks.doAction('pre_save_post', {id, body: {...postBody}})

    const result = await postsColl.insertOne({...postBody})
    if (!result) {
      return dictation.httpErrors.badRequest()
    }

    // trigger a post created event
    dictation.hooks.doAction('save_post', {id, body: {...postBody}})

    // return the post
    const {post} = await dictation.hooks.applyFilters('get_post', {id, projection: createProjection(request.query)})
    reply.send(post)
  })

  dictation.put('/post/:id', {
    onRequest: [dictation.canEdit],
    schema: {
      tags: ['post'],
    }
  }, async function (request, reply) {
    const {id} = request.params
    const updateCondition = {$or: [{id: id}, {slug: id}]}

    let postBody = {
      ...request.body
    }

    const {post: oldPost} = await dictation.hooks.applyFilters('get_post', {
      id,
      projection: createProjection({fields: '*'})
    })

    // trigger a post_validation  event
    try {
      const {body: bodyAfterValidation} = await dictation.hooks.applyFilters('edit_post_validation', {
        id,
        body: postBody,
        old: oldPost
      })
      postBody = bodyAfterValidation
    } catch (e) {
      return dictation.httpErrors.badRequest(e.message)
    }

    // trigger a post updated event
    dictation.hooks.doAction('pre_edit_post', {id, body: {...postBody}})

    const result = await postsColl.updateOne(updateCondition, {$set: postBody})
    if (!result) {
      return dictation.httpErrors.badRequest()
    }

    // trigger a post updated event
    dictation.hooks.doAction('edit_post', {id, body: {...postBody}})

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
    onRequest: [dictation.canEdit],
    schema: {
      tags: ['post'],
    }
  }, async function (request, reply) {
    const {id} = request.params
    const deleteCondition = {$or: [{id: id}, {slug: id}]}
    const {post} = await dictation.hooks.applyFilters('get_post', {id})
    dictation.hooks.doAction('pre_delete_post', {id, post})
    await postsColl.deleteOne(deleteCondition)
    dictation.hooks.doAction('delete_post', {id, post})
    reply.status(204).send()
  })

}, {})