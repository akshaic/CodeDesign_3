import axios from 'axios'

export const fetchMetadata = async (url) => {
  const response = await axios.get(`https://jsonlink.io/api/extract?url=${encodeURIComponent(url)}`)
  return response.data
}
