'use strict'

const fp = require('fastify-plugin')
const {hash} = require('../../utils/common')

module.exports = fp(async function (dictation) {

  const usersColl = dictation.mongo.db.collection('users')

  // Create admin user
  if (parseInt(process.env.CREATE_ADMIN_USER) === 1) {
    const user = await usersColl.findOne({username: 'admin'})
    if (!user) {
      await usersColl.insertOne({
        username: 'admin',
        password: hash(process.env.ADMIN_PASSWORD),
        email: "admin@dictation.none",
        name: 'Admin',
        roles: ['admin']
      })
    }
  }

  dictation.hooks.addFilter('registered_plugin', 'dictation', (pluginList = []) => {
    pluginList.push({
      name: 'profile',
      version: '1.0.0',
      description: 'This plugins adds profiles managing'
    })
    return pluginList
  })

  dictation.hooks.addFilter('get_user', 'dictation', async (params) => {
    const {username = null, projection = {}, ...rest} = await params
    const findCondition = {$or: [{username: username}, {email: username}]}
    if (!username) {
      throw new Error(`username not sent`)
    }

    let postRes = await usersColl.find(findCondition).project(projection).limit(1).toArray()
    postRes = postRes[0]

    if (postRes) {
      return {username: username, user: postRes, projection, ...rest}
    }
    throw new Error(`User ${username} not found`)
  }, 1)

  dictation.hooks.addFilter('filter_users', 'dictation', async (params) => {
    const {
      filters = {},
      projection = {},
      pagination = {limit: 1000, page: 1},
      sort = {_id: -1},
      ...rest
    } = await params
    let limit = pagination.limit
    let skip = pagination.limit * (pagination.page - 1)
    const totalCount = await usersColl.countDocuments(filters)
    const postRes = await usersColl.find(filters).skip(skip).limit(limit).sort(sort).project(projection).toArray()
    return {
      users: {
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

  dictation.hooks.addFilter('save_user_validation', 'dictation', async (params) => {
    let {body = {}, ...rest} = await params
    if (!body.email) throw new Error('user.email is required')
    if (!body.password) throw new Error('user.password is required')

    body = {
      ...body,
      username: body.username || body.email,
      password: hash(body.password),
    }

    // check user duplicates
    const userCount = await usersColl.countDocuments({username: body.username})
    if (userCount > 0) {
      throw new Error('Users already exists')
    }

    return {body, ...rest}
  }, 1)

  dictation.hooks.addFilter('register_user_validation', 'dictation', async (params) => {
    let {body = {}, ...rest} = await params
    if (!body.email) throw new Error('user.email is required')
    if (!body.password) throw new Error('user.password is required')

    body = {
      ...body,
      username: body.username || body.email,
      password: hash(body.password),
    }

    // check user duplicates
    const userCount = await usersColl.countDocuments({username: body.username})
    if (userCount > 0) {
      throw new Error('Users already exists')
    }

    return {body, ...rest}
  }, 1)

  dictation.hooks.addFilter('edit_user_validation', 'dictation', async (params) => {
    let {body = {}, ...rest} = await params
    if (body.username) throw new Error('user.username is not editable')
    if (body.password) body.password = hash(body.password)

    return {body, ...rest}
  }, 1)

  dictation.register(require('./routes'))

}, {dependencies: ['dictation-hooks']})
