'use strict'

const fp = require('fastify-plugin')
const { compare, hash } = require('./utils')
/**
 * This plugins adds auth functionality via JWT token
 */
module.exports = fp(async function (dictation) {
  const users = dictation.mongo.db.collection('users')
  users.createIndex({ username : 1 }, { unique: true }, async function(err, result) {
    if(err) {
      dictation.log.error(err)
      dictation.close().then(() => {
        console.error('Error creating index for users collection, closing dictation')
      })
    } else {
      // Create admin user
      const user = await users.findOne({ username: 'admin' })
      if(!user) {
        await users.insertOne({ username: 'admin', password: await hash('admin123'), name: 'Admin', roles: ['Admin'] })
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

  dictation.hooks.addFilter('signin', 'dictation', async (params) => {
    try {
      const { username, password } = params
      const user = await users.findOne({ username: username })
      if(user && compare(password, user.password)) {
          const token = dictation.jwt.sign({ username: user.username, name: user.name, roles: user.roles })
          return { token: token }
      } else {
        throw dictation.error({ statusCode: 401, message: 'Error during Sign In' })
      }
    } catch (e) {
      throw dictation.error({ statusCode: 401, message: 'Error during Sign In' })
    }
  }, 1)

  dictation.hooks.addFilter('create-user', 'dictation', async (params) => {
    try {
      const { username, password, name, roles } = params
      await users.insertOne({
        username: username,
        password: await hash(password),
        name: name,
        roles: roles
      })
      return { message: 'correctly registered user' }
    } catch (e) {
      throw dictation.error({ statusCode: 400, message: 'Error during User Creation' })
    }
  }, 1)

  dictation.register(require('./routes'))

}, {dependencies: ['dictation-hooks']})
