import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginRequest, GoogleLoginRequest } from '@/types'

const TOKEN_KEY = 'auth_token'

// 根據環境選擇 auth service
// 開發環境使用 mock（含 DEV_TEST_TOKEN），正式環境使用真實 API
const getAuthService = async () => {
  if (import.meta.env.DEV) {
    return await import('@/mock/auth')
  } else {
    const { realLogin, realGoogleLogin, realVerifyToken } = await import('@/services/auth')
    return {
      mockLogin: realLogin,
      mockGoogleLogin: realGoogleLogin,
      mockVerifyToken: realVerifyToken
    }
  }
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // Actions
  async function login(credentials: LoginRequest) {
    loading.value = true
    error.value = null

    try {
      const authService = await getAuthService()
      const response = await authService.mockLogin(credentials)
      token.value = response.token
      user.value = response.user
      localStorage.setItem(TOKEN_KEY, response.token)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '登入失敗'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function loginWithGoogle(credentials: GoogleLoginRequest) {
    loading.value = true
    error.value = null

    try {
      const authService = await getAuthService()
      const response = await authService.mockGoogleLogin(credentials)
      token.value = response.token
      user.value = response.user
      localStorage.setItem(TOKEN_KEY, response.token)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Google 登入失敗'
      throw e
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  async function checkAuth() {
    if (!token.value) {
      return false
    }

    try {
      const authService = await getAuthService()
      const verifiedUser = await authService.mockVerifyToken(token.value)
      if (verifiedUser) {
        user.value = verifiedUser
        return true
      } else {
        logout()
        return false
      }
    } catch {
      logout()
      return false
    }
  }

  return {
    // State
    user,
    token,
    loading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    login,
    loginWithGoogle,
    logout,
    checkAuth
  }
})
