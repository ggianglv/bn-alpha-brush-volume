// === Basic Trading Settings ===
export const DEFAULT_BUY_SLIPPAGE = 0.01;
export const DEFAULT_SELL_SLIPPAGE = 0.01;
export const DEFAULT_VOLUME = 550;
export const DEFAULT_GAP_THRESHOLD = 0.2;
export const DEFAULT_CANCEL_THRESHOLD = 1; // 1% - threshold to cancel stale orders
export const DEFAULT_ORDER_LIMIT = 0; // 0 = unlimited

// === Algorithm Settings (Balanced preset) ===
export const DEFAULT_MAX_LOSS = 10; // Stop if lost more than 10 USDT
export const DEFAULT_ENABLE_MOMENTUM_CHECK = true;
export const DEFAULT_MOMENTUM_THRESHOLD = -0.3; // Skip buying if momentum < -0.3% (more conservative)
export const DEFAULT_ENABLE_DYNAMIC_SLIPPAGE = true;
export const DEFAULT_DYNAMIC_SLIPPAGE_FACTOR = 0.4; // Use 40% of spread as slippage (better fill rate)
export const DEFAULT_MIN_SLIPPAGE = 0.03; // Minimum slippage 0.03% (more buffer)
export const DEFAULT_ENABLE_ORDER_BOOK_CHECK = true;
export const DEFAULT_ORDER_BOOK_RATIO_THRESHOLD = 0.6; // Skip if buy/sell ratio < 0.6 (want more buy pressure)

// === Price History Settings ===
export const PRICE_HISTORY_SIZE = 20; // Keep last 20 price points
export const MOMENTUM_SAMPLE_SIZE = 5; // Use 5 prices for momentum calculation
export const VOLATILITY_SAMPLE_SIZE = 10; // Use 10 prices for volatility calculation
