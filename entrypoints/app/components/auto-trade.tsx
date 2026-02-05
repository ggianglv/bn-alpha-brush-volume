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
  getMaxLoss,
  getEnableDynamicSlippage,
  sleep,
  waitForElm,
  getLatestPrice,
  getOpenOrders,
  random,
  // Algorithm helpers
  addPriceToHistory,
  clearPriceHistory,
  checkTradeConditions,
  getCooldownMultiplier,
  getTotalProfit,
  recordTrade,
  clearTradeHistory,
  getMomentum,
} from '@/entrypoints/app/utils.ts';
import { executeCutLoss } from './quick-sell.tsx';

// Status types
export type AutoTradeStatus =
  | 'idle'
  | 'ready'
  | 'cooling_down'
  | 'waiting_order'
  | 'cancelling'
  | 'cut_loss'
  | 'skipping'; // New: when algorithm conditions not met

// Extended stats for display
export interface AutoTradeStats {
  status: AutoTradeStatus;
  gap: number | null;
  orderCount: number;
  totalProfit: number;
  momentum: number | null;
  skipReason: string | null;
}

interface AutoTradeProps {
  onStatusChange?: (stats: AutoTradeStats) => void;
}

const AutoTrade = ({ onStatusChange }: AutoTradeProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<AutoTradeStatus>('idle');
  const [currentGap, setCurrentGap] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [skipReason, setSkipReason] = useState<string | null>(null);

  // Use refs to avoid useCallback/useEffect dependency issues
  const isRunningRef = useRef(false);
  const isCoolingDownRef = useRef(false);
  const hadOpenOrdersRef = useRef(false);
  const lastBuyPriceRef = useRef<number | null>(null);
  const lastSellPriceRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gapIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep isRunningRef in sync with isRunning state
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Notify parent of status/stats changes
  useEffect(() => {
    onStatusChange?.({
      status,
      gap: currentGap,
      orderCount,
      totalProfit: getTotalProfit(),
      momentum: getMomentum(),
      skipReason,
    });
  }, [status, currentGap, orderCount, skipReason, onStatusChange]);

  // Always poll gap and update price history for display, even when idle
  useEffect(() => {
    const updateGap = () => {
      const { buyPrice, sellPrice } = getLatestPrice();
      if (buyPrice && sellPrice) {
        const gap = ((sellPrice - buyPrice) / buyPrice) * 100;
        setCurrentGap(gap);

        // Add mid price to history for momentum calculation
        const midPrice = (buyPrice + sellPrice) / 2;
        addPriceToHistory(midPrice);
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

  // === Trade Execution Functions ===

  const fillBuyPrice = async (price: number, dynamicSlippage?: number) => {
    // Use dynamic slippage if provided and enabled, otherwise use fixed slippage
    const slippage =
      dynamicSlippage !== undefined && getEnableDynamicSlippage()
        ? dynamicSlippage
        : getBuySlippage();

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

    // Store for profit tracking
    lastBuyPriceRef.current = buyPrice;
  };

  const fillSellPrice = async (price: number, dynamicSlippage?: number) => {
    // Use dynamic slippage if provided and enabled, otherwise use fixed slippage
    const slippage =
      dynamicSlippage !== undefined && getEnableDynamicSlippage()
        ? dynamicSlippage
        : getSellSlippage();

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

    // Store for profit tracking
    lastSellPriceRef.current = sellPrice;
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

  const executeAutoTrade = async (dynamicSlippage?: number) => {
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

      await fillBuyPrice(latestSellPrice, dynamicSlippage);
      await sleep(random(30, 100));

      await fillSellPrice(
        useBuyPriceAsSellPrice ? latestSellPrice : latestBuyPrice,
        dynamicSlippage
      );
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
      // Clear refs to prevent false profit recording when buy order is cancelled
      lastBuyPriceRef.current = null;
      lastSellPriceRef.current = null;
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

      // Clear refs - cut-loss is a separate transaction, not the original trade
      lastBuyPriceRef.current = null;
      lastSellPriceRef.current = null;

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

    // Clear skip reason at start of each check
    setSkipReason(null);

    // If cooling down, skip
    if (isCoolingDownRef.current) {
      return;
    }

    // Track order count - check if orders just completed
    const currentlyHasOrders = hasOpenOrders();
    if (hadOpenOrdersRef.current && !currentlyHasOrders) {
      // Orders cleared - check if this was a successful trade cycle
      // Only count and record if we have both buy and sell prices (trade completed, not cancelled)
      if (lastBuyPriceRef.current && lastSellPriceRef.current) {
        const newCount = orderCount + 1;
        setOrderCount(newCount);
        console.log(`[AutoTrade] Trade cycle complete! Count: ${newCount}`);

        // Record trade profit (using stored prices)
        const volume = getVolume();
        recordTrade(lastBuyPriceRef.current, lastSellPriceRef.current, volume);
        lastBuyPriceRef.current = null;
        lastSellPriceRef.current = null;

        // Check max loss
        const maxLoss = getMaxLoss();
        const totalProfit = getTotalProfit();
        if (totalProfit < -maxLoss) {
          console.log(`[AutoTrade] Max loss reached (${totalProfit.toFixed(2)} USDT), stopping...`);
          setIsRunning(false);
          setStatus('idle');
          setSkipReason(`Max loss reached: ${totalProfit.toFixed(2)} USDT`);
          return;
        }

        const limit = getOrderLimit();
        if (limit > 0 && newCount >= limit) {
          console.log(`[AutoTrade] Order limit reached (${newCount}/${limit}), stopping...`);
          setIsRunning(false);
          setStatus('idle');
          return;
        }
      } else {
        console.log('[AutoTrade] Orders cleared but no trade recorded (likely cancelled)');
      }
    }
    hadOpenOrdersRef.current = currentlyHasOrders;

    // Handle cancel/cut-loss for stale orders
    const didCancelOrCutLoss = await handleCancelAndCutLoss(buyPrice, sellPrice);
    if (didCancelOrCutLoss) {
      // Start cooldown after cancel/cut-loss with multiplier for consecutive losses
      isCoolingDownRef.current = true;
      setStatus('cooling_down');
      const multiplier = getCooldownMultiplier();
      const cooldown = random(1000, 3000) * multiplier;
      console.log(
        `[AutoTrade] Cooling down for ${(cooldown / 1000).toFixed(1)}s after cancel/cut-loss (${multiplier.toFixed(1)}x multiplier)...`
      );
      cooldownTimeoutRef.current = setTimeout(() => {
        isCoolingDownRef.current = false;
        setStatus('ready');
      }, cooldown);
      return;
    }

    // Check for open orders first
    if (currentlyHasOrders) {
      setStatus('waiting_order');
      return;
    }

    // Check if gap is below threshold - ready to trade
    if (absGap < threshold) {
      // Check algorithm conditions before trading
      const decision = checkTradeConditions(buyPrice, sellPrice);

      if (!decision.canTrade) {
        console.log(`[AutoTrade] Skipping trade: ${decision.reason}`);
        setStatus('skipping');
        setSkipReason(decision.reason);
        return;
      }

      console.log(
        `[AutoTrade] Gap detected (|${gap.toFixed(4)}%| < ${threshold}%), executing trade...` +
          (decision.dynamicSlippage
            ? ` Dynamic slippage: ${decision.dynamicSlippage.toFixed(4)}%`
            : '')
      );

      // Set cooling down to prevent immediate re-execution
      isCoolingDownRef.current = true;
      setStatus('cooling_down');

      await executeAutoTrade(decision.dynamicSlippage);

      // Random cooldown 1-3 seconds with multiplier for consecutive losses
      const multiplier = getCooldownMultiplier();
      const cooldown = random(1000, 3000) * multiplier;
      console.log(
        `[AutoTrade] Cooling down for ${(cooldown / 1000).toFixed(1)}s (${multiplier.toFixed(1)}x multiplier)...`
      );

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
      // Stop - don't reset counter or profit
      console.log('[AutoTrade] Stopping...');
      setIsRunning(false);
      isCoolingDownRef.current = false;
      setStatus('idle');
      setSkipReason(null);
    } else {
      // Start - reset counter and profit tracking
      console.log('[AutoTrade] Starting...');
      setOrderCount(0);
      hadOpenOrdersRef.current = false;
      lastBuyPriceRef.current = null;
      lastSellPriceRef.current = null;
      clearTradeHistory();
      clearPriceHistory();
      setSkipReason(null);
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
