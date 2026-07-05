import type { HistoryRecord } from '@/types'

// 過濾股票代號輸入：只允許英數字與點，並轉大寫
export function sanitizeSymbolInput(raw: string): string {
    return raw.replace(/[^a-zA-Z0-9.]/g, '').toUpperCase()
}

// 依市場產生 Yahoo 股票頁連結（台股走 tw.stock.yahoo.com，其餘走 finance.yahoo.com）
export function getStockLinkUrl(code: string): string {
    if (code.endsWith('.TW') || code.endsWith('.TWO')) {
        return `https://tw.stock.yahoo.com/quote/${code}/technical-analysis`
    }
    return `https://finance.yahoo.com/quote/${code}`
}

// 格式化模型勝率：null/undefined 顯示 '-'；同時容忍 0-1 小數與 0-100 百分比兩種後端表示
export function formatProbability(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-'
    const pct = value <= 1 ? value * 100 : value
    return `${pct.toFixed(1)}%`
}

// 穩定的列 key（HistoryRecord 無 Id 欄位，同日同代號唯一）
export function recordKey(r: HistoryRecord): string {
    return `${r.RecommendationDate}-${r.StockCode}`
}
