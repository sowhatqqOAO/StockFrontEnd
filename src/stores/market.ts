import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { MarketType } from '@/types'

export const useMarketStore = defineStore('market', () => {
    // 從 localStorage 讀取上次選擇的市場，預設台股
    const savedMarket = (localStorage.getItem('market_type') as MarketType) || 'TW'
    const currentMarket = ref<MarketType>(savedMarket)

    const setMarket = (market: MarketType) => {
        currentMarket.value = market
    }

    // 監聽變更並儲存到 localStorage
    watch(currentMarket, (newVal) => {
        localStorage.setItem('market_type', newVal)
    })

    return {
        currentMarket,
        setMarket
    }
})
