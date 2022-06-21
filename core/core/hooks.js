'use strict'

const fp = require('fastify-plugin')
const { createHooks } = require('@wordpress/hooks');


/**
 * This plugins adds Wordpress Hooks coding style
 *
 * @see https://www.npmjs.com/package/@wordpress/hooks
 */
module.exports = fp(async function (fastify) {
  const hooks = createHooks();
  fastify.decorate('hooks', hooks);
}, {
  name: 'dictation-hooks',
})
