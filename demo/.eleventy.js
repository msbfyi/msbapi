module.exports = function (eleventyConfig) {
  // Copy CSS files
  eleventyConfig.addPassthroughCopy('src/css')

  // Add date filter
  eleventyConfig.addFilter('dateFormat', function (date) {
    return new Date(date).toLocaleDateString()
  })

  // Add rating filter
  eleventyConfig.addFilter('starRating', function (rating) {
    if (!rating) return ''
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating))
  })

  // Add URL encode filter
  eleventyConfig.addFilter('urlencode', function (str) {
    return encodeURIComponent(str)
  })

  return {
    dir: {
      input: 'src',
      output: '_site',
    },
  }
}
