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
      </div>
    </div>
  </div>
</template>
