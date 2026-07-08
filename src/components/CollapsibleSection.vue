<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  defaultOpen?: boolean
}>(), {
  defaultOpen: true
})

const open = ref(props.defaultOpen)
</script>

<template>
  <section class="mb-6">
    <button type="button" @click="open = !open"
      :aria-expanded="open"
      class="w-full flex items-center justify-between px-1 py-2 mb-2 group cursor-pointer">
      <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        {{ title }}
        <slot name="title-extra" />
      </h2>
      <span class="flex items-center gap-1 text-sm text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
        {{ open ? '收合' : '展開' }}
        <svg :class="{ 'rotate-180': open }" class="h-4 w-4 transform transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </span>
    </button>
    <div v-show="open">
      <slot />
    </div>
  </section>
</template>
