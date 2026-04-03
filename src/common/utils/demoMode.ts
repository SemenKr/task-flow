const DEMO_MODE_KEY = "demo-mode"

export const getDemoModeEnabled = () => localStorage.getItem(DEMO_MODE_KEY) === "true"

export const setDemoModeEnabled = () => {
    localStorage.setItem(DEMO_MODE_KEY, "true")
}

export const clearDemoModeEnabled = () => {
    localStorage.removeItem(DEMO_MODE_KEY)
}
