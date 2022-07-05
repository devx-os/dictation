'use strict'

const fp = require('fastify-plugin')
const {createPagination, createSort} = require("../../utils/common");
const {createFilter, createProjection} = require("./utils");

module.exports = fp(async function (dictation) {
  const usersColl = dictation.mongo.db.collection('users')

  dictation.get('/user', {
    onRequest: [dictation.authenticate],
    schema: {
      tags: ['user'],
      // response: {
      //   200: {
      //     description: 'response and schema description',
      //     type: 'array',
      //   }
      // }
    }
  }, async function (request, reply) {
    const {users} = await dictation.hooks.applyFilters('filter_users', {
      pagination: createPagination(request.query),
      filters: createFilter(request.query),
      sort: createSort(request.query),
      projection: createProjection(request.query)
    })
    reply.send(users)
  })

  dictation.post('/user', {
    onRequest: [dictation.isAdmin],
    schema: {
      tags: ['user'],
    }
  }, async function (request, reply) {
    let postBody = {...request.body, roles: request.body.roles || []}
    try {
      const {body: bodyAfterValidation} = await dictation.hooks.applyFilters('save_user_validation', {
        body: postBody
      })
      postBody = bodyAfterValidation
    } catch (e) {
      return dictation.httpErrors.badRequest(e.message)
    }

    dictation.hooks.doAction('before_save_user', postBody)

    const result = await usersColl.insertOne({...postBody})
    if (!result) {
      return dictation.httpErrors.badRequest()
    }

    const {user} = await dictation.hooks.applyFilters('get_user', {username: postBody.username, projection: createProjection({})})
    dictation.hooks.doAction('after_save_user', user)
    reply.send(user)
  })

  dictation.post('/register', {
    onRequest: [],
    schema: {
      tags: ['user'],
    }
  }, async function (request, reply) {
    let postBody = {...request.body, roles: ['user']}
    try {
      const {body: bodyAfterValidation} = await dictation.hooks.applyFilters('register_user_validation', {
        body: postBody
      })
      postBody = bodyAfterValidation
    } catch (e) {
      return dictation.httpErrors.badRequest(e.message)
    }

    dictation.hooks.doAction('before_register_user', postBody)

    const result = await usersColl.insertOne({...postBody})
    if (!result) {
      return dictation.httpErrors.badRequest()
    }

    const {user} = await dictation.hooks.applyFilters('get_user', {username: postBody.username, projection: createProjection({})})
    dictation.hooks.doAction('after_register_user', user)
    reply.send(user)
  })

  dictation.put('/user/:username', {
    onRequest: [dictation.itsMeOrAdmin],
    schema: {
      tags: ['user'],
    }
  }, async function (request, reply) {
    const {username} = request.params
    const updateCondition = {$or: [{username: username}]}

    let postBody = {
      ...request.body
    }

    const {user: oldUser} = await dictation.hooks.applyFilters('get_user', {
      username,
      projection: createProjection({fields: '*'})
    })

    // trigger a post_validation  event
    try {
      const {body: bodyAfterValidation} = await dictation.hooks.applyFilters('edit_user_validation', {
        username,
        body: postBody,
        old: oldUser
      })
      postBody = bodyAfterValidation
    } catch (e) {
      return dictation.httpErrors.badRequest(e.message)
    }

    // trigger a post updated event
    dictation.hooks.doAction('pre_edit_user', {username, body: {...postBody}})

    const result = await usersColl.updateOne(updateCondition, {$set: postBody})
    if (!result) {
      return dictation.httpErrors.badRequest()
    }

    // trigger a post updated event
    dictation.hooks.doAction('edit_post', {username, body: {...postBody}})

    const {user} = await dictation.hooks.applyFilters('get_user', {
      username,
      projection: createProjection(request.query)
    })
    reply.send(user)
  })

  dictation.get('/user/:username', {
    onRequest: [dictation.authenticate],
    schema: {
      tags: ['user'],
    }
  }, async function (request, reply) {
    const {username} = request.params
    const {user} = await dictation.hooks.applyFilters('get_user', {
      username,
      projection: createProjection(request.query)
    })
    reply.send(user)
  })

  dictation.delete('/user/:username', {
    onRequest: [dictation.isAdmin],
    schema: {
      tags: ['user'],
    }
  }, async function (request, reply) {
    const {username} = request.params
    const deleteCondition = {$or: [{username: username}]}
    const {user} = await dictation.hooks.applyFilters('get_user', {username})
    dictation.hooks.doAction('pre_delete_user', {username, user})
    await usersColl.deleteOne(deleteCondition)
    dictation.hooks.doAction('delete_user', {username, user})
    reply.status(204).send()
  })

})