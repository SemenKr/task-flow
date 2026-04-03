import {setAppErrorAC} from '@/app/appSlice';
import {clearStoredAuthToken} from '@/common/utils/authStorage';
import {handleError} from '@/common/utils/handleError';
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

const baseUrl =
    import.meta.env.VITE_BASE_URL ||
    (import.meta.env.DEV
        ? "/samurai-api"
        : "https://social-network.samuraijs.com/api/1.1")

export const baseApi = createApi({
    reducerPath: "todolistsApi",

    // 🏷️ Глобальные типы тегов для cache invalidation
    tagTypes: ["Todolist", "Task"],

    // ⏳ Кэш хранится 60 секунд после размонтирования последнего подписчика
    keepUnusedDataFor: 60,

    // 🔄 Автоматический refetch при возвращении на вкладку
    refetchOnFocus: true,

    baseQuery: async (args, api, extraOptions) => {
        // 🌐 Создаём базовый запрос с конфигурацией
        const result = await fetchBaseQuery({
            baseUrl,
            // разрешить браузеру работать с cookies при запросах к API
            credentials: "include",
            // 🔑 Статический API-KEY для всех запросов
            headers: {
                "API-KEY": import.meta.env.VITE_API_KEY,
            },

        })(args, api, extraOptions)

        // 🚨 Если сервер вернул 401 — токен невалиден или истёк
        // Удаляем его из localStorage (можно дополнительно инициировать logout)
        if (result.error?.status === 401) {
            clearStoredAuthToken()
        }

        // ⚠️ Глобальная обработка ошибок (показ уведомлений и т.д.)
        handleError(api, result, (error) => setAppErrorAC({ error }))

        return result
    },

    endpoints: () => ({}),
})
