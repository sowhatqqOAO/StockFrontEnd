import { ref } from 'vue'

interface YahooQuoteResponse {
    chart: {
        result: Array<{
            meta: {
                regularMarketPrice: number
                symbol: string
            }
        }> | null
        error: any
    }
}

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
                // Use an open CORS proxy
                const targetUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`
                const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`

                try {
                    const res = await fetch(proxyUrl)
                    if (!res.ok) throw new Error('Fetch failed')

                    const data: YahooQuoteResponse = await res.json()

                    if (data?.chart?.result?.[0]?.meta?.regularMarketPrice) {
                        currentPrices.value[symbol] = data.chart.result[0].meta.regularMarketPrice
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
