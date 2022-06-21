'use strict'

const fp = require('fastify-plugin')
const {v4: uuidv4} = require('uuid');

/**
 * This plugins adds post functionality to the dictation
 */
module.exports = fp(async function (dictation) {
  dictation.hooks.addFilter('post', 'dictation', async (id = null, post = {}) => {
    const findCondition = {$or: [{id: id}, {slug: id}]}
    const postsColl = dictation.mongo.db.collection('posts')
    if (!id) {
      return null
    }
    const postFound = await postsColl.findOne(findCondition)
    if(postFound) {
      return [postFound.id, postFound]
    }
    throw new Error(`Post ${id} not found`)
  }, 1)

  dictation.hooks.addFilter('all-posts', 'dictation', async (posts = [], filters) => {
    const postsColl = dictation.mongo.db.collection('posts')
    const postsQuery = await postsColl.find(filters).toArray()
    return [postsQuery, filters]
  }, 1)

}, {dependencies: ['dictation-hooks']})
