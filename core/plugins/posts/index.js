'use strict'

const fp = require('fastify-plugin')
/**
 * This plugins adds post functionality to the dictation
 */
module.exports = fp(async function (dictation) {
  dictation.hooks.addFilter('post', 'dictation', async (params) => {
    const {id = null, post = {}} = await params
    const findCondition = {$or: [{id: id}, {slug: id}]}
    const postsColl = dictation.mongo.db.collection('posts')
    if (!id) {
      throw new Error(`id not sent`)
    }
    const postFound = await postsColl.findOne(findCondition)
    if (postFound) {
      return {id: postFound.id, post: postFound}
    }
    throw new Error(`Post ${id} not found`)
  }, 1)

  dictation.hooks.addFilter('posts', 'dictation', async (params) => {
    const {posts = [], filters = {}} = await params
    const postsColl = dictation.mongo.db.collection('posts')
    const postsQuery = await postsColl.find(filters).toArray()
    return {posts: postsQuery, filters}
  }, 1)

}, {dependencies: ['dictation-hooks']})
