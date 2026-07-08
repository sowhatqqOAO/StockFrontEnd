// 用戶資訊
export interface User {
  id: string
  username: string
  email?: string
}

// 市場類型
export type MarketType = 'TW' | 'US'

// 登入請求
export interface LoginRequest {
  username: string
  password: string
}

// Google 登入請求
export interface GoogleLoginRequest {
  credential: string
}

// 登入回應
export interface LoginResponse {
  token: string
  user: User
}

// 觀察名單 + AI 分析
export interface StockAnalysis {
  symbol: string              // "3006.TW"
  closePrice: number          // 160
  yahooUrl: string            // Yahoo Finance 連結
  category: string            // "連三天回測至5-20日線之內"
  suggestedBuyPrice: number   // 158.5
  suggestedSellPrice: number  // 172.0
  stopLossPrice: number       // 152.0
  comment: string             // 短評
  confidenceIndex: number     // 75 (百分比)
  analysisDate: string        // "2026-02-06"
  detailedAnalysis?: {
    entryLogic: string        // 進場邏輯
    targetReason: string      // 目標設定說明
    riskManagement: string    // 風險控管
  }
}

// 歷史推薦紀錄 (C# Azure Function 的真實回傳結構)
export interface HistoryRecord {
  StockCode: string
  BuyPoint: number
  SellPoint: number
  SuggestedExitPoint: number
  RecommendationDate: string
  StrategyType: string
  Ma5: number
  Ma20: number
  BacktestStatus?: BacktestStatus
  Market?: MarketType,
  AiComment?: string
  ModelProbability?: number | null   // ML 模型預測達標機率 0~1；null = 舊資料或無法計算
  BacktestPnlPercent?: number | null // 回測實際損益 %；null = 未回測或未成交
  FilteredByRegime?: boolean         // true = 被大盤濾網攔下（僅記錄未推播）
}

// 回測狀態 (對齊 C# BacktestStatusEnum，2026-07 新增 NotTriggered)
export const BacktestStatus = {
  Pending: 0,      // 尚未回測（未滿 10 個交易日）
  Success: 1,      // 觸及停利價
  Failed: 2,       // 到期未觸發停利/停損（損益照實計算）
  StopLoss: 3,     // 觸發停損
  NotTriggered: 4  // 股價從未回到買點，交易不存在（不計入勝率）
} as const
export type BacktestStatus = typeof BacktestStatus[keyof typeof BacktestStatus]

// 統計摘要（2026-07 新增期望值相關指標；null = 區間內無成交樣本）
export interface StatisticsSummary {
  Total: number
  Success: number
  Failed: number
  StopLoss: number
  Pending: number
  SuccessRate: number
  NotTriggered?: number
  FilledCount?: number
  AvgWinPercent?: number | null
  AvgLossPercent?: number | null
  PayoffRatio?: number | null
  Expectancy?: number | null
  ProfitFactor?: number | null
}

// 統計 API 回應
export interface StatisticsResponse {
  Summary: StatisticsSummary
  Details: HistoryRecord[]
  Pagination: PaginationMeta
}

// 分頁包裝資料 (C# Pagination 結構)
export interface PaginationMeta {
  CurrentPage: number
  PageSize: number
  TotalCount: number
  TotalPages: number
}

// API 分頁回應包裝 (C# 真實回傳結構)
export interface PaginatedResponse<T> {
  Data: T[]
  Pagination: PaginationMeta
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}
