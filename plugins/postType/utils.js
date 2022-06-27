// create a filter function to match query params of an url in mongo db with $and and $or condition
const createFilter = (query) => {
  const filter = {}
  if (query.q) {
    filter.$or = [{title: {$regex: query.q, $options: 'i'}}, {description: {$regex: query.q, $options: 'i'}}]
  }

  if (query.slug) {
    filter.slug = {$in: query.slug.split(',')}
  }

  return filter
}



module.exports = {
  createFilter
}