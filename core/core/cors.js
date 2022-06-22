const fp = require('fastify-plugin');

const cors = fp(async (fastify) => {
  fastify.register(require('@fastify/cors'), {
    origin: '*',
    methods: ['HEAD', 'OPTIONS', 'POST', 'GET', 'PUT', 'DELETE']
  });
},{ name: 'cors' });

module.exports = cors;
