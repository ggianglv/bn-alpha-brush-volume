
import { createRoot } from 'react-dom/client';
import { Button, MantineProvider } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react'
import '@mantine/core/styles.css';

const SLIPAGE = 0.001;

const waitForElm = (selector: string) => {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

const QuickBuy = () => {
  const getCurrentPrice = () => {
    const orders = document.querySelectorAll('[role="gridcell"]')
    let sellPrice = 0
    Array.from(orders).forEach(el => {
      if (sellPrice) return
      const priceEl = el.querySelector('.cursor-pointer')
      const color = getComputedStyle(priceEl!).getPropertyValue('color')
      if (color === 'rgb(246, 70, 93)') {
        sellPrice = Number(priceEl?.textContent)
      }
    })

    return sellPrice
  }

  const fillBuyPrice = (price: number) => {
    const buyPrice = price * (1 + SLIPAGE)
    const input = document.getElementById('limitPrice');
    if (!input) {
      console.error("Buy price input not found");
      return;
    }
    (input as HTMLInputElement).value = buyPrice.toString();
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  }

  const fillSellPrice = (price: number) => {
    const sellPrice = price * (1 - SLIPAGE);
    const inputs = document.querySelectorAll('#limitTotal');
    const input = inputs[1];
    if (!input) {
      console.error("Sell price input not found");
      return;
    }
    (input as HTMLInputElement).value = sellPrice.toString();
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  }

  const fillVolume = (volume: number) => {
    const input = document.getElementById('limitTotal');
    if (!input) {
      console.error("Volume input not found");
      return;
    }
    (input as HTMLInputElement).value = volume.toString();
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  }

  const executeBuy = () => {
    const buyButton = document.querySelector('.bn-button__buy');
    if (!buyButton) {
      console.error("Buy button not found");
      return;
    }
    (buyButton as HTMLButtonElement).click();
    const confirmButton = document.querySelector('[role="dialog"] .bn-button__primary');
    waitForElm('[role="dialog"] .bn-button__primary').then((button) => {
      button && (button as HTMLButtonElement).click();
    });
  }

  const handleTrade = () => {
    const currentPrice = getCurrentPrice();
    if (!currentPrice) {
      console.error("Could not fetch current price");
      return;
    }
    fillBuyPrice(currentPrice);
    fillSellPrice(currentPrice);
    fillVolume(550);
    executeBuy();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Button h={40} onClick={handleTrade}>
        Trade
      </Button>
      <IconSettings size={20} style={{ cursor: 'pointer' }} />
    </div>
  );
};

export const renderQuickBuy = (container: HTMLElement) => {
  const root = createRoot(container)
  root.render(
    <MantineProvider>
      <QuickBuy />
    </MantineProvider>
  )
}

export default QuickBuy;