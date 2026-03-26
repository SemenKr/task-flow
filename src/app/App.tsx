import './App.css'
import {setIsAuthInitializedAC, setIsLoggedInAC} from '@/app/appSlice';
import {Header} from '@/common/components/layout/Header.tsx';
import {ResultCode} from '@/common/enums';
import {useAppDispatch} from '@/common/hooks/useAppDispatch';
import {Routing} from '@/common/routing';
import {getStoredAuthToken} from '@/common/utils/authStorage';
import {ThemeProvider} from '@/components/theme-provider.tsx';
import {useMeQuery} from '@/feature/auth/api/authApi';
import {useEffect, useMemo} from 'react';
import {Toaster} from 'sonner';

export const App = () => {
    const hasStoredToken = useMemo(
        () => Boolean(getStoredAuthToken()),
        [],
    )
    const { data, isLoading } = useMeQuery(undefined, {
        skip: !hasStoredToken,
    })
    const dispatch = useAppDispatch()

    useEffect(() => {
        if (!hasStoredToken) {
            dispatch(setIsLoggedInAC({ isLoggedIn: false }))
            dispatch(setIsAuthInitializedAC({ isAuthInitialized: true }))
            return
        }

        if (isLoading) {
            return
        }

        dispatch(setIsLoggedInAC({ isLoggedIn: data?.resultCode === ResultCode.Success }))
        dispatch(setIsAuthInitializedAC({ isAuthInitialized: true }))
    }, [data?.resultCode, dispatch, hasStoredToken, isLoading])

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
