'use strict'

const fp = require('fastify-plugin')
const {v4: uuidv4} = require('uuid')
const {compare} = require('../../utils/common')
/**
 * This plugins adds auth functionality via JWT token
 */
module.exports = fp(async function (dictation) {

  dictation.decorate('authenticate', async function (request, reply) {
    await request.jwtVerify()
  })

  dictation.decorate('isAdmin', async function (request, reply) {
    await request.jwtVerify()
    if(!request.user.roles.includes('admin')) {
      throw dictation.httpErrors.forbidden()
    }
  })

  dictation.decorate('canEdit', async function (request, reply) {
    await request.jwtVerify()
    if(!(request.user.roles.includes('admin') || request.user.roles.includes('editor'))) {
      throw dictation.httpErrors.forbidden()
    }
  })
  dictation.decorate('itsMeOrAdmin', async function (request, reply) {
    await request.jwtVerify()
    const itsMe = request.user.username === request?.params?.username
    if(!itsMe && !request.user.roles.includes('admin')) {
      throw dictation.httpErrors.forbidden()
    }
  })

  const users = dictation.mongo.db.collection('users')
  const refresh_token = dictation.mongo.db.collection('refresh_token')

  dictation.hooks.addFilter('registered_plugin', 'dictation', (pluginList = []) => {
    pluginList.push({
      name: 'auth',
      version: '1.0.0',
      description: 'This plugins adds auth functionality via JWT token'
    })
    return pluginList
  })

  dictation.hooks.addFilter('refresh_token', 'dictation', async (params) => {
    const {refreshToken, ...rest} = params
    const refreshTokenInfo = await refresh_token.findOne({refreshToken: refreshToken})
    if (!refreshTokenInfo) {
      throw dictation.error({statusCode: 404, message: 'body.refreshToken not found'})
    }
    const user = await users.findOne({_id: refreshTokenInfo.user})
    if (!user) {
      throw dictation.error({statusCode: 404, message: 'refreshToken not valid'})
    }
    const token = dictation.jwt.sign({username: user.username, name: user.name, roles: user.roles})
    const newRefreshToken = uuidv4()
    await refresh_token.updateOne({refreshToken: refreshToken}, {$set: {refreshToken: newRefreshToken}})
    return {
      username: user.username,
      password: user.password,
      token,
      refreshToken,
      newRefreshToken,
      ...rest
    }
  }, 1)

  dictation.hooks.addFilter('sign_in', 'dictation', async (params) => {
    try {
      const {username, password, ...rest} = params
      const user = await users.findOne({$or: [{username: username}, {email: username}]})
      if (user && compare(password, user.password)) {
        const token = dictation.jwt.sign({
          username: user.username,
          name: user.name,
          roles: user.roles
        }, {expiresIn: '5 minutes'})
        const refreshToken = uuidv4()
        const refreshTokenInfo = await refresh_token.findOne({user: user._id})
        if (refreshTokenInfo) {
          await refresh_token.updateOne({user: user._id}, {$set: {refreshToken: refreshToken}})
        } else {
          await refresh_token.insertOne({
            refreshToken: refreshToken,
            user: user._id
          })
        }
        return {username, password, token, refreshToken, ...rest}
      } else {
        throw dictation.error({statusCode: 401, message: 'Error during Sign In'})
      }
    } catch (e) {
      throw dictation.error({statusCode: 401, message: 'Error during Sign In'})
    }
  }, 1)

  dictation.register(require('./routes'))

}, {dependencies: ['dictation-hooks', 'jwt']})
