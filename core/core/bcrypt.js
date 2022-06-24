'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify) {
    const bcrypt = require('bcrypt')

    const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS))

    fastify.decorate('hash', (myPlaintextPassword) => {
        return bcrypt.hashSync(myPlaintextPassword, salt)
    })

    fastify.decorate('compare', (myPlaintextPassword, hash) => {
        console.log(myPlaintextPassword, hash)
        return bcrypt.compareSync(myPlaintextPassword, hash)
    })
}, {
  name: 'bcrypt',
})
