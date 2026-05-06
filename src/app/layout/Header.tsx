import {selectAppStatus, selectIsDemoMode, selectIsLoggedIn, setIsDemoModeAC, setIsLoggedInAC} from '@/app/appSlice';
import {baseApi} from '@/app/baseApi';
import {ResultCode} from '@/common/enums';
import {useAppDispatch} from '@/common/hooks/useAppDispatch';
import {useAppSelector} from '@/common/hooks/useAppSelector';
import {Badge} from '@/common/components/ui/badge.tsx';
import {Button} from '@/common/components/ui/button.tsx';
import {LinearProgress} from '@/common/components/ui'
import {cn} from '@/common/lib/utils.ts'
import {clearStoredAuthToken} from '@/common/utils/authStorage';
import {clearDemoModeEnabled} from '@/common/utils/demoMode';
import {ModeToggle} from '@/components/mode-toggle.tsx'
import {useLogoutMutation} from '@/feature/auth/api/authApi';
import {ListTodo} from 'lucide-react';
import {Link} from 'react-router';

export const Header = () => {
    const isLoggedIn = useAppSelector(selectIsLoggedIn)
    const isDemoMode = useAppSelector(selectIsDemoMode)
    const status = useAppSelector(selectAppStatus)

    const [logout] = useLogoutMutation()

    const dispatch = useAppDispatch()
    const logoutHandler = () => {
        if (isDemoMode) {
            clearDemoModeEnabled()
            clearStoredAuthToken()
            dispatch(setIsDemoModeAC({ isDemoMode: false }))
            dispatch(setIsLoggedInAC({ isLoggedIn: false }))
            dispatch(baseApi.util.resetApiState())
            return
        }

        logout()
            .then((res) => {
                if (res.data?.resultCode === ResultCode.Success) {
                    dispatch(setIsLoggedInAC({ isLoggedIn: false }))
                    clearStoredAuthToken()
                }
            })
            .then(() => {
                dispatch(baseApi.util.invalidateTags(["Todolist", "Task"]))
            })
    }
    return (
        <header className={cn("border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50 relative")}>
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link
                    to="/"
                    className="inline-flex items-center gap-3 rounded-xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    aria-label="Taskfolio"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_14px_30px_-18px_rgba(15,23,42,0.55)]">
                        <ListTodo className="h-5 w-5" />
                    </span>
                    <span className="hidden sm:block">
                        <span className="font-display block text-lg leading-none">Taskfolio</span>
                        <span className="text-xs text-muted-foreground">React 19, RTK Query, polished workflow</span>
                    </span>
                </Link>

                <nav className="flex items-center gap-2" aria-label="Primary">
                    {isLoggedIn && (
                        <Badge variant="outline" className="hidden rounded-full px-3 py-1 text-xs text-muted-foreground md:inline-flex">
                            {isDemoMode ? 'Demo mode' : 'API synced'}
                        </Badge>
                    )}
                    {isLoggedIn && (
                        <Button variant="outline" size="sm" onClick={logoutHandler}>
                            Log out
                        </Button>
                    )}
                    <ModeToggle />
                </nav>
            </div>
            {status === "loading" && (
                <LinearProgress className="absolute left-0 right-0 bottom-0" />
            )}
        </header>
    )
}
