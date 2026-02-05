import {
  DEFAULT_BUY_SLIPPAGE,
  DEFAULT_SELL_SLIPPAGE,
  DEFAULT_VOLUME,
  DEFAULT_GAP_THRESHOLD,
  DEFAULT_CANCEL_THRESHOLD,
  DEFAULT_ORDER_LIMIT,
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

export interface SavedSettings {
  buySlippage: number | string;
  sellSlippage: number | string;
  volume: number | string;
  useBuyPriceAsSellPrice: boolean;
  gapThreshold: number | string;
  cancelThreshold: number | string;
  orderLimit: number | string;
}

export const getSavedSettings = (): SavedSettings => {
  try {
    const savedSettings = localStorage.getItem('bn-alpha-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return {
        buySlippage: settings.buySlippage ?? DEFAULT_BUY_SLIPPAGE,
        sellSlippage: settings.sellSlippage ?? DEFAULT_SELL_SLIPPAGE,
        volume: settings.volume ?? DEFAULT_VOLUME,
        useBuyPriceAsSellPrice: settings.useBuyPriceAsSellPrice ?? false,
        gapThreshold: settings.gapThreshold ?? DEFAULT_GAP_THRESHOLD,
        cancelThreshold: settings.cancelThreshold ?? DEFAULT_CANCEL_THRESHOLD,
        orderLimit: settings.orderLimit ?? DEFAULT_ORDER_LIMIT,
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
  };
};

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

export const getLatestPrice = () => {
  const orders = document.querySelectorAll('[role="gridcell"]');
  let sellPrice = 0;
  let buyPrice = 0;
  Array.from(orders).forEach((el) => {
    const priceEl = el.querySelector('.cursor-pointer');
    const color = getComputedStyle(priceEl!).getPropertyValue('color');
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

// Open order interface for parsing orders from DOM
export interface OpenOrder {
  type: 'Buy' | 'Sell';
  price: number;
  cancelButton: HTMLElement;
}

// Parse open orders from the orders table in DOM
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
    // Extract number from price text (e.g., "0.7 USDT" -> 0.7)
    const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
    // Find the clickable cancel button (the div containing the SVG)
    const cancelButton = cancelCell.querySelector('svg')?.closest('div') as HTMLElement;

    if (type && price && cancelButton) {
      orders.push({ type, price, cancelButton });
    }
  });

  return orders;
};
