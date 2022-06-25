'use strict'

const fp = require('fastify-plugin')
const {createFilter} = require("./utils");
const {isObject} = require("lodash");
const {slugify} = require("../../utils/common");

/**
 * This plugins adds post functionality to the dictation
 */
module.exports = fp(async function (dictation) {
  const postTypeColl = dictation.mongo.db.collection('postType')

  dictation.hooks.addFilter('registered_plugin', 'dictation', (pluginList = []) => {
    pluginList.push({
      name: 'postType',
      version: '1.0.0',
      description: 'This plugins adds postType functionality to the dictation'
    })
    return pluginList
  })

  dictation.hooks.addFilter('get_post_type', 'dictation', async (params) => {
    const {id = null} = await params
    const findCondition = {$or: [{id: id}, {slug: id}]}
    if (!id) {
      throw new Error(`id not sent`)
    }
    const postRes = await postTypeColl.findOne(findCondition)
    if (postRes) {
      return {id: postRes.id, postType: postRes}
    }
    throw new Error(`Post ${id} not found`)
  }, 1)

  dictation.hooks.addFilter('filter_post_types', 'dictation', async (params) => {
    const {filters = {}, pagination = {limit: 1000, page: 1}, sort = {_id: -1}} = await params
    let limit = pagination.limit
    let skip = pagination.limit * (pagination.page - 1)
    const totalCount = await postTypeColl.countDocuments(filters)
    const postRes = await postTypeColl.find(filters).skip(skip).limit(limit).sort(sort).toArray()
    return {
      postTypes: {
        data: postRes,
        pagination: {...pagination, total: totalCount},
        sort
      },
      filters,
      pagination,
      sort
    }
  }, 1)

  dictation.hooks.addFilter('edit_post_type_validation', 'dictation', async (params) => {
    const {id = null, old = {}, body = {}} = await params

    // check slug duplicates if slug had changed
    if (body.slug && body.slug !== old.slug) {
      const {postTypes: slugDuplicate} = await dictation.hooks.applyFilters('filter_post_types', {filters: createFilter({slug: body.slug})})
      if (slugDuplicate.pagination.total > 0) {
        throw new Error('Slug already exists')
      }
    }
    return {id, old, body}
  },1)

  dictation.hooks.addFilter('save_post_type_validation', 'dictation', async (params) => {
    const {id = null, body = {}} = await params

    // check slug duplicates
    if (body.slug) {
      const {postTypes: slugDuplicate} = await dictation.hooks.applyFilters('filter_post_types', {filters: createFilter({slug: body.slug})})
      if (slugDuplicate.pagination.total > 0) {
        throw new Error('Slug already exists')
      }
    }
    return {id, body}
  },1)


  // validate `type` when insert or update a post
  const postTypeValidationInPost = async (params) => {
    const {id = null, old = {}, body = {}} = await params
    if(body.type) {
      if(!isObject(body.type)) throw new Error('post.type must be an object')
      if(!body.type.title && !body.type.slug) throw new Error('post.type must have a slug or a title')
      body.type.slug = slugify(body.type.slug || body.type.title)
    }
    return {id, old, body}
  }

  dictation.hooks.addFilter('edit_post_validation', 'dictation', postTypeValidationInPost)
  dictation.hooks.addFilter('save_post_validation', 'dictation', postTypeValidationInPost)

  dictation.register(require('./routes'))

}, {dependencies: ['dictation-hooks']})
