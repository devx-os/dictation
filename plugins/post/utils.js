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

  if (query.slug) {
    filter.slug = {$in: query.slug.split(',')}
  }

  if (query.author) {
    filter.author = {$in: query.author.split(',')}
  }

  if (query.type) {
    filter.type = {$in: query.type.split(',')}
  }

  if (query.state) {
    filter.state = {$in: query.state.split(',')}
  }

  return filter
}

module.exports = {
  createFilter,
}