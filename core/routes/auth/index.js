'use strict'

module.exports = async function (fastify, opts) {
    const users = await fastify.mongo.db.collection('users')

    fastify.post('/signin', async function (request, reply) {
        try {
            const { username, password } = request.body
            const user = users.findOne({ username: username })
            if(fastify.compare(password, user.password)) {
                const token = fastify.jwt.sign({ username: user.username, name: user.name })
                return { token: token }
            } else {
                return reply.unauthorized()
            }
        } catch (e) {
            fastify.log.error({ msg: 'Error during Sign In', err: e.message })
            return reply.unauthorized()
        }
    })

    fastify.post('/signup', async function (request, reply) {
        try {
            const { username, password, name } = request.body
            await users.insertOne({
                username: username,
                password: fastify.hash(password),
                name: name
            })
            return { msg: 'correctly registered user' }
        } catch (e) {
            fastify.log.error({ msg: 'Error during Sign Up', err: e.message })
            return reply.internalServerError()
        }
    })
}
