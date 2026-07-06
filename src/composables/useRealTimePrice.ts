import { ref } from 'vue'

// TradingView scanner：依市場批次查詢收盤價
// 台股 .TW = 上市（TWSE）、.TWO = 上櫃（TPEX）；美股嘗試三大交易所前綴
async function scanTradingView(endpoint: string, tickers: string[]): Promise<Record<string, number>> {
    const res = await fetch(`https://scanner.tradingview.com/${endpoint}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
            symbols: { tickers },
            columns: ['close']
        })
    })
    if (!res.ok) throw new Error(`TradingView scan failed: ${res.status}`)

    const data = await res.json()
    const prices: Record<string, number> = {}
    if (data && data.data) {
        data.data.forEach((item: { s: string; d: number[] }) => {
            const symbol = item.s.split(':')[1]
            if (symbol && typeof item.d?.[0] === 'number') {
                prices[symbol] = item.d[0]
            }
        })
    }
    return prices
}

export function useRealTimePrice() {
    const currentPrices = ref<Record<string, number>>({})
    const isLoadingPrices = ref(false)

    // 遞增的請求編號：晚回來的舊請求不得寫入結果或關閉 loading
    let requestId = 0

    const fetchPrices = async (symbols: string[]) => {
        if (!symbols || symbols.length === 0) return

        const id = ++requestId
        currentPrices.value = {}
        isLoadingPrices.value = true

        try {
            const twSymbols = symbols.filter(s => s.endsWith('.TW') || s.endsWith('.TWO'))
            const usSymbols = symbols.filter(s => !s.endsWith('.TW') && !s.endsWith('.TWO'))

            const promises: Promise<void>[] = []

            // 台股：TradingView 台灣 scanner（.TW→TWSE、.TWO→TPEX）
            if (twSymbols.length > 0) {
                promises.push((async () => {
                    try {
                        const tvSymbols = twSymbols.map(s =>
                            s.endsWith('.TWO') ? `TPEX:${s.split('.')[0]}` : `TWSE:${s.split('.')[0]}`
                        )
                        const prices = await scanTradingView('taiwan', tvSymbols)
                        if (id !== requestId) return

                        // 以純代號對回原始 symbol（2330 → 2330.TW）
                        for (const symbol of twSymbols) {
                            const clean = symbol.split('.')[0]!
                            if (prices[clean] !== undefined) {
                                currentPrices.value[symbol] = prices[clean]
                            }
                        }
                    } catch (error) {
                        console.error('Failed to fetch TW real-time prices:', error)
                    }
                })())
            }

            // 美股：TradingView 美國 scanner（嘗試 NASDAQ/NYSE/AMEX 前綴）
            if (usSymbols.length > 0) {
                promises.push((async () => {
                    try {
                        const tvSymbols = usSymbols.flatMap(s => [`NASDAQ:${s}`, `NYSE:${s}`, `AMEX:${s}`])
                        const prices = await scanTradingView('america', tvSymbols)
                        if (id !== requestId) return

                        for (const [symbol, price] of Object.entries(prices)) {
                            currentPrices.value[symbol] = price
                        }
                    } catch (error) {
                        console.error('Failed to fetch US real-time prices:', error)
                    }
                })())
            }

            await Promise.all(promises)
        } finally {
            if (id === requestId) {
                isLoadingPrices.value = false
            }
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
