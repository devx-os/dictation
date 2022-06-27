'use strict'

const bcrypt = require('bcrypt')

const hash = async (myPlaintextPassword) => {
    return bcrypt.hashSync(myPlaintextPassword, await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS)))
}

const compare = async (myPlaintextPassword, hash) => {
    return bcrypt.compareSync(myPlaintextPassword, hash)
}


module.exports = {
    hash,
    compare
  }