import type { HistoryRecord } from '@/types'
import { BacktestStatus } from '@/types'

// 回測狀態顯示：文字 + 顏色（4=未成交與輸贏視覺區隔）
export function getStatusInfo(status?: number): { text: string; color: string } {
    switch (status) {
        case BacktestStatus.Success:
            return { text: '達標', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' }
        case BacktestStatus.Failed:
            return { text: '到期', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' }
        case BacktestStatus.StopLoss:
            return { text: '停損', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
        case BacktestStatus.NotTriggered:
            return { text: '未成交', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' }
        case BacktestStatus.Pending:
        default:
            return { text: '驗證中', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' }
    }
}

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

// 格式化模型勝率：後端回 0~1 小數，×100 取整顯示（62%）；null = 舊資料顯示 '-'
export function formatProbability(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-'
    const pct = value <= 1 ? value * 100 : value
    return `${Math.round(pct)}%`
}

// 格式化損益 %：正數帶 + 號（+7.31% / -4.53%）；null = 未回測或未成交顯示 '-'
export function formatPnl(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-'
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

// 損益著色：正綠負紅、零或無值中性
export function pnlColorClass(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'text-gray-400 dark:text-gray-500'
    if (value > 0) return 'text-green-600 dark:text-green-400'
    if (value < 0) return 'text-red-500 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-300'
}

// 穩定的列 key（HistoryRecord 無 Id 欄位，同日同代號唯一）
export function recordKey(r: HistoryRecord): string {
    return `${r.RecommendationDate}-${r.StockCode}`
}
