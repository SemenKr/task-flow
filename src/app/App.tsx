import './App.css'
import {setIsAuthInitializedAC, setIsDemoModeAC, setIsLoggedInAC} from '@/app/appSlice';
import {Header} from '@/common/components/layout/Header.tsx';
import {ResultCode} from '@/common/enums';
import {useAppDispatch} from '@/common/hooks/useAppDispatch';
import {Routing} from '@/common/routing';
import {getDemoModeEnabled} from '@/common/utils/demoMode';
import {getStoredAuthToken} from '@/common/utils/authStorage';
import {ThemeProvider} from '@/components/theme-provider.tsx';
import {useMeQuery} from '@/feature/auth/api/authApi';
import {useEffect, useState} from 'react';
import {Toaster} from 'sonner';

export const App = () => {
    const [storageBootstrap] = useState(() => ({
        isDemoModeEnabled: getDemoModeEnabled(),
        hasStoredToken: Boolean(getStoredAuthToken()),
    }))
    const {isDemoModeEnabled, hasStoredToken} = storageBootstrap
    const { data, isLoading } = useMeQuery(undefined, {
        skip: isDemoModeEnabled || !hasStoredToken,
    })
    const dispatch = useAppDispatch()

    useEffect(() => {
        if (isDemoModeEnabled) {
            dispatch(setIsDemoModeAC({ isDemoMode: true }))
            dispatch(setIsLoggedInAC({ isLoggedIn: true }))
            dispatch(setIsAuthInitializedAC({ isAuthInitialized: true }))
            return
        }

        if (!hasStoredToken) {
            dispatch(setIsDemoModeAC({ isDemoMode: false }))
            dispatch(setIsLoggedInAC({ isLoggedIn: false }))
            dispatch(setIsAuthInitializedAC({ isAuthInitialized: true }))
            return
        }

        if (isLoading) {
            return
        }

        dispatch(setIsDemoModeAC({ isDemoMode: false }))
        dispatch(setIsLoggedInAC({ isLoggedIn: data?.resultCode === ResultCode.Success }))
        dispatch(setIsAuthInitializedAC({ isAuthInitialized: true }))
    }, [data?.resultCode, dispatch, hasStoredToken, isDemoModeEnabled, isLoading])

    return (
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <div className="min-h-screen flex flex-col bg-background">
                <Header/>
                <div className="flex-1 min-h-0">
                    <Routing />
                </div>
                <Toaster position={'bottom-center'} duration={700}/>
            </div>
        </ThemeProvider>
    )
}
