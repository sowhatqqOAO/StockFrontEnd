import type { LoginRequest, LoginResponse, User, GoogleLoginRequest } from '@/types'
import { decodeCredential } from 'vue3-google-login'

// Mock 用戶資料
const mockUsers: Array<{ username: string; password: string; user: User }> = [
  {
    username: 'admin',
    password: 'admin123',
    user: {
      id: '1',
      username: 'admin',
      email: 'admin@example.com'
    }
  },
  {
    username: 'demo',
    password: 'demo123',
    user: {
      id: '2',
      username: 'demo',
      email: 'demo@example.com'
    }
  }
]

// 模擬 JWT token 生成
function generateMockToken(user: User): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    sub: user.id,
    username: user.username,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24小時後過期
  }))
  const signature = btoa('mock-signature')
  return `${header}.${payload}.${signature}`
}

// 模擬登入 API
export async function mockLogin(request: LoginRequest): Promise<LoginResponse> {
  // 模擬網路延遲
  await new Promise(resolve => setTimeout(resolve, 500))

  const found = mockUsers.find(
    u => u.username === request.username && u.password === request.password
  )

  if (!found) {
    throw new Error('帳號或密碼錯誤')
  }

  return {
    token: generateMockToken(found.user),
    user: found.user
  }
}

// 模擬 Google 登入 API
export async function mockGoogleLogin(request: GoogleLoginRequest): Promise<LoginResponse> {
  await new Promise(resolve => setTimeout(resolve, 500))

  try {
    const userData = decodeCredential(request.credential) as any

    // 檢查或創建使用者
    let found = mockUsers.find(u => u.user.email === userData.email)

    if (!found) {
      // 若為新用戶，自動註冊到 mockUsers
      const newUser: User = {
        id: Date.now().toString(),
        username: userData.name || userData.email.split('@')[0],
        email: userData.email
      }
      mockUsers.push({
        username: newUser.username,
        password: 'google_oauth_no_password',
        user: newUser
      })
      found = mockUsers[mockUsers.length - 1]
    }

    if (!found) {
      throw new Error('無法建立使用者')
    }

    return {
      token: generateMockToken(found.user),
      user: found.user
    }
  } catch (error) {
    throw new Error('Google 登入驗證失敗')
  }
}

// 模擬驗證 token
export async function mockVerifyToken(token: string): Promise<User | null> {
  await new Promise(resolve => setTimeout(resolve, 100))

  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1]) {
      return null
    }
    const payload = JSON.parse(atob(parts[1]))

    if (payload.exp < Date.now()) {
      return null // Token 已過期
    }

    const found = mockUsers.find(u => u.user.id === payload.sub)
    return found?.user ?? null
  } catch {
    return null
  }
}
