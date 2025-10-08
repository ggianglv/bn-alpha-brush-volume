import React from 'react';
import { Button } from '@mantine/core';
import { getLatestPrice, sleep, waitForElm } from '@/entrypoints/app/utils.ts';

const QuickSell = () => {
  const focusSellTab = () => {
    const tabs = document.querySelectorAll('.bn-tab__buySell');
    if (!tabs?.[1]) {
      console.error('Sell tab not found');
      return;
    }
    (tabs[1] as HTMLElement).click();
  };

  const fillPrice = () => {
    const { sellPrice } = getLatestPrice();
    if (!sellPrice) {
      console.error('Sell price not found');
      return;
    }
    const input = document.getElementById('limitPrice');
    if (!input) {
      console.error('Sell price input not found');
      return;
    }
    const price = sellPrice * (1 - 0.02);
    (input as HTMLInputElement).value = price.toString();
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  };

  const fillAmount = () => {
    const element = document.querySelector('.text-TertiaryText  .text-PrimaryText');
    if (!element) {
      console.error('Available balance element not found');
      return;
    }
    const text = element.textContent;
    const [amount] = text?.trim().split(' ') || [];
    if (!amount) {
      console.error('Available balance not found');
      return;
    }
    const input = document.getElementById('limitAmount');
    if (!input) {
      console.error('Sell amount input not found');
      return;
    }
    (input as HTMLInputElement).value = amount;
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  };

  const unCheckReserveOrder = () => {
    const reverseOrderCheckbox = document.querySelector('[role="checkbox"]');
    if (!reverseOrderCheckbox) {
      console.error('Reserve order checkbox not found');
      return;
    }
    if (reverseOrderCheckbox.ariaChecked === 'true') {
      (reverseOrderCheckbox as HTMLElement).click();
    }
  };

  const executeSell = () => {
    const sellButton = document.querySelector('.bn-button__sell');
    if (!sellButton) {
      console.error('Sell button not found');
      return;
    }
    (sellButton as HTMLButtonElement).click();
    waitForElm('[role="dialog"] .bn-button__primary').then((button) => {
      button && (button as HTMLButtonElement).click();
    });
  };

  const handleClick = async () => {
    focusSellTab();
    await sleep(200);
    fillPrice();
    fillAmount();
    unCheckReserveOrder();
    await sleep(300);
    executeSell();
  };

  return (
    <Button fullWidth onClick={handleClick} color="#F6465D">
      Quick Sell
    </Button>
  );
};

export default QuickSell;
