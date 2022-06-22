// create a filter function to match query params of an url in mongo db with $and and $or condition
const createFilter = (query) => {
  const filter = {}
  if (query.q) {
    filter.$or = [{title: {$regex: query.q, $options: 'i'}}, {content: {$regex: query.q, $options: 'i'}}]
  }

  if (query.category) {
    filter.category = {$in: query.category.split(',')}
  }

  if (query.tag) {
    filter.tags = {$in: query.tag.split(',')}
  }

  if (query.author) {
    filter.author = query.author
  }

  if (query.type) {
    filter.type = query.type
  }

  if (query.name) {
    filter.name = query.name
  }

  if (query.state) {
    filter.state = query.state
  }

  return filter
}

// create a mongo db pagination from query params
const createPagination = (query) => {
  const pagination = {}
  pagination.page = query.page ? parseInt(query.page) : 1
  pagination.limit = query.limit ? parseInt(query.limit) : 1000
  return pagination
}

module.exports = {
  createFilter,
  createPagination
}