// create a filter function to match query params of an url in mongo db with $and and $or condition
const createFilter = (query) => {
  const filter = {}
  if (query.q) {
    filter.$or = [{name: {$regex: query.q, $options: 'i'}}, {
      username: {
        $regex: query.q,
        $options: 'i'
      }
    }, {email: {$regex: query.q, $options: 'i'}}]
  }

  if (query.name) {
    filter.name = {$in: query.name.split(',')}
  }

  if (query.username) {
    filter.username = {$in: query.username.split(',')}
  }

  if (query.email) {
    filter.email = {$in: query.email.split(',')}
  }

  if (query.roles) {
    filter.roles = {$in: query.roles.split(',')}
  }

  return filter
}

const createProjection = (query = {}) => {
  let projection = {
    name: 1,
    email: 1,
    username: 1,
    roles: 1,
    _id: 0,
  }
  query.password = 0
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