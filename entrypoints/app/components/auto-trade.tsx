import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@mantine/core';
import {
  getBuySlippage,
  getSellSlippage,
  getUseBuyPriceAsSellPrice,
  getVolume,
  getGapThreshold,
  sleep,
  waitForElm,
  getLatestPrice,
  random,
} from '@/entrypoints/app/utils.ts';

// Status types
export type AutoTradeStatus = 'idle' | 'ready' | 'cooling_down' | 'waiting_order';

interface AutoTradeProps {
  onStatusChange?: (status: AutoTradeStatus, gap: number | null) => void;
}

const AutoTrade = ({ onStatusChange }: AutoTradeProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<AutoTradeStatus>('idle');
  const [currentGap, setCurrentGap] = useState<number | null>(null);

  // Use refs to avoid useCallback/useEffect dependency issues
  const isRunningRef = useRef(false);
  const isCoolingDownRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep isRunningRef in sync with isRunning state
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Notify parent of status/gap changes
  useEffect(() => {
    onStatusChange?.(status, currentGap);
  }, [status, currentGap, onStatusChange]);

  // === Check if there are open orders ===

  const hasOpenOrders = (): boolean => {
    // Find the open orders table body
    const tableBody = document.querySelector('.bn-web-table-tbody');
    if (!tableBody) {
      // No table found, assume no orders
      return false;
    }

    // Get all rows, excluding the hidden measure row
    const rows = tableBody.querySelectorAll('tr.bn-web-table-row');

    // If there are any visible rows, there are open orders
    return rows.length > 0;
  };

  // === Trade Execution Functions (reused from quick-buy with random delays) ===

  const fillBuyPrice = async (price: number) => {
    const slippage = getBuySlippage();
    const buyPrice = price * (1 + slippage / 100);
    const input = document.getElementById('limitPrice');
    if (!input) {
      console.error('Buy price input not found');
      return;
    }
    (input as HTMLInputElement).value = buyPrice.toString();
    await sleep(random(30, 100));
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  };

  const fillSellPrice = async (price: number) => {
    const slippage = getSellSlippage();
    const sellPrice = price * (1 - slippage / 100);
    const inputs = document.querySelectorAll('#limitTotal');
    const input = inputs[1];
    if (!input) {
      console.error('Sell price input not found');
      return;
    }
    (input as HTMLInputElement).value = sellPrice.toString();
    await sleep(random(30, 100));
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  };

  const fillVolume = async () => {
    const input = document.getElementById('limitTotal');
    if (!input) {
      console.error('Volume input not found');
      return;
    }
    const volume = getVolume();
    (input as HTMLInputElement).value = volume.toString();
    await sleep(random(30, 100));
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  };

  const checkReserveOrder = async () => {
    const reverseOrderCheckbox = document.querySelector('[role="checkbox"]');
    if (!reverseOrderCheckbox) {
      throw new Error('Reserve order is required');
    }
    if (reverseOrderCheckbox.ariaChecked === 'false') {
      (reverseOrderCheckbox as HTMLElement).click();
      await sleep(random(30, 100));
    }
  };

  const randomClickOrderBook = async () => {
    const input = document.getElementById('limitPrice');
    if (!input) {
      console.error('Buy price input not found for order book click');
      return;
    }
    input.click();
    await sleep(random(30, 100));
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

  // === Main Auto Trade Execution ===

  const executeAutoTrade = async () => {
    const { buyPrice: latestBuyPrice, sellPrice: latestSellPrice } = getLatestPrice();
    if (!latestBuyPrice || !latestSellPrice) {
      console.error('Failed to get latest price for auto trade');
      return;
    }

    const useBuyPriceAsSellPrice = getUseBuyPriceAsSellPrice();

    try {
      await checkReserveOrder();
      await sleep(random(30, 100));

      await randomClickOrderBook();
      await sleep(random(30, 100));

      await fillBuyPrice(latestSellPrice);
      await sleep(random(30, 100));

      await fillSellPrice(useBuyPriceAsSellPrice ? latestSellPrice : latestBuyPrice);
      await sleep(random(30, 100));

      await fillVolume();
      await sleep(random(30, 100));

      executeBuy();
      console.log('[AutoTrade] Order executed successfully');
    } catch (error) {
      console.error('[AutoTrade] Error executing trade:', error);
    }
  };

  // === Check and Trade Logic ===

  const checkAndTrade = useCallback(async () => {
    const { buyPrice, sellPrice } = getLatestPrice();
    if (!buyPrice || !sellPrice) {
      return;
    }

    // Calculate gap percentage: ((sell - buy) / buy) * 100
    const gap = ((sellPrice - buyPrice) / buyPrice) * 100;
    const absGap = Math.abs(gap);
    const threshold = getGapThreshold();

    // Update current gap for display
    setCurrentGap(gap);

    // If cooling down, skip
    if (isCoolingDownRef.current) {
      return;
    }

    // Check for open orders first
    if (hasOpenOrders()) {
      console.log('[AutoTrade] Open orders exist, waiting for them to complete...');
      setStatus('waiting_order');
      return;
    }

    // Check if gap is below threshold - ready to trade
    if (absGap < threshold) {
      console.log(
        `[AutoTrade] Gap detected (|${gap.toFixed(4)}%| < ${threshold}%), executing trade...`
      );

      // Set cooling down to prevent immediate re-execution
      isCoolingDownRef.current = true;
      setStatus('cooling_down');

      await executeAutoTrade();

      // Random cooldown 1-3 seconds
      const cooldown = random(1000, 3000);
      console.log(`[AutoTrade] Cooling down for ${(cooldown / 1000).toFixed(1)}s...`);

      cooldownTimeoutRef.current = setTimeout(() => {
        console.log('[AutoTrade] Cooldown complete, ready to trade again');
        isCoolingDownRef.current = false;
        setStatus('ready');
      }, cooldown);
    } else {
      // Gap is above threshold, just set ready status
      setStatus('ready');
    }
  }, []);

  // === Polling with Random Interval ===

  useEffect(() => {
    if (!isRunning) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
        cooldownTimeoutRef.current = null;
      }
      return;
    }

    const scheduleNextCheck = () => {
      // Random polling interval between 400-600ms
      const interval = random(400, 600);
      timeoutRef.current = setTimeout(async () => {
        await checkAndTrade();
        // Only schedule next check if still running
        if (isRunningRef.current) {
          scheduleNextCheck();
        }
      }, interval);
    };

    scheduleNextCheck();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
        cooldownTimeoutRef.current = null;
      }
    };
  }, [isRunning, checkAndTrade]);

  // === Button Handler ===

  const handleToggle = () => {
    if (isRunning) {
      // Stop
      console.log('[AutoTrade] Stopping...');
      setIsRunning(false);
      isCoolingDownRef.current = false;
      setStatus('idle');
      setCurrentGap(null);
    } else {
      // Start
      console.log('[AutoTrade] Starting...');
      setIsRunning(true);
      isCoolingDownRef.current = false;
      setStatus('ready');
    }
  };

  // === UI ===

  return (
    <Button
      fullWidth
      onClick={handleToggle}
      variant="outline"
      color={isRunning ? '#F6465D' : '#2EBD85'}
    >
      {isRunning ? 'Stop Auto' : 'Start Auto'}
    </Button>
  );
};

export default AutoTrade;
