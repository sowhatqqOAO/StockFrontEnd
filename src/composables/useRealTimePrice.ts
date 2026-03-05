import { ref } from 'vue'


export function useRealTimePrice() {
    const currentPrices = ref<Record<string, number>>({})
    const isLoadingPrices = ref(false)

    const fetchPrices = async (symbols: string[]) => {
        if (!symbols || symbols.length === 0) return

        isLoadingPrices.value = true

        // Yahoo Finance API expects TW stocks to have .TW or .TWO suffix, which they already do in DB.
        try {
            const twSymbols = symbols.filter(s => s.endsWith('.TW') || s.endsWith('.TWO'))
            const usSymbols = symbols.filter(s => !s.endsWith('.TW') && !s.endsWith('.TWO'))

            const promises: Promise<void>[] = []

            // Fetch TW prices via HiStock + Proxy
            if (twSymbols.length > 0) {
                promises.push(...twSymbols.map(async (symbol) => {
                    const cleanSymbol = symbol.split('.')[0]
                    const targetUrl = `https://histock.tw/stock/${cleanSymbol}`
                    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`

                    try {
                        const res = await fetch(proxyUrl)
                        if (!res.ok) throw new Error('Fetch failed')

                        const html = await res.text()

                        if (html) {
                            const match = html.match(/股價\s*([0-9.]+)/)
                            if (match && match[1]) {
                                currentPrices.value[symbol] = parseFloat(match[1])
                            }
                        }
                    } catch (error) {
                        console.error(`Failed to fetch TW real-time price for ${symbol}:`, error)
                    }
                }))
            }

            // Fetch US prices via TradingView Scanner
            if (usSymbols.length > 0) {
                promises.push((async () => {
                    try {
                        // TradingView needs exchange prefixes
                        const tvSymbols = usSymbols.flatMap(s => [`NASDAQ:${s}`, `NYSE:${s}`, `AMEX:${s}`])

                        const res = await fetch('https://scanner.tradingview.com/america/scan', {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain' },
                            body: JSON.stringify({
                                symbols: { tickers: tvSymbols },
                                columns: ["close"]
                            })
                        })
                        if (!res.ok) throw new Error('Fetch failed')

                        const data = await res.json()
                        if (data && data.data) {
                            data.data.forEach((item: any) => {
                                const symbol = item.s.split(':')[1]
                                currentPrices.value[symbol] = item.d[0]
                            })
                        }
                    } catch (error) {
                        console.error(`Failed to fetch US real-time prices:`, error)
                    }
                })())
            }

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
