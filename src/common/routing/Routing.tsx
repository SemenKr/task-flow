import {selectIsAuthInitialized, selectIsLoggedIn} from '@/app/appSlice';
import {ProtectedRoute} from '@/common/components/ProtectedRoute/ProtectedRoute';
import {Skeleton} from '@/common/components/ui/skeleton';
import {useAppSelector} from '@/common/hooks/useAppSelector';
import {lazy, Suspense} from 'react';
import {Route, Routes} from 'react-router'
import {TodolistsPageSkeleton} from '@/app/main/ui/TodolistsPageSkeleton';

const Main = lazy(async () => {
    const module = await import('@/app/Main')

    return {default: module.Main}
})

const Login = lazy(async () => {
    const module = await import('@/feature/auth/ui/Login/Login')

    return {default: module.Login}
})

const PageNotFound = lazy(async () => {
    const module = await import('@/common/components/PageNotFound/PageNotFound')

    return {default: module.PageNotFound}
})

const RouteSkeleton = () => (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="grid gap-5 lg:grid-cols-[288px_minmax(0,1fr)]">
            <div className="hidden lg:block">
                <Skeleton className="h-[28rem] w-full rounded-[28px]" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-28 w-full rounded-[28px]" />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Skeleton className="h-[22rem] w-full rounded-[24px]" />
                    <Skeleton className="h-[22rem] w-full rounded-[24px]" />
                    <Skeleton className="h-[22rem] w-full rounded-[24px] md:col-span-2 xl:col-span-1" />
                </div>
            </div>
        </div>
    </div>
)

export const Path = {
    Main: '/',
    Login: 'login',
    NotFound: '*',
} as const

export const Routing = () => {
    const isLoggedIn = useAppSelector(selectIsLoggedIn)
    const isAuthInitialized = useAppSelector(selectIsAuthInitialized)

    return (
        <Suspense fallback={<RouteSkeleton />}>
            <Routes>
                <Route
                    element={(
                        <ProtectedRoute
                            isAllowed={isLoggedIn}
                            isPending={!isAuthInitialized}
                            pendingFallback={<TodolistsPageSkeleton />}
                            redirectPath={Path.Login}
                        />
                    )}
                >
                    <Route path={Path.Main} element={<Main/>}/>
                </Route>
                <Route
                    element={(
                        <ProtectedRoute
                            isAllowed={!isLoggedIn}
                            isPending={!isAuthInitialized}
                            pendingFallback={<RouteSkeleton />}
                        />
                    )}
                >
                    <Route path={Path.Login} element={<Login/>}/>
                </Route>
                <Route path={Path.NotFound} element={<PageNotFound/>}/>
            </Routes>
        </Suspense>
    )
}
