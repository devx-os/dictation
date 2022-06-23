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

// create a mongo db pagination from query params
const createPagination = (query) => {
  const pagination = {}
  pagination.page = query.page ? parseInt(query.page) : 1
  pagination.limit = query.limit ? parseInt(query.limit) : 1000
  return pagination
}

// create a function that take in input a string and slugify it
const slugify = (str) => {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  let from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  let to = "aaaaeeeeiiiioooouuuunc------";
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
}

module.exports = {
  createFilter,
  createPagination,
  slugify
}