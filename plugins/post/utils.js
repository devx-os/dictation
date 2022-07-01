// create a filter function to match query params of an url in mongo db with $and and $or condition
const createFilter = (query) => {
  const filter = {}
  if (query.q) {
    filter.$or = [{title: {$regex: query.q, $options: 'i'}}, {content: {$regex: query.q, $options: 'i'}}]
  }

  if (query.title) {
    filter.title = {$in: query.title.split(',')}
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
    filter['type.slug'] = {$in: query.type.split(',')}
  }

  if (query.state) {
    filter.state = {$in: query.state.split(',')}
  }

  console.log(filter)

  return filter
}

const createProjection = (query = {}) => {
  let projection = {
    id: 1,
    title: 1,
    slug: 1,
    content: 1,
    type: 1,
    tags: 1,
    category: 1,
    _id: 0,
  }
  if (query.fields) {
    if (query.fields === '*') {
      return {}
    }
    const fieldParams = query.fields.split(',')
    fieldParams.forEach(param => {
      const [key, value] = param.split(':')
      if (parseInt(value) === 0) {
        if (projection[key]) {
          delete projection[key]
        }
      } else {
        projection[key] = 1
      }
    })
  }
  return projection
}

module.exports = {
  createFilter,
  createProjection
}