import './App.css'
import {setIsLoggedInAC} from '@/app/appSlice';
import {Header} from '@/common/components/layout/Header.tsx';
import {CircularProgress} from '@/common/components/ui';
import {ResultCode} from '@/common/enums';
import {useAppDispatch} from '@/common/hooks/useAppDispatch';
import {Routing} from '@/common/routing';
import {ThemeProvider} from '@/components/theme-provider.tsx';
import {useMeQuery} from '@/feature/auth/api/authApi';
import {useEffect, useState} from 'react';
import {Toaster} from 'sonner';


export const App = () => {
    const [isInitialized, setIsInitialized] = useState(false)
    const { data, isLoading } = useMeQuery()
    const dispatch = useAppDispatch()
    useEffect(() => {
        if (isLoading) return
        if (data?.resultCode === ResultCode.Success) {
            dispatch(setIsLoggedInAC({ isLoggedIn: true }))
        }
        setIsInitialized(true)
    }, [isLoading])

    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <CircularProgress size={150} thickness={3} />
            </div>
        )
    }

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
