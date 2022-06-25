'use strict'

const fp = require('fastify-plugin')
const {createFilter, createProjection} = require("./utils");
/**
 * This plugins adds post functionality to the dictation
 */
module.exports = fp(async function (dictation) {
  const postsColl = dictation.mongo.db.collection('post')

  dictation.hooks.addFilter('registered_plugin', 'dictation', (pluginList = []) => {
    pluginList.push({
      name: 'post',
      version: '1.0.0',
      description: 'This plugins adds post functionality to the dictation'
    })
    return pluginList
  })

  dictation.hooks.addFilter('get_post', 'dictation', async (params) => {
    const {id = null, projection = createProjection()} = await params
    const findCondition = {$or: [{id: id}, {slug: id}]}
    if (!id) {
      throw new Error(`id not sent`)
    }
    const postRes = await postsColl.findOne(findCondition, projection)
    if (postRes) {
      return {id: postRes.id, post: postRes}
    }
    throw new Error(`Post ${id} not found`)
  }, 1)

  dictation.hooks.addFilter('filter_posts', 'dictation', async (params) => {
    const {filters = {}, projection = createProjection(), pagination = {limit: 1000, page: 1}, sort = {_id: -1}} = await params
    console.log(projection)
    let limit = pagination.limit
    let skip = pagination.limit * (pagination.page - 1)
    const totalCount = await postsColl.countDocuments(filters)
    const postRes = await postsColl.find(filters).skip(skip).limit(limit).sort(sort).project(projection).toArray()
    return {
      posts: {
        data: postRes,
        pagination: {...pagination, total: totalCount},
        sort
      },
      filters,
      pagination,
      sort
    }
  }, 1)

  dictation.hooks.addFilter('edit_post_validation', 'dictation', async (params) => {
    const {id = null, old = {}, body = {}} = await params

    // check slug duplicates if slug had changed
    if (body.slug && body.slug !== old.slug) {
      const {posts: slugDuplicate} = await dictation.hooks.applyFilters('filter_posts', {filters: createFilter({slug: body.slug})})
      if (slugDuplicate.pagination.total > 0) {
        throw new Error('Slug already exists')
      }
    }
    return {id, old, body}
  }, 1)

  dictation.hooks.addFilter('save_post_validation', 'dictation', async (params) => {
    const {id = null, body = {}} = await params

    // check slug duplicates
    if (body.slug) {
      const {posts: slugDuplicate} = await dictation.hooks.applyFilters('filter_posts', {filters: createFilter({slug: body.slug})})
      if (slugDuplicate.pagination.total > 0) {
        throw new Error('Slug already exists')
      }
    }
    return {id, body}
  }, 1)

  dictation.register(require('./routes'))

}, {dependencies: ['dictation-hooks']})
