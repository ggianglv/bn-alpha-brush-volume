// === Basic Trading Settings ===
export const DEFAULT_BUY_SLIPPAGE = 0.01;
export const DEFAULT_SELL_SLIPPAGE = 0.01;
export const DEFAULT_VOLUME = 550;
export const DEFAULT_GAP_THRESHOLD = 0.1; // Tighter spread = less loss per trade
export const DEFAULT_CANCEL_THRESHOLD = 0.5; // Cancel stale orders faster
export const DEFAULT_ORDER_LIMIT = 0; // 0 = unlimited

// === Algorithm Settings (Optimized for minimizing losses) ===
export const DEFAULT_MAX_LOSS = 10; // Stop if lost more than 10 USDT
export const DEFAULT_ENABLE_MOMENTUM_CHECK = true;
export const DEFAULT_MOMENTUM_THRESHOLD = -0.1; // More conservative - only trade when stable/rising
export const DEFAULT_ENABLE_DYNAMIC_SLIPPAGE = true;
export const DEFAULT_DYNAMIC_SLIPPAGE_FACTOR = 0.4;
export const DEFAULT_MIN_SLIPPAGE = 0.03;
export const DEFAULT_ENABLE_ORDER_BOOK_CHECK = true;
export const DEFAULT_ORDER_BOOK_RATIO_THRESHOLD = 0.8; // Stricter - need strong buy pressure

// === Price History Settings ===
export const PRICE_HISTORY_SIZE = 20;
export const MOMENTUM_SAMPLE_SIZE = 5;
export const VOLATILITY_SAMPLE_SIZE = 10;
