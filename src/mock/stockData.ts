import type { StockAnalysis } from '@/types'

// Mock 股票分析資料
export const mockStockAnalysisList: StockAnalysis[] = [
  {
    symbol: '3006.TW',
    closePrice: 160,
    yahooUrl: 'https://tw.stock.yahoo.com/quote/3006.TW/technical-analysis',
    category: '連三天回測至5-20日線之內',
    suggestedBuyPrice: 158.5,
    suggestedSellPrice: 172.0,
    stopLossPrice: 152.0,
    comment: '回測月線支撐縮量站穩，建議分批佈局。',
    confidenceIndex: 75,
    analysisDate: '2026-02-06',
    detailedAnalysis: {
      entryLogic: '目前股價回測至 5-20 日均線區域，收盤價 160.0 剛好處於支撐帶上方。建議在 158.5 附近（接近均線核心支撐處）進場，以獲取更佳的風險報酬比。',
      targetReason: '出場價設定在 172.0，主要是參考前波高點附近的壓力區，預期有一段約 8% 左右的彈升空間。',
      riskManagement: '若跌破 20 日線且未能於三日內站回，建議在 152.0 執行止損，以防止回測波段起漲點。'
    }
  },
  {
    symbol: '2330.TW',
    closePrice: 890,
    yahooUrl: 'https://tw.stock.yahoo.com/quote/2330.TW/technical-analysis',
    category: '突破前高',
    suggestedBuyPrice: 885,
    suggestedSellPrice: 950,
    stopLossPrice: 860,
    comment: '量能放大突破前高，多頭格局確立。',
    confidenceIndex: 82,
    analysisDate: '2026-02-06',
    detailedAnalysis: {
      entryLogic: '股價突破前波高點 880，成交量明顯放大，顯示買盤積極進場。建議在回測 885 時進場。',
      targetReason: '目標價 950 為前波高點延伸的 1.618 倍黃金分割位。',
      riskManagement: '若跌破突破點 860，視為假突破，應立即止損。'
    }
  },
  {
    symbol: '2454.TW',
    closePrice: 1250,
    yahooUrl: 'https://tw.stock.yahoo.com/quote/2454.TW/technical-analysis',
    category: 'MACD 金叉',
    suggestedBuyPrice: 1240,
    suggestedSellPrice: 1380,
    stopLossPrice: 1180,
    comment: 'MACD 日線金叉，短線看多。',
    confidenceIndex: 68,
    analysisDate: '2026-02-06',
    detailedAnalysis: {
      entryLogic: 'MACD 指標在零軸上方形成金叉，配合股價站穩 20 日線，技術面偏多。',
      targetReason: '目標價參考前波高點 1380，約有 10% 上漲空間。',
      riskManagement: '若 MACD 再度死叉或跌破 1180 支撐，建議停損出場。'
    }
  },
  {
    symbol: '2603.TW',
    closePrice: 78.5,
    yahooUrl: 'https://tw.stock.yahoo.com/quote/2603.TW/technical-analysis',
    category: '底部反轉',
    suggestedBuyPrice: 77,
    suggestedSellPrice: 88,
    stopLossPrice: 72,
    comment: '連續三日紅K反彈，底部型態成形。',
    confidenceIndex: 60,
    analysisDate: '2026-02-06',
    detailedAnalysis: {
      entryLogic: '股價在 75 附近形成雙底型態，近三日連續收紅，顯示買盤進場。',
      targetReason: '目標價 88 為雙底頸線突破後的測量目標。',
      riskManagement: '若跌破雙底低點 72，型態失敗，應立即停損。'
    }
  }
]

// 模擬取得股票分析列表 API
export async function mockGetStockAnalysisList(): Promise<StockAnalysis[]> {
  // 模擬網路延遲
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockStockAnalysisList
}

// 模擬取得單一股票分析 API
export async function mockGetStockAnalysis(symbol: string): Promise<StockAnalysis | null> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockStockAnalysisList.find(s => s.symbol === symbol) ?? null
}
