import React from 'react';
import { Button } from '@mantine/core';
import {
  getBuySlippage,
  getSellSlippage,
  getUseBuyPriceAsSellPrice,
  getVolume,
  sleep,
  waitForElm,
  getLatestPrice,
} from '@/entrypoints/app/utils.ts';

const QuickBuy = () => {
  const fillBuyPrice = (price: number) => {
    const slippage = getBuySlippage();
    const buyPrice = price * (1 + slippage / 100);
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
    const slippage = getSellSlippage();
    const sellPrice = price * (1 - slippage / 100);
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

  const fillVolume = () => {
    const input = document.getElementById('limitTotal');
    if (!input) {
      console.error('Volume input not found');
      return;
    }
    const volume = getVolume();
    (input as HTMLInputElement).value = volume.toString();
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  };

  const checkReserveOrder = () => {
    const reverseOrderCheckbox = document.querySelector('[role="checkbox"]');
    if (!reverseOrderCheckbox) {
      throw new Error('Reserve order is required');
    }
    if (reverseOrderCheckbox.ariaChecked === 'false') {
      (reverseOrderCheckbox as HTMLElement).click();
    }
  };

  const randomClickOrderBook = () => {
    const input = document.getElementById('limitPrice');
    if (!input) {
      console.error('Buy price input not found for order book click');
      return;
    }
    input.click();
    const orderBook = document.querySelector('[role="gridcell"]') as HTMLElement;
    if (!orderBook) {
      console.error('Order book not found for random click');
      return;
    }
    orderBook.click();
  };

  const executeBuy = () => {
    const buyButton = document.querySelector('.bn-button__buy');
    if (!buyButton) {
      console.error('Buy button not found');
      return;
    }
    (buyButton as HTMLButtonElement).click();
    waitForElm('[role="dialog"] .bn-button__primary').then((button) => {
      button && (button as HTMLButtonElement).click();
    });
  };

  const handleTrade = async () => {
    const { buyPrice: latestBuyPrice, sellPrice: latestSellPrice } = getLatestPrice();
    if (!latestBuyPrice || !latestSellPrice) {
      console.error('Failed to get latest price');
      return;
    }
    const useBuyPriceAsSellPrice = getUseBuyPriceAsSellPrice();
    checkReserveOrder();
    randomClickOrderBook();
    await sleep(50);
    fillBuyPrice(latestSellPrice);
    fillSellPrice(useBuyPriceAsSellPrice ? latestSellPrice : latestBuyPrice);
    fillVolume();
    executeBuy();
  };

  return (
    <Button fullWidth onClick={handleTrade} variant="outline" color="#2EBD85">
      Quick Buy
    </Button>
  );
};

export default QuickBuy;
