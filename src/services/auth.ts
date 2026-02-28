import type { LoginRequest, LoginResponse, GoogleLoginRequest, User } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * 正式環境 Google 登入
 * 將 Google credential 送給後端驗證並取得 token
 */
export async function realGoogleLogin(request: GoogleLoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: request.credential })
    })

    if (!response.ok) {
        throw new Error('Google 登入失敗')
    }

    return await response.json() as LoginResponse
}

/**
 * 正式環境 Token 驗證
 */
export async function realVerifyToken(token: string): Promise<User | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!response.ok) return null
        return await response.json() as User
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
