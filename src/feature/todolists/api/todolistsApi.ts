import { baseApi } from "@/app/baseApi"
import type { BaseResponse } from "@/common/types"
import type {DomainTodolist} from '@/feature/todolists/libs/types';
import type { Todolist } from "./todolistsApi.types"

export const todolistsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTodolists: build.query<DomainTodolist[], void>({
      query: () => "todo-lists",
      transformResponse: (todolists: Todolist[]): DomainTodolist[] =>
          todolists.map((todolist) => ({ ...todolist, filter: "all", entityStatus: "idle" })),
      providesTags: ["Todolist"],
    }),
    addTodolist: build.mutation<BaseResponse<{ item: Todolist }>, string>({
      query: (title) => ({
        url: "todo-lists",
        method: "POST",
        body: { title },
      }),

      async onQueryStarted(title, { dispatch, queryFulfilled }) {
        // 🆕 создаём временный id
        const tempId = `temp-${Date.now()}`

        // 🧠 создаём временный todolist
        const newTodolist: DomainTodolist = {
          id: tempId,
          title,
          addedDate: new Date().toISOString(),
          order: 0,
          filter: "all",
          entityStatus: "loading", // можно показать spinner
        }

        // 🛠 добавляем в кэш
        const patchResult = dispatch(
            todolistsApi.util.updateQueryData("getTodolists", undefined, (state) => {
              state.unshift(newTodolist)
            }),
        )

        try {
          const { data } = await queryFulfilled

          const real = data.data.item

          // 🔁 заменяем temp на реальный
          dispatch(
              todolistsApi.util.updateQueryData("getTodolists", undefined, (state) => {
                const index = state.findIndex((t) => t.id === tempId)
                if (index !== -1) {
                  state[index] = {
                    ...real,
                    filter: "all",
                    entityStatus: "idle",
                  }
                }
              }),
          )
        } catch {
          // ❌ откат
          patchResult.undo()
        }
      },

      // invalidatesTags: ["Todolist"],
    }),
    removeTodolist: build.mutation<BaseResponse, string>({
      query: (id) => ({
        url: `todo-lists/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
            todolistsApi.util.updateQueryData("getTodolists", undefined, (state) => {
              const index = state.findIndex((todolist) => todolist.id === id)
              if (index !== -1) {
                state.splice(index, 1)
              }
            }),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: ["Todolist"],
    }),
    updateTodolistTitle: build.mutation<BaseResponse, { id: string; title: string }>({
      query: ({ id, title }) => ({
        url: `todo-lists/${id}`,
        method: "PUT",
        body: { title },
      }),
      invalidatesTags: ["Todolist"],
    }),
    reorderTodolist: build.mutation<
        BaseResponse,
        { todolistId: string; putAfterItemId: string | null }
    >({
      query: ({ todolistId, putAfterItemId }) => ({
        url: `todo-lists/${todolistId}/reorder`,
        method: "PUT",
        body: { putAfterItemId },
      }),

      async onQueryStarted(
          { todolistId, putAfterItemId },
          { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
            todolistsApi.util.updateQueryData("getTodolists", undefined, (state) => {
              const sourceIndex = state.findIndex((todolist) => todolist.id === todolistId)
              if (sourceIndex === -1) return

              const [movedTodolist] = state.splice(sourceIndex, 1)
              if (!movedTodolist) return

              if (putAfterItemId === null) {
                state.unshift(movedTodolist)
                return
              }

              const targetIndex = state.findIndex((todolist) => todolist.id === putAfterItemId)

              if (targetIndex === -1) {
                state.splice(sourceIndex, 0, movedTodolist)
                return
              }

              state.splice(targetIndex + 1, 0, movedTodolist)
            })
        )

        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),
  }),
})

export const {
  useGetTodolistsQuery,
  useAddTodolistMutation,
  useRemoveTodolistMutation,
  useUpdateTodolistTitleMutation,
  useReorderTodolistMutation,
} = todolistsApi
