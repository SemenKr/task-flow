import {useCallback, useMemo} from 'react';
import {useLocalStorage} from '@/common/hooks/useLocalStorage';

const TODOLISTS_ONBOARDING_KEY = 'todolists-onboarding-completed-v1'

export const useTodolistsOnboarding = (hasTodolists: boolean) => {
    const [isCompleted, setIsCompleted] = useLocalStorage(TODOLISTS_ONBOARDING_KEY, false)

    const isOnboardingVisible = useMemo(
        () => !hasTodolists && !isCompleted,
        [hasTodolists, isCompleted],
    )

    const completeOnboarding = useCallback(() => {
        setIsCompleted(true)
    }, [setIsCompleted])

    return {
        isOnboardingVisible,
        completeOnboarding,
        dismissOnboarding: completeOnboarding,
    }
}
