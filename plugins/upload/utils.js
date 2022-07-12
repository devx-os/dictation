// create a filter function to match query params of an url in mongo db with $and and $or condition
const createFilter = (query) => {
  const filter = {}
  if (query.q) {
    filter.$or = [{filename: {$regex: query.q, $options: 'i'}}]
  }

  if (query.filename) {
    filter.filename = {$in: query.filename.split(',')}
  }

  if (query.mimetype) {
    filter.mimetype = {$in: query.mimetype.split(',')}
  }

  if (query.path !== undefined) {
    filter.path = {$in: query.path.split(',')}
  }

  if (query.dir !== undefined) {
    filter.dir = query.dir === '' ? '/' : query.dir
  }

  return filter
}


module.exports = {
  createFilter
}