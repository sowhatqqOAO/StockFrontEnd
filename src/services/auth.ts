import type { LoginRequest, LoginResponse, GoogleLoginRequest, User } from '@/types'
import { decodeCredential } from 'vue3-google-login'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * 正式環境 Google 登入
 * 後端沒有獨立的 auth endpoint，而是透過 GoogleAuthMiddleware
 * 在每個 API request 的 Authorization header 驗證 Google credential。
 * 因此前端直接把 credential 當作 token 存起來即可。
 */
export async function realGoogleLogin(request: GoogleLoginRequest): Promise<LoginResponse> {
    // 解碼 credential 取得使用者資訊
    const userData = decodeCredential(request.credential) as any

    if (!userData || !userData.email) {
        throw new Error('Google 登入驗證失敗')
    }

    // 用一個輕量 API 確認 credential 有效（例如呼叫 history 拿 1 筆）
    const verifyResponse = await fetch(`${API_BASE_URL}/api/history?page=1&pageSize=1`, {
        headers: {
            'Authorization': `Bearer ${request.credential}`
        }
    })

    if (!verifyResponse.ok) {
        throw new Error('Google 登入驗證失敗，請確認帳號已被授權')
    }

    // credential 直接當 token 用
    return {
        token: request.credential,
        user: {
            id: userData.sub || userData.email,
            username: userData.name || userData.email.split('@')[0],
            email: userData.email
        }
    }
}

/**
 * 正式環境 Token 驗證
 * 呼叫任意 API 確認 token 是否仍有效
 */
export async function realVerifyToken(token: string): Promise<User | null> {
    try {
        // 嘗試解碼 token 取得使用者資訊
        const userData = decodeCredential(token) as any
        if (!userData || !userData.email) return null

        // 確認 token 還能通過後端驗證
        const response = await fetch(`${API_BASE_URL}/api/history?page=1&pageSize=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!response.ok) return null

        return {
            id: userData.sub || userData.email,
            username: userData.name || userData.email.split('@')[0],
            email: userData.email
        }
    } catch {
        return null
    }
}

/**
 * 正式環境不支援帳密登入，僅支援 Google 登入
 */
export async function realLogin(_request: LoginRequest): Promise<LoginResponse> {
    throw new Error('正式環境僅支援 Google 登入')
}
