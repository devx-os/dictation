'use strict'

const fp = require('fastify-plugin')
const {v4: uuidv4} = require("uuid");
/**
 * This plugins adds post functionality to the dictation
 */
module.exports = fp(async function (dictation) {
  const postsColl = dictation.mongo.db.collection('posts')

  dictation.hooks.addFilter('post', 'dictation', async (params) => {
    const {id = null, post = {}} = await params
    const findCondition = {$or: [{id: id}, {slug: id}]}
    if (!id) {
      throw new Error(`id not sent`)
    }
    const postRes = await postsColl.findOne(findCondition)
    if (postRes) {
      return {id: postRes.id, post: postRes}
    }
    throw new Error(`Post ${id} not found`)
  }, 1)

  dictation.hooks.addFilter('posts', 'dictation', async (params) => {
    const {posts = [], filters = {}, pagination = {limit: 1000, page: 1}} = await params
    let limit = pagination.limit
    let skip = pagination.limit * (pagination.page - 1)
    const totalCount = await postsColl.countDocuments(filters)
    const postRes = await postsColl.find(filters).skip(skip).limit(limit).toArray()
    return {
      posts: {
        data: postRes,
        pagination: {...pagination, total: totalCount}
      },
      filters,
      pagination
    }
  }, 1)

  dictation.register(require('./routes'))

}, {dependencies: ['dictation-hooks']})
