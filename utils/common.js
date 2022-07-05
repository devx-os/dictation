'use strict'

const bcrypt = require('bcrypt')

// create a mongo db pagination from query params
const createPagination = (query) => {
  const pagination = {}
  pagination.page = query.page ? parseInt(query.page) : 1
  pagination.limit = query.limit ? parseInt(query.limit) : 1000
  return pagination
}

// create a function that take in input a string and slugify it
const slugify = (str) => {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  let from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  let to = "aaaaeeeeiiiioooouuuunc------";
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
}

// create sorting function from query params the params is follow: params:1, params:-1
const createSort = (query) => {
  const sort = {}
  if (query.sort) {
    const sortParams = query.sort.split(',')
    sortParams.forEach(param => {
      const [key, value] = param.split(':')
      sort[key] = parseInt(value)
    })
    return sort
  }
  return {_id: -1}
}

const hash = (myPlaintextPassword) => {
  return bcrypt.hashSync(myPlaintextPassword, bcrypt.genSaltSync(parseInt(process.env.SALT_ROUNDS)))
}

const compare = (myPlaintextPassword, hash) => {
  return bcrypt.compareSync(myPlaintextPassword, hash)
}

module.exports = {
  createPagination,
  createSort,
  slugify,
  hash,
  compare
}