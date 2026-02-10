import type { LoginRequest, LoginResponse, User } from '@/types'

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
