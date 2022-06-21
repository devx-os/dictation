'use strict'

const {test} = require('tap')
const Fastify = require('fastify')
const Hooks = require('../../plugins/hooks')

test('hooks filter standalone', async (t) => {
  const fastify = Fastify()
  fastify.register(Hooks)
  await fastify.ready()

  fastify.hooks.addFilter('dictation_init', 'dictation_test', (...args) => {
    return args[0] + '-bar'
  })
  fastify.hooks.addFilter('dictation_init', 'dictation_test_2', (...args) => {
    return args[0] + '-bar2'
  })
  t.equal(fastify.hooks.hasFilter('dictation_init'), true)
  t.equal(fastify.hooks.applyFilters('dictation_init', 'foo'), 'foo-bar-bar2')
  t.equal(fastify.hooks.applyFilters('dictation_init', 'too', 'lot'), 'too-bar-bar2')
})


test('hooks action standalone', async (t) => {
  const fastify = Fastify()
  fastify.register(Hooks)
  await fastify.ready()

  let count = 0
  fastify.hooks.addAction('dictation_init', 'dictation_test', (value) => {
    count++
  })
  t.equal(fastify.hooks.hasAction('dictation_init'), true)
  t.notOk(fastify.hooks.doAction('dictation_init'))
  t.notOk(fastify.hooks.doAction('dictation_init'))
  t.equal(count, 2)
})

test('hooks action multi', async (t) => {
  const fastify = Fastify()
  fastify.register(Hooks)
  await fastify.ready()

  let count = 0
  fastify.hooks.addAction('dictation_init', 'dictation_test', (value) => {
    count++
  })
  fastify.hooks.addAction('dictation_init', 'dictation_test_two', (value) => {
    count++
  })
  t.equal(fastify.hooks.hasAction('dictation_init'), true)
  t.notOk(fastify.hooks.doAction('dictation_init'))
  t.equal(count, 2)
})