import axios from "axios"

const baseURL =
  import.meta.env.VITE_BASE_URL ||
  (import.meta.env.DEV
    ? "/samurai-api"
    : "https://social-network.samuraijs.com/api/1.1")

export const instance = axios.create({
  baseURL,
  headers: {
    "API-KEY": import.meta.env.VITE_API_KEY,
  },
})
