import { createRoot } from 'react-dom/client';
import { Button, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import Setting from '@/entrypoints/components/setting.tsx';

const SLIPAGE = 0.0002;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForElm = (selector: string) => {
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

const QuickBuy = () => {
  const getLatestPrice = () => {
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

  const fillBuyPrice = (price: number) => {
    const buyPrice = price * (1 + SLIPAGE);
    const input = document.getElementById('limitPrice');
    if (!input) {
      console.error('Buy price input not found');
      return;
    }
    (input as HTMLInputElement).value = buyPrice.toString();
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  };

  const fillSellPrice = (price: number) => {
    const sellPrice = price * (1 - 0.0005);
    const inputs = document.querySelectorAll('#limitTotal');
    const input = inputs[1];
    if (!input) {
      console.error('Sell price input not found');
      return;
    }
    (input as HTMLInputElement).value = sellPrice.toString();
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  };

  const fillVolume = (volume: number) => {
    const input = document.getElementById('limitTotal');
    if (!input) {
      console.error('Volume input not found');
      return;
    }
    (input as HTMLInputElement).value = volume.toString();
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  };

  const executeBuy = () => {
    const buyButton = document.querySelector('.bn-button__buy');
    if (!buyButton) {
      console.error('Buy button not found');
      return;
    }
    (buyButton as HTMLButtonElement).click();
    const confirmButton = document.querySelector('[role="dialog"] .bn-button__primary');
    waitForElm('[role="dialog"] .bn-button__primary').then((button) => {
      button && (button as HTMLButtonElement).click();
    });
  };

  const handleTrade = async () => {
    const { buyPrice: lastestBuyPrice, sellPrice: lastestSellPrice } = getLatestPrice();
    if (!lastestBuyPrice || !lastestSellPrice) {
      console.error('Failed to get latest price');
      return;
    }

    fillBuyPrice(lastestBuyPrice);
    fillSellPrice(lastestSellPrice);
    fillVolume(550);
    // executeBuy();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Button h={40} fullWidth onClick={handleTrade} variant="outline" color="red">
        Quick Sell
      </Button>
      <Button h={40} fullWidth onClick={handleTrade}>
        Trade
      </Button>
      <Setting />
    </div>
  );
};

export const renderQuickBuy = (container: HTMLElement) => {
  const root = createRoot(container);
  root.render(
    <MantineProvider>
      <QuickBuy />
    </MantineProvider>
  );
};

export default QuickBuy;
