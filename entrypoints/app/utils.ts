import {
  DEFAULT_BUY_SLIPPAGE,
  DEFAULT_SELL_SLIPPAGE,
  DEFAULT_VOLUME,
  DEFAULT_GAP_THRESHOLD,
  DEFAULT_CANCEL_THRESHOLD,
  DEFAULT_ORDER_LIMIT,
  DEFAULT_MAX_LOSS,
  DEFAULT_ENABLE_MOMENTUM_CHECK,
  DEFAULT_MOMENTUM_THRESHOLD,
  DEFAULT_ENABLE_DYNAMIC_SLIPPAGE,
  DEFAULT_DYNAMIC_SLIPPAGE_FACTOR,
  DEFAULT_MIN_SLIPPAGE,
  DEFAULT_ENABLE_ORDER_BOOK_CHECK,
  DEFAULT_ORDER_BOOK_RATIO_THRESHOLD,
  PRICE_HISTORY_SIZE,
  MOMENTUM_SAMPLE_SIZE,
  VOLATILITY_SAMPLE_SIZE,
} from './constants';

export const waitForElm = (selector: string) => {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// === Settings Interface ===

export interface SavedSettings {
  // Basic trading settings
  buySlippage: number | string;
  sellSlippage: number | string;
  volume: number | string;
  useBuyPriceAsSellPrice: boolean;
  gapThreshold: number | string;
  cancelThreshold: number | string;
  orderLimit: number | string;
  // Algorithm settings
  maxLoss: number | string;
  enableMomentumCheck: boolean;
  momentumThreshold: number | string;
  enableDynamicSlippage: boolean;
  dynamicSlippageFactor: number | string;
  minSlippage: number | string;
  enableOrderBookCheck: boolean;
  orderBookRatioThreshold: number | string;
}

export const getSavedSettings = (): SavedSettings => {
  try {
    const savedSettings = localStorage.getItem('bn-alpha-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return {
        // Basic trading settings
        buySlippage: settings.buySlippage ?? DEFAULT_BUY_SLIPPAGE,
        sellSlippage: settings.sellSlippage ?? DEFAULT_SELL_SLIPPAGE,
        volume: settings.volume ?? DEFAULT_VOLUME,
        useBuyPriceAsSellPrice: settings.useBuyPriceAsSellPrice ?? false,
        gapThreshold: settings.gapThreshold ?? DEFAULT_GAP_THRESHOLD,
        cancelThreshold: settings.cancelThreshold ?? DEFAULT_CANCEL_THRESHOLD,
        orderLimit: settings.orderLimit ?? DEFAULT_ORDER_LIMIT,
        // Algorithm settings
        maxLoss: settings.maxLoss ?? DEFAULT_MAX_LOSS,
        enableMomentumCheck: settings.enableMomentumCheck ?? DEFAULT_ENABLE_MOMENTUM_CHECK,
        momentumThreshold: settings.momentumThreshold ?? DEFAULT_MOMENTUM_THRESHOLD,
        enableDynamicSlippage: settings.enableDynamicSlippage ?? DEFAULT_ENABLE_DYNAMIC_SLIPPAGE,
        dynamicSlippageFactor: settings.dynamicSlippageFactor ?? DEFAULT_DYNAMIC_SLIPPAGE_FACTOR,
        minSlippage: settings.minSlippage ?? DEFAULT_MIN_SLIPPAGE,
        enableOrderBookCheck: settings.enableOrderBookCheck ?? DEFAULT_ENABLE_ORDER_BOOK_CHECK,
        orderBookRatioThreshold:
          settings.orderBookRatioThreshold ?? DEFAULT_ORDER_BOOK_RATIO_THRESHOLD,
      };
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
  }

  return {
    buySlippage: DEFAULT_BUY_SLIPPAGE,
    sellSlippage: DEFAULT_SELL_SLIPPAGE,
    volume: DEFAULT_VOLUME,
    useBuyPriceAsSellPrice: false,
    gapThreshold: DEFAULT_GAP_THRESHOLD,
    cancelThreshold: DEFAULT_CANCEL_THRESHOLD,
    orderLimit: DEFAULT_ORDER_LIMIT,
    maxLoss: DEFAULT_MAX_LOSS,
    enableMomentumCheck: DEFAULT_ENABLE_MOMENTUM_CHECK,
    momentumThreshold: DEFAULT_MOMENTUM_THRESHOLD,
    enableDynamicSlippage: DEFAULT_ENABLE_DYNAMIC_SLIPPAGE,
    dynamicSlippageFactor: DEFAULT_DYNAMIC_SLIPPAGE_FACTOR,
    minSlippage: DEFAULT_MIN_SLIPPAGE,
    enableOrderBookCheck: DEFAULT_ENABLE_ORDER_BOOK_CHECK,
    orderBookRatioThreshold: DEFAULT_ORDER_BOOK_RATIO_THRESHOLD,
  };
};

// === Basic Settings Getters ===

export const getBuySlippage = (): number => {
  return Number(getSavedSettings().buySlippage);
};

export const getSellSlippage = (): number => {
  return Number(getSavedSettings().sellSlippage);
};

export const getVolume = (): number => {
  return Number(getSavedSettings().volume);
};

export const getUseBuyPriceAsSellPrice = (): boolean => {
  return getSavedSettings().useBuyPriceAsSellPrice;
};

export const getGapThreshold = (): number => {
  return Number(getSavedSettings().gapThreshold);
};

export const getCancelThreshold = (): number => {
  return Number(getSavedSettings().cancelThreshold);
};

export const getOrderLimit = (): number => {
  return Number(getSavedSettings().orderLimit);
};

// === Algorithm Settings Getters ===

export const getMaxLoss = (): number => {
  return Number(getSavedSettings().maxLoss);
};

export const getEnableMomentumCheck = (): boolean => {
  return getSavedSettings().enableMomentumCheck;
};

export const getMomentumThreshold = (): number => {
  return Number(getSavedSettings().momentumThreshold);
};

export const getEnableDynamicSlippage = (): boolean => {
  return getSavedSettings().enableDynamicSlippage;
};

export const getDynamicSlippageFactor = (): number => {
  return Number(getSavedSettings().dynamicSlippageFactor);
};

export const getMinSlippage = (): number => {
  return Number(getSavedSettings().minSlippage);
};

export const getEnableOrderBookCheck = (): boolean => {
  return getSavedSettings().enableOrderBookCheck;
};

export const getOrderBookRatioThreshold = (): number => {
  return Number(getSavedSettings().orderBookRatioThreshold);
};

export const saveSettings = (settings: SavedSettings): boolean => {
  try {
    localStorage.setItem('bn-alpha-settings', JSON.stringify(settings));
    console.log('Settings saved successfully');
    return true;
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
    return false;
  }
};

// === Price Functions ===

export const getLatestPrice = () => {
  const orders = document.querySelectorAll('[role="gridcell"]');
  let sellPrice = 0;
  let buyPrice = 0;
  Array.from(orders).forEach((el) => {
    const priceEl = el.querySelector('.cursor-pointer');
    if (!priceEl) return;
    const color = getComputedStyle(priceEl).getPropertyValue('color');
    if (color === 'rgb(246, 70, 93)' && !sellPrice) {
      sellPrice = Number(priceEl?.textContent);
    }

    if (color === 'rgb(46, 189, 133)' && !buyPrice) {
      buyPrice = Number(priceEl?.textContent);
    }
  });

  return { sellPrice, buyPrice };
};

export const random = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

// === Open Orders ===

export interface OpenOrder {
  type: 'Buy' | 'Sell';
  price: number;
  cancelButton: HTMLElement;
}

export const getOpenOrders = (): OpenOrder[] => {
  const orders: OpenOrder[] = [];
  const tableBody = document.querySelector('.bn-web-table-tbody');
  if (!tableBody) return orders;

  const rows = tableBody.querySelectorAll('tr.bn-web-table-row');
  rows.forEach((row) => {
    const typeCell = row.querySelector('[aria-colindex="4"]');
    const priceCell = row.querySelector('[aria-colindex="5"]');
    const cancelCell = row.querySelector('[aria-colindex="11"]');

    if (!typeCell || !priceCell || !cancelCell) return;

    const type = typeCell.textContent?.trim() as 'Buy' | 'Sell';
    const priceText = priceCell.textContent?.trim() || '0';
    const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
    const cancelButton = cancelCell.querySelector('svg')?.closest('div') as HTMLElement;

    if (type && price && cancelButton) {
      orders.push({ type, price, cancelButton });
    }
  });

  return orders;
};

// === Trade Record & Profit Tracking ===

export interface TradeRecord {
  buyPrice: number;
  sellPrice: number;
  volume: number;
  profit: number; // In USDT
  timestamp: number;
}

// Store trades in memory (resets on page reload)
const tradeHistory: TradeRecord[] = [];

export const recordTrade = (buyPrice: number, sellPrice: number, volume: number): TradeRecord => {
  const tokenAmount = volume / buyPrice;
  const sellValue = tokenAmount * sellPrice;
  const profit = sellValue - volume;

  const record: TradeRecord = {
    buyPrice,
    sellPrice,
    volume,
    profit,
    timestamp: Date.now(),
  };

  tradeHistory.push(record);
  console.log(
    `[Trade] Buy: ${buyPrice.toFixed(6)}, Sell: ${sellPrice.toFixed(6)}, ` +
      `Profit: ${profit.toFixed(4)} USDT, Total: ${getTotalProfit().toFixed(4)} USDT`
  );

  return record;
};

export const getTotalProfit = (): number => {
  return tradeHistory.reduce((sum, t) => sum + t.profit, 0);
};

export const getTradeCount = (): number => {
  return tradeHistory.length;
};

export const getTradeHistory = (): TradeRecord[] => {
  return [...tradeHistory];
};

export const clearTradeHistory = (): void => {
  tradeHistory.length = 0;
};

export const getConsecutiveLosses = (): number => {
  let count = 0;
  for (let i = tradeHistory.length - 1; i >= 0; i--) {
    if (tradeHistory[i].profit < 0) {
      count++;
    } else {
      break;
    }
  }
  return count;
};

// === Price History & Momentum ===

const priceHistory: number[] = [];

export const addPriceToHistory = (price: number): void => {
  priceHistory.push(price);
  // Keep only last N prices
  if (priceHistory.length > PRICE_HISTORY_SIZE) {
    priceHistory.shift();
  }
};

export const getPriceHistory = (): number[] => {
  return [...priceHistory];
};

export const clearPriceHistory = (): void => {
  priceHistory.length = 0;
};

/**
 * Calculate momentum as percentage change between recent and older price averages
 * Positive = price going up, Negative = price going down
 */
export const getMomentum = (): number | null => {
  if (priceHistory.length < MOMENTUM_SAMPLE_SIZE * 2) {
    return null; // Not enough data
  }

  const recent = priceHistory.slice(-MOMENTUM_SAMPLE_SIZE);
  const older = priceHistory.slice(-MOMENTUM_SAMPLE_SIZE * 2, -MOMENTUM_SAMPLE_SIZE);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  return ((recentAvg - olderAvg) / olderAvg) * 100;
};

/**
 * Calculate price volatility (standard deviation as percentage of mean)
 */
export const getVolatility = (): number | null => {
  if (priceHistory.length < VOLATILITY_SAMPLE_SIZE) {
    return null; // Not enough data
  }

  const prices = priceHistory.slice(-VOLATILITY_SAMPLE_SIZE);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  return (stdDev / avg) * 100;
};

/**
 * Calculate dynamic slippage based on current spread
 */
export const getDynamicSlippageValue = (buyPrice: number, sellPrice: number): number => {
  const spread = ((sellPrice - buyPrice) / buyPrice) * 100;
  const factor = getDynamicSlippageFactor();
  const minSlippage = getMinSlippage();

  return Math.max(minSlippage, spread * factor);
};

// === Order Book Depth Analysis ===

export interface OrderBookDepth {
  buyVolume: number;
  sellVolume: number;
  ratio: number; // buyVolume / sellVolume
  buyCount: number;
  sellCount: number;
}

/**
 * Analyze order book depth from DOM
 * Returns volume ratio: > 1 means more buy pressure, < 1 means more sell pressure
 */
export const getOrderBookDepth = (): OrderBookDepth => {
  const orders = document.querySelectorAll('[role="gridcell"]');
  let buyVolume = 0;
  let sellVolume = 0;
  let buyCount = 0;
  let sellCount = 0;

  Array.from(orders).forEach((el) => {
    const priceEl = el.querySelector('.cursor-pointer');
    if (!priceEl) return;

    const color = getComputedStyle(priceEl).getPropertyValue('color');
    // Try to find volume in the same row (sibling cells)
    const row = el.closest('[role="row"]');
    if (!row) return;

    const cells = row.querySelectorAll('[role="gridcell"]');
    // Volume is typically in the second cell
    const volumeCell = cells[1];
    const volumeText = volumeCell?.textContent?.trim() || '0';
    const volume = parseFloat(volumeText.replace(/[^\d.]/g, '')) || 0;

    if (color === 'rgb(246, 70, 93)') {
      // Sell (red)
      sellVolume += volume;
      sellCount++;
    } else if (color === 'rgb(46, 189, 133)') {
      // Buy (green)
      buyVolume += volume;
      buyCount++;
    }
  });

  const ratio = sellVolume > 0 ? buyVolume / sellVolume : 1;

  return { buyVolume, sellVolume, ratio, buyCount, sellCount };
};

// === Algorithm Decision Helpers ===

export interface TradeDecision {
  canTrade: boolean;
  reason: string;
  dynamicSlippage?: number;
}

/**
 * Check all algorithm conditions and return trade decision
 */
export const checkTradeConditions = (buyPrice: number, sellPrice: number): TradeDecision => {
  // Check max loss
  const maxLoss = getMaxLoss();
  const totalProfit = getTotalProfit();
  if (totalProfit < -maxLoss) {
    return {
      canTrade: false,
      reason: `Max loss reached (${totalProfit.toFixed(2)} USDT)`,
    };
  }

  // Check momentum
  if (getEnableMomentumCheck()) {
    const momentum = getMomentum();
    const threshold = getMomentumThreshold();
    if (momentum !== null && momentum < threshold) {
      return {
        canTrade: false,
        reason: `Negative momentum (${momentum.toFixed(2)}% < ${threshold}%)`,
      };
    }
  }

  // Check order book
  if (getEnableOrderBookCheck()) {
    const depth = getOrderBookDepth();
    const ratioThreshold = getOrderBookRatioThreshold();
    if (depth.ratio < ratioThreshold) {
      return {
        canTrade: false,
        reason: `Order book imbalanced (ratio: ${depth.ratio.toFixed(2)} < ${ratioThreshold})`,
      };
    }
  }

  // Calculate dynamic slippage if enabled
  let dynamicSlippage: number | undefined;
  if (getEnableDynamicSlippage()) {
    dynamicSlippage = getDynamicSlippageValue(buyPrice, sellPrice);
  }

  return {
    canTrade: true,
    reason: 'All conditions passed',
    dynamicSlippage,
  };
};

/**
 * Calculate cooldown multiplier based on consecutive losses
 */
export const getCooldownMultiplier = (): number => {
  const losses = getConsecutiveLosses();
  return 1 + losses * 0.5; // 1x, 1.5x, 2x, 2.5x...
};
