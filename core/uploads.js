'use strict'

const fp = require('fastify-plugin')
const path = require("path");
const fs = require("fs");


/**
 * This plugins adds Wordpress Hooks coding style
 *
 * @see https://www.npmjs.com/package/@wordpress/hooks
 */
module.exports = fp(async function (fastify) {
  await fs.promises.mkdir(path.join(process.cwd(), 'uploads'), { recursive: true })
  fastify.register(require('@fastify/multipart'))
  fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/', // optional: default '/'
  })
}, {
  name: 'local-upload',
  dependencies: ['mongo']
})
