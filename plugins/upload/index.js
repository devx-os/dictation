'use strict'

const fp = require('fastify-plugin')
const {v4: uuidv4} = require("uuid");
const fs = require("fs");
const util = require('util')
const {pipeline} = require('stream')
const path = require("path");
const pump = util.promisify(pipeline)
/**
 * This plugins adds auth functionality via JWT token
 */
module.exports = fp(async function (dictation) {
  const uploadColl = dictation.mongo.db.collection('upload')

  dictation.hooks.addFilter('registered_plugin', 'dictation', (pluginList = []) => {
    pluginList.push({
      name: 'upload',
      version: '1.0.0',
      description: 'This plugins adds upload functionality'
    })
    return pluginList
  })

  dictation.hooks.addFilter('get_files', 'dictation', async (params) => {
    const {
      filters = {},
      pagination = {limit: 1000, page: 1},
      sort = {_id: -1},
      ...rest
    } = await params

    if (filters.dir) {
      const files = fs.readdirSync(path.join(process.cwd(), `uploads/${filters.dir}`));

      // separate file from directory
      const filesRes = files.map(file => {
        if (fs.lstatSync((path.join(process.cwd(), `uploads/${filters.dir}/${file}`))).isDirectory()) {
          return {
            name: file,
            type: 'directory',
            dir: `${filters.dir === '/' ? '' : filters.dir}/${file}`,
          }
        }
        return {
          name: file,
          type: 'file',
          dir: `${filters.dir === '/' ? '' : filters.dir}`,
        }
      })

      // files object contains all files names
      // log them on console
      return {
        files: {
          data: filesRes,
        }
      }
    }

    let limit = pagination.limit
    let skip = pagination.limit * (pagination.page - 1)
    const totalCount = await uploadColl.countDocuments(filters)
    console.log(totalCount, filters)
    const allFiles = await uploadColl.find(filters).skip(skip).limit(limit).sort(sort).toArray()
    return {
      files: {
        data: allFiles,
        pagination: {...pagination, total: totalCount},
        sort
      },
      filters,
      pagination,
      sort,
      ...rest
    }
  }, 1)

  dictation.hooks.addFilter('get_file', 'dictation', async (params) => {
    const {id} = await params
    const file = await uploadColl.findOne({id})
    return {...params, file}
  }, 1)
  dictation.hooks.addFilter('delete_file', 'dictation', async (params) => {
    const {id} = await params
    const file = await uploadColl.findOne({id})
    if (file) {
      fs.unlinkSync(path.join(process.cwd(), `uploads/${file.path}/${file.filename}`))
      await uploadColl.deleteOne({id})
    }
    return {...params, file}
  }, 1)

  dictation.hooks.addFilter('upload_files', 'dictation', async (params) => {
    const {request} = await params
    let {path = ''} = request.query
    const parts = request.files()

    //remove trail slash from path
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1)
    }
    const pathDir = `${process.cwd()}/uploads/${path}`
    await fs.promises.mkdir(pathDir, {recursive: true})
    const files = []

    for await (const part of parts) {
      // part.file // stream
      // part.fields // other parsed parts
      // part.fieldname
      // part.filename
      // part.encoding
      // part.mimetype

      const filename = `${Date.now()}_${part.filename}`

      const uploadPath = `${pathDir}/${filename}`
      const toSave = {
        id: uuidv4(),
        path,
        filename,
        mimetype: part.mimetype,
        encoding: part.encoding,
        size: part.size,
        createdAt: new Date()
      }
      const {file} = part
      await pump(file, fs.createWriteStream(uploadPath))
      await uploadColl.insertOne({...toSave})
      files.push(toSave)
    }

    return {...params, files}
  }, 1)

  dictation.register(require('./routes'))

}, {dependencies: ['dictation-hooks']})
