import axios from "axios"

const baseURL = "/samurai-api"

export const instance = axios.create({
  baseURL,
  headers: {
    "API-KEY": import.meta.env.VITE_API_KEY,
  },
})
