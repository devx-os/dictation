'use strict'

const fp = require('fastify-plugin')
const { v4: uuidv4 } = require('uuid')
const { compare, hash } = require('./utils')
/**
 * This plugins adds auth functionality via JWT token
 */
module.exports = fp(async function (dictation) {

  dictation.decorate('authenticate', async function(request, reply) {
    await request.jwtVerify()
  })

  dictation.decorate('isAdmin', async function(request, reply) {
    await request.jwtVerify()
    return request.user.roles.includes('admin');
  })

  dictation.decorate('canEdit', async function(request, reply) {
    await request.jwtVerify()
    return request.user.roles.includes('admin') || request.user.roles.includes('editor');
  })

  const users = dictation.mongo.db.collection('users')
  const refresh_token = dictation.mongo.db.collection('refresh_token')
  users.createIndex({username: 1}, {unique: true}, async function (err, result) {
    if (err) {
      dictation.log.error(err)
      dictation.close().then(() => {
        console.error('Error creating index for users collection, closing dictation')
      })
    } else {
      // Create admin user
      const user = await users.findOne({username: 'admin'})
      if (!user) {
        await users.insertOne({username: 'admin', password: await hash(process.env.ADMIN_PASSWORD), email:"admin@dictation.none", name: 'Admin', roles: ['admin']})
      }
    }
  })

  dictation.hooks.addFilter('registered_plugin', 'dictation', (pluginList = []) => {
    pluginList.push({
      name: 'auth',
      version: '1.0.0',
      description: 'This plugins adds auth functionality via JWT token'
    })
    return pluginList
  })

  dictation.hooks.addFilter('refresh_token', 'dictation', async (params) => {
    const { refreshToken } = params
    const refreshTokenInfo = await refresh_token.findOne({ refreshToken: refreshToken })
    if (!refreshTokenInfo) {
      throw dictation.error({statusCode: 404, message: 'body.refreshToken not found'})
    }
    const user = await users.findOne({_id: refreshTokenInfo.user})
    if (!user) {
      throw dictation.error({statusCode: 404, message: 'refreshToken not valid'})
    }
    const token = dictation.jwt.sign({ username: user.username, name: user.name, roles: user.roles })
    const newRefreshToken = uuidv4()
    await refresh_token.updateOne({ refreshToken: refreshToken }, { $set: { refreshToken: newRefreshToken } })
    return { 
      username: user.username, 
      password: user.password, 
      token, 
      refreshToken, 
      newRefreshToken
    }
  })

  dictation.hooks.addFilter('sign_in', 'dictation', async (params) => {
    try {
      const { username, password } = params
      const user = await users.findOne({$or:[{username: username}, {email: username}]})
      if (user && compare(password, user.password)) {
        const token = dictation.jwt.sign({ username: user.username, name: user.name, roles: user.roles })
        const refreshToken = uuidv4()
        await refresh_token.insertOne({
          refreshToken: refreshToken,
          user: user._id
        })
        return { username, password, token, refreshToken }
      } else {
        throw dictation.error({statusCode: 401, message: 'Error during Sign In'})
      }
    } catch (e) {
      throw dictation.error({statusCode: 401, message: 'Error during Sign In'})
    }
  }, 1)

  dictation.hooks.addFilter('create_user', 'dictation', async (params) => {
    try {
      const {username, password, name, roles, email} = params
      await users.insertOne({
        username: username,
        password: await hash(password),
        email: email,
        name: name,
        roles: roles
      })
      return {username, password, name, roles, email}
    } catch (e) {
      throw dictation.error({statusCode: 400, message: 'Error during User Creation'})
    }
  }, 1)

  dictation.register(require('./routes'))

}, {dependencies: ['dictation-hooks', 'jwt']})
