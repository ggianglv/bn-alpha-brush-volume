import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@mantine/core';
import {
  getBuySlippage,
  getSellSlippage,
  getUseBuyPriceAsSellPrice,
  getVolume,
  getGapThreshold,
  getCancelThreshold,
  getOrderLimit,
  sleep,
  waitForElm,
  getLatestPrice,
  getOpenOrders,
  random,
} from '@/entrypoints/app/utils.ts';
import { executeCutLoss } from './quick-sell.tsx';

// Status types - added 'cancelling' and 'cut_loss'
export type AutoTradeStatus =
  | 'idle'
  | 'ready'
  | 'cooling_down'
  | 'waiting_order'
  | 'cancelling'
  | 'cut_loss';

interface AutoTradeProps {
  onStatusChange?: (status: AutoTradeStatus, gap: number | null, orderCount: number) => void;
}

const AutoTrade = ({ onStatusChange }: AutoTradeProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<AutoTradeStatus>('idle');
  const [currentGap, setCurrentGap] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState(0);

  // Use refs to avoid useCallback/useEffect dependency issues
  const isRunningRef = useRef(false);
  const isCoolingDownRef = useRef(false);
  const hadOpenOrdersRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gapIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep isRunningRef in sync with isRunning state
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Notify parent of status/gap/orderCount changes
  useEffect(() => {
    onStatusChange?.(status, currentGap, orderCount);
  }, [status, currentGap, orderCount, onStatusChange]);

  // Always poll gap for display, even when idle
  useEffect(() => {
    const updateGap = () => {
      const { buyPrice, sellPrice } = getLatestPrice();
      if (buyPrice && sellPrice) {
        const gap = ((sellPrice - buyPrice) / buyPrice) * 100;
        setCurrentGap(gap);
      }
    };

    // Initial update
    updateGap();

    // Poll every 500ms
    gapIntervalRef.current = setInterval(updateGap, 500);

    return () => {
      if (gapIntervalRef.current) {
        clearInterval(gapIntervalRef.current);
        gapIntervalRef.current = null;
      }
    };
  }, []);

  // === Check if there are open orders ===

  const hasOpenOrders = (): boolean => {
    const tableBody = document.querySelector('.bn-web-table-tbody');
    if (!tableBody) {
      return false;
    }
    const rows = tableBody.querySelectorAll('tr.bn-web-table-row');
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

  // === Cancel/Cut-Loss Logic ===

  const handleCancelAndCutLoss = async (buyPrice: number, sellPrice: number): Promise<boolean> => {
    const cancelThreshold = getCancelThreshold();
    const openOrders = getOpenOrders();

    if (openOrders.length === 0) {
      return false; // No orders to process
    }

    // Find stale BUY orders: currentBuyPrice > orderPrice * (1 + threshold%)
    const staleBuyOrders = openOrders.filter(
      (o) => o.type === 'Buy' && buyPrice > o.price * (1 + cancelThreshold / 100)
    );

    // Find stale SELL orders: currentSellPrice < orderPrice * (1 - threshold%)
    const staleSellOrders = openOrders.filter(
      (o) => o.type === 'Sell' && sellPrice < o.price * (1 - cancelThreshold / 100)
    );

    // Cancel stale buy orders
    if (staleBuyOrders.length > 0) {
      console.log(`[AutoTrade] Cancelling ${staleBuyOrders.length} stale BUY order(s)...`);
      setStatus('cancelling');
      for (const order of staleBuyOrders) {
        console.log(`[AutoTrade] Cancelling BUY order at ${order.price}`);
        order.cancelButton.click();
        await sleep(200);
      }
    }

    // Cancel ALL stale sell orders first, then execute ONE cut-loss
    if (staleSellOrders.length > 0) {
      console.log(`[AutoTrade] Cancelling ${staleSellOrders.length} stale SELL order(s)...`);
      setStatus('cancelling');
      for (const order of staleSellOrders) {
        console.log(`[AutoTrade] Cancelling SELL order at ${order.price}`);
        order.cancelButton.click();
        await sleep(200);
      }

      // Execute cut-loss after cancelling all stale sell orders
      console.log('[AutoTrade] Executing cut-loss...');
      setStatus('cut_loss');
      await executeCutLoss();

      return true; // Indicate that we did cancel/cut-loss
    }

    return staleBuyOrders.length > 0; // Return true if we cancelled any buy orders
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

    // Track order count - check if orders just completed
    const currentlyHasOrders = hasOpenOrders();
    if (hadOpenOrdersRef.current && !currentlyHasOrders) {
      // Cycle complete!
      const newCount = orderCount + 1;
      setOrderCount(newCount);
      console.log(`[AutoTrade] Order cycle complete! Count: ${newCount}`);

      const limit = getOrderLimit();
      if (limit > 0 && newCount >= limit) {
        console.log(`[AutoTrade] Order limit reached (${newCount}/${limit}), stopping...`);
        setIsRunning(false);
        setStatus('idle');
        return;
      }
    }
    hadOpenOrdersRef.current = currentlyHasOrders;

    // Handle cancel/cut-loss for stale orders
    const didCancelOrCutLoss = await handleCancelAndCutLoss(buyPrice, sellPrice);
    if (didCancelOrCutLoss) {
      // Start cooldown after cancel/cut-loss
      isCoolingDownRef.current = true;
      setStatus('cooling_down');
      const cooldown = random(1000, 3000);
      console.log(
        `[AutoTrade] Cooling down for ${(cooldown / 1000).toFixed(1)}s after cancel/cut-loss...`
      );
      cooldownTimeoutRef.current = setTimeout(() => {
        isCoolingDownRef.current = false;
        setStatus('ready');
      }, cooldown);
      return;
    }

    // Check for open orders first
    if (currentlyHasOrders) {
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
  }, [orderCount]);

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
      // Stop - don't reset counter
      console.log('[AutoTrade] Stopping...');
      setIsRunning(false);
      isCoolingDownRef.current = false;
      setStatus('idle');
    } else {
      // Start - reset counter
      console.log('[AutoTrade] Starting...');
      setOrderCount(0);
      hadOpenOrdersRef.current = false;
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
