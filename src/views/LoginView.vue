<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { GoogleLogin } from 'vue3-google-login'
import type { CallbackTypes } from 'vue3-google-login'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const handleGoogleLogin: CallbackTypes.CredentialCallback = async (response) => {
  try {
    await authStore.loginWithGoogle({
      credential: response.credential
    })

    // 登入成功，導向原本要去的頁面或首頁
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch {
    // 錯誤訊息已在 store 中處理
  }
}

// 開發環境專用的緊急登入按鈕 (跳過 Google Auth)
const handleDevLogin = async () => {
  try {
    await authStore.login({
      username: 'admin',
      password: 'admin123'
    })
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch {
    // 錯誤交給 store
  }
}

// 判斷是否為本地開發環境
const isDev = import.meta.env.DEV
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full mx-4">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900">股票觀察系統</h1>
          <p class="text-gray-600 mt-2">請登入以繼續</p>
        </div>

        <!-- Error Message -->
        <div v-if="authStore.error" class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
          {{ authStore.error }}
        </div>

        <!-- Google Login -->
        <div class="flex flex-col items-center justify-center space-y-4">
          <GoogleLogin :callback="handleGoogleLogin" />
          <span v-if="authStore.loading" class="text-sm text-gray-500">登入中...</span>
        </div>

        <!-- 開發環境測試按鈕 (只在 npm run dev 時顯示) -->
        <div v-if="isDev" class="mt-8 pt-6 border-t border-gray-200 text-center">
          <p class="text-xs text-gray-400 mb-3">開發環境專用 (跳過 Google 授權)</p>
          <button
            @click="handleDevLogin"
            type="button"
            class="w-full bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
          >
            以測試帳號 (admin) 登入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
