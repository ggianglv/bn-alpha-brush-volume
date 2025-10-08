import { DEFAULT_BUY_SLIPPAGE, DEFAULT_SELL_SLIPPAGE, DEFAULT_VOLUME } from './constants';

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
