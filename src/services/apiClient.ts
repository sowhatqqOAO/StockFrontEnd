import router from '@/router'
import { useAuthStore } from '@/stores/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export class ApiError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'ApiError'
        this.status = status
    }
}

// 統一的 API 請求：帶 token、失敗時擲 ApiError、401 時登出並導向登入頁。
// 注意：登入/驗證流程（services/auth.ts）不走這裡，避免 401 循環導向。
export async function apiFetch<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const token = localStorage.getItem('auth_token') || ''

    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
        if (value !== '') {
            query.set(key, String(value))
        }
    }
    const qs = query.toString()
    const url = `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (response.status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
        throw new ApiError(401, '登入已過期，請重新登入')
    }

    if (!response.ok) {
        throw new ApiError(response.status, 'API 請求失敗')
    }

    return await response.json() as T
}
