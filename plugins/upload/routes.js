'use strict'

const fp = require('fastify-plugin')
const fs = require('fs')
const {createFilter} = require("./utils");
const {createSort} = require("../../utils/common");


module.exports = fp(async function (dictation) {

  // const storage = multer.diskStorage({
  //   destination: function (req, file, cb) {
  //     cb(null, process.env.UPLOAD_DIR)
  //   },
  //   filename: function (req, file, cb) {
  //     cb(null, file.fieldname + '_' + Date.now())
  //   }
  // })
  // const upload = multer({storage: storage})

  dictation.post('/upload', {
    // onRequest: [dictation.canEdit],
    schema: {
      tags: ['upload'],
    }
  }, async function (request, reply) {
    const {files} = await dictation.hooks.applyFilters('upload_files', {request, reply})
    reply.send(files)
  })

  dictation.get('/file', {
    // onRequest: [dictation.canEdit],
    schema: {
      tags: ['upload'],
    }
  }, async function (request, reply) {
    try {
      const {files} = await dictation.hooks.applyFilters('get_files', {
        filters: createFilter(request.query),
        sort: createSort(request.query),
      })
      reply.send(files)
    } catch (e) {
      return dictation.httpErrors.notFound()
    }
  })

  dictation.get('/file/id/:id', {
    // onRequest: [dictation.canEdit],
    schema: {
      tags: ['upload'],
    }
  }, async function (request, reply) {
    const {file} = await dictation.hooks.applyFilters('get_file', {id: request.params.id})
    reply.send(file)
  })

  dictation.delete('/file/id/:id', {
    // onRequest: [dictation.canEdit],
    schema: {
      tags: ['upload'],
    }
  }, async function (request, reply) {
    await dictation.hooks.applyFilters('delete_file', {id: request.params.id})
    reply.status(204).send()
  })

  dictation.get('/file/*', {
    //onRequest: [dictation.canEdit],
    schema: {
      tags: ['upload'],
    }
  }, async function (request, reply) {
    console.log('request.params', request.params)
    return reply.sendFile(request.params['*'], {cacheControl: false}) // overriding the options disabling cache-control headers
  })

})