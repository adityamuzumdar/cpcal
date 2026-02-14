const axios = require('axios')

const httpClient = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'cpcal/2.1',
  },
})

module.exports = {
  httpClient,
}
