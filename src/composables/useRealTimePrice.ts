import { ref } from 'vue'


export function useRealTimePrice() {
    const currentPrices = ref<Record<string, number>>({})
    const isLoadingPrices = ref(false)

    const fetchPrices = async (symbols: string[]) => {
        if (!symbols || symbols.length === 0) return

        isLoadingPrices.value = true

        // Yahoo Finance API expects TW stocks to have .TW or .TWO suffix, which they already do in DB.
        try {
            // Fetch prices concurrently for better performance
            const promises = symbols.map(async (symbol) => {
                // Remove .TW for histock
                const cleanSymbol = symbol.split('.')[0]
                const targetUrl = `https://histock.tw/stock/${cleanSymbol}`
                const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`

                try {
                    const res = await fetch(proxyUrl)
                    if (!res.ok) throw new Error('Fetch failed')

                    const html = await res.text()

                    if (html) {
                        // parsing the "股價 67.2" out of the meta tag
                        const match = html.match(/股價\s*([0-9.]+)/);
                        if (match && match[1]) {
                            currentPrices.value[symbol] = parseFloat(match[1])
                        }
                    }
                } catch (error) {
                    console.error(`Failed to fetch real-time price for ${symbol}:`, error)
                }
            })

            await Promise.all(promises)
        } finally {
            isLoadingPrices.value = false
        }
    }

    const getPrice = (symbol: string) => {
        return currentPrices.value[symbol]
    }

    return {
        currentPrices,
        isLoadingPrices,
        fetchPrices,
        getPrice
    }
}
