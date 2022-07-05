'use strict'

const fp = require('fastify-plugin')
const {createFilter} = require("./utils");
const {slugify} = require("../../utils/common");
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
    const {id = null, projection = {},...rest} = await params
    const findCondition = {$or: [{id: id}, {slug: id}]}
    if (!id) {
      throw new Error(`id not sent`)
    }

    let postRes = await postsColl.find(findCondition).project(projection).limit(1).toArray()
    postRes = postRes[0]

    if (postRes) {
      return {id: postRes.id, post: postRes, projection, ...rest}
    }
    throw new Error(`Post ${id} not found`)
  }, 1)

  dictation.hooks.addFilter('filter_posts', 'dictation', async (params) => {
    const {
      filters = {},
      projection = {},
      pagination = {limit: 1000, page: 1},
      sort = {_id: -1},
      ...rest
    } = await params
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
      sort,
      ...rest
    }
  }, 1)

  dictation.hooks.addFilter('edit_post_validation', 'dictation', async (params) => {
    const {id = null, old = {}, body = {}, ...rest} = await params
    if (body.slug) {
      body.slug = slugify(body.slug)
    }
    body.lastUpdate = new Date()

    // check slug duplicates if slug had changed
    if (body.slug && body.slug !== old.slug) {
      const {posts: slugDuplicate} = await dictation.hooks.applyFilters('filter_posts', {filters: createFilter({slug: body.slug})})
      if (slugDuplicate.pagination.total > 0) {
        throw new Error('Slug already exists')
      }
    }
    return {id, old, body, ...rest}
  }, 1)

  dictation.hooks.addFilter('save_post_validation', 'dictation', async (params) => {
    let {id = null, body = {}, ...rest} = await params
    if(!body.title) throw new Error('post.title is required')
    if(!id) throw new Error('post.id is required')

    body = {
      ...body,
      id: id,
      state: body.state || 'draft',
      meta: body.meta || {},
      slug: slugify(body.slug || body.title),
      lastUpdate: new Date()
    }

    // check slug duplicates
    if (body.slug) {
      const {posts: slugDuplicate} = await dictation.hooks.applyFilters('filter_posts', {filters: createFilter({slug: body.slug})})
      if (slugDuplicate.pagination.total > 0) {
        throw new Error('Slug already exists')
      }
    }
    return {id, body, ...rest}
  }, 1)

  dictation.register(require('./routes'))

}, {dependencies: ['dictation-hooks']})
