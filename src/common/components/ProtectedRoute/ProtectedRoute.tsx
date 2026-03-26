import {ReactNode} from 'react';
import { Navigate, Outlet } from "react-router"
import { Path } from "@/common/routing"

type Props = {
    isAllowed: boolean
    isPending?: boolean
    pendingFallback?: ReactNode
    redirectPath?: string
}

export const ProtectedRoute = ({
    isAllowed,
    isPending = false,
    pendingFallback = null,
    redirectPath = Path.Main,
}: Props) => {
    if (isPending) {
        return <>{pendingFallback}</>
    }

    return isAllowed ? <Outlet /> : <Navigate to={redirectPath} replace />
}
