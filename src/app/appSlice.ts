import type { RequestStatus } from "@/common/types"
import { createSlice, isFulfilled, isPending, isRejected } from "@reduxjs/toolkit"

export const appSlice = createSlice({
    name: "app",
    initialState: {
        themeMode: "light" as ThemeMode,
        status: "idle" as RequestStatus,
        error: null as string | null,
        isLoggedIn: false,
        isAuthInitialized: false,
        isDemoMode: false,
    },
    selectors: {
        selectThemeMode: (state) => state.themeMode,
        selectAppStatus: (state) => state.status,
        selectAppError: (state) => state.error,
        selectIsLoggedIn: (state) => state.isLoggedIn,
        selectIsAuthInitialized: (state) => state.isAuthInitialized,
        selectIsDemoMode: (state) => state.isDemoMode,
    },
    extraReducers: (builder) => {
        builder
            .addMatcher(isPending, (state, action) => {
                const endpointName =
                    (action as { meta?: { arg?: { endpointName?: string } } }).meta?.arg?.endpointName
                if (endpointName === "getTodolists" || endpointName === "getTasks") return
                state.status = "loading"
            })
            .addMatcher(isFulfilled, (state) => {
                state.status = "succeeded"
            })
            .addMatcher(isRejected, (state, action) => {
                state.status = "failed"
                state.error = action.error?.message ?? "Some error"
            })
    },
    reducers: (create) => ({
        changeThemeModeAC: create.reducer<{ themeMode: ThemeMode }>((state, action) => {
            state.themeMode = action.payload.themeMode
        }),
        setAppStatusAC: create.reducer<{ status: RequestStatus }>((state, action) => {
            state.status = action.payload.status
        }),
        setAppErrorAC: create.reducer<{ error: string | null }>((state, action) => {
            state.error = action.payload.error
        }),
        setIsLoggedInAC: create.reducer<{ isLoggedIn: boolean }>((state, action) => {
            state.isLoggedIn = action.payload.isLoggedIn
        }),
        setIsAuthInitializedAC: create.reducer<{ isAuthInitialized: boolean }>((state, action) => {
            state.isAuthInitialized = action.payload.isAuthInitialized
        }),
        setIsDemoModeAC: create.reducer<{ isDemoMode: boolean }>((state, action) => {
            state.isDemoMode = action.payload.isDemoMode
        }),
    }),
})

export const {
    selectThemeMode,
    selectAppStatus,
    selectAppError,
    selectIsLoggedIn,
    selectIsAuthInitialized,
    selectIsDemoMode,
} = appSlice.selectors
export const {
    changeThemeModeAC,
    setAppStatusAC,
    setAppErrorAC,
    setIsLoggedInAC,
    setIsAuthInitializedAC,
    setIsDemoModeAC,
} = appSlice.actions
export const appReducer = appSlice.reducer

export type ThemeMode = "dark" | "light"
