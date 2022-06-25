'use strict'

const fp = require('fastify-plugin')
const {v4: uuidv4} = require("uuid");
const {createFilter} = require("./utils");
const {createPagination, createSort, slugify} = require("../../utils/common");

/**
 * This plugins adds post functionality to the dictation core
 */
module.exports = fp(async function (dictation) {
  const postTypesColl = dictation.mongo.db.collection('postType')

  dictation.get('/post-type', {
    schema: {
      tags: ['postType'],
      // response: {
      //   200: {
      //     description: 'response and schema description',
      //     type: 'array',
      //   }
      // }
    }
  }, async function (request, reply) {
    const {postTypes} = await dictation.hooks.applyFilters('filter_post_types', {
      pagination: createPagination(request.query),
      filters: createFilter(request.query),
      sort: createSort(request.query)
    })
    reply.send(postTypes)
  })

  dictation.post('/post-type', {
    schema: {
      tags: ['postType'],
    }
  }, async function (request, reply) {
    const id = uuidv4()

    const postBody = {
      ...request.body,
      id,
      slug: slugify(request.body.slug || request.body.title),
    }

    // trigger a post_validation filter
    try {
      await dictation.hooks.applyFilters('save_post_type_validation', {id, body: postBody})
    } catch (e) {
      return dictation.httpErrors.badRequest(e.message)
    }

    // trigger a pre_save  event
    dictation.hooks.doAction('pre_save_post_type', {id, postType: postBody})

    const result = await postTypesColl.insertOne({...postBody})
    if (!result) {
      return dictation.httpErrors.badRequest()
    }

    // trigger a post created event
    dictation.hooks.doAction('save_post_type', {id, postType: postBody})

    // return the post
    const {postType} = await dictation.hooks.applyFilters('get_post_type', {id})
    reply.send(postType)
  })

  dictation.put('/post-type/:id', {
    schema: {
      tags: ['postType'],
    }
  }, async function (request, reply) {
    const {id} = request.params
    const slug = request.body.slug ? slugify(request.body.slug) : null

    const postBody = {
      ...request.body,
    }
    if (slug) {
      postBody.slug = slug
    }

    const {postType: oldPostType} = await dictation.hooks.applyFilters('get_post_type', {id})

    // trigger a post_validation  event
    try {
      await dictation.hooks.applyFilters('edit_post_type_validation', {id, body: postBody, old: oldPostType})
    } catch (e) {
      return dictation.httpErrors.badRequest(e.message)
    }

    // trigger a post updated event
    dictation.hooks.doAction('pre_edit_post_type', {id, postType: postBody})

    const result = await postTypesColl.updateOne({id: id}, {$set: postBody})
    if (!result) {
      return dictation.httpErrors.badRequest()
    }

    // trigger a post updated event
    dictation.hooks.doAction('edit_post_type', {id, postType: postBody})

    const {postType} = await dictation.hooks.applyFilters('get_post_type', {id})
    reply.send(postType)
  })

  dictation.get('/post-type/:id', {
    schema: {
      tags: ['postType'],
    }
  }, async function (request, reply) {
    const {id} = request.params
    const {postType} = await dictation.hooks.applyFilters('get_post_type', {id})
    reply.send(postType)
  })

  dictation.delete('/post-type/:id', {
    schema: {
      tags: ['postType'],
    }
  }, async function (request, reply) {
    const {id} = request.params
    const {postType} = await dictation.hooks.applyFilters('get_post_type', {id})
    dictation.hooks.doAction('pre_delete_post_type', {id, postType})
    await postTypesColl.deleteOne({id})
    dictation.hooks.doAction('delete_post_type', {id, postType})
    reply.status(204).send()
  })

}, {})