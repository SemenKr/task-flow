import {appReducer, appSlice} from '@/app/appSlice';
import { baseApi } from "@/app/baseApi"
import { configureStore } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"

export const store = configureStore({
    reducer: {
        [appSlice.name]: appReducer,
        [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

declare global {
    interface Window {
        store?: typeof store
    }
}

// доступ к store в консоли браузера только в dev-режиме
if (import.meta.env.DEV) {
    window.store = store
}
