import {AUTH_TOKEN} from '@/common/constants';

export const getStoredAuthToken = () =>
    localStorage.getItem(AUTH_TOKEN) ?? sessionStorage.getItem(AUTH_TOKEN)

export const setStoredAuthToken = (token: string, rememberMe: boolean) => {
    if (rememberMe) {
        localStorage.setItem(AUTH_TOKEN, token)
        sessionStorage.removeItem(AUTH_TOKEN)
        return
    }

    sessionStorage.setItem(AUTH_TOKEN, token)
    localStorage.removeItem(AUTH_TOKEN)
}

export const clearStoredAuthToken = () => {
    localStorage.removeItem(AUTH_TOKEN)
    sessionStorage.removeItem(AUTH_TOKEN)
}
