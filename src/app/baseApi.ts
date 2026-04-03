import { setAppErrorAC } from "@/app/appSlice"
import { clearStoredAuthToken } from "@/common/utils/authStorage"
import { handleError } from "@/common/utils/handleError"
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

const baseUrl = import.meta.env.VITE_BASE_URL || "/samurai-api"

export const baseApi = createApi({
    reducerPath: "todolistsApi",

    // Глобальные типы тегов для cache invalidation
    tagTypes: ["Todolist", "Task"],

    // Кэш хранится 60 секунд после размонтирования последнего подписчика
    keepUnusedDataFor: 60,

    // Автоматический refetch при возвращении на вкладку
    refetchOnFocus: true,

    baseQuery: async (args, api, extraOptions) => {
        // Create a single same-origin entrypoint so dev and Vercel share auth behavior.
        const result = await fetchBaseQuery({
            baseUrl,
            credentials: "include",
            headers: {
                "API-KEY": import.meta.env.VITE_API_KEY,
            },
        })(args, api, extraOptions)

        if (result.error?.status === 401) {
            clearStoredAuthToken()
        }

        handleError(api, result, (error) => setAppErrorAC({ error }))

        return result
    },

    endpoints: () => ({}),
})
