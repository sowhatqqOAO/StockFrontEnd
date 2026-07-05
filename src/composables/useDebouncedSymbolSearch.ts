import { ref, onUnmounted } from 'vue'
import { sanitizeSymbolInput } from '@/utils/stock'

// 股票代號搜尋輸入：過濾非法字元、可選的 debounce 觸發查詢
export function useDebouncedSymbolSearch(onSearch?: () => void, delay = 500) {
    const searchQuery = ref('')
    let searchTimeout: ReturnType<typeof setTimeout> | null = null

    const handleSearchInput = (e: Event) => {
        const target = e.target as HTMLInputElement
        const filtered = sanitizeSymbolInput(target.value)
        searchQuery.value = filtered

        if (target.value !== filtered) {
            target.value = filtered
        }

        if (onSearch) {
            if (searchTimeout) clearTimeout(searchTimeout)
            searchTimeout = setTimeout(onSearch, delay)
        }
    }

    onUnmounted(() => {
        if (searchTimeout) clearTimeout(searchTimeout)
    })

    return { searchQuery, handleSearchInput }
}
