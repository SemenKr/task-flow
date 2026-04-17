type TaskActionType = "create" | "update" | "delete" | "reorder"

const unknownErrorMessage = "Something went wrong. Please try again."

const actionErrorMessages: Record<TaskActionType, string> = {
    create: "Couldn't create the task. Please try again.",
    update: "Couldn't save task changes. Please try again.",
    delete: "Couldn't delete the task. Please try again.",
    reorder: "Couldn't save the task order. Try dragging again.",
}

const getErrorStatus = (error: unknown): number | null => {
    if (!error || typeof error !== "object") {
        return null
    }

    const status = (error as { status?: unknown }).status
    return typeof status === "number" ? status : null
}

export const getTaskActionErrorMessage = (action: TaskActionType, error: unknown) => {
    const status = getErrorStatus(error)

    if (status === 401) {
        return "Your session has expired. Sign in again and retry."
    }

    if (status === 403) {
        return "You don't have permission for this action."
    }

    if (status === 429) {
        return "Too many requests right now. Wait a moment and try again."
    }

    if (typeof status === "number" && status >= 500) {
        return "Server is temporarily unavailable. Please try again in a minute."
    }

    return actionErrorMessages[action] ?? unknownErrorMessage
}

