import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@mantine/core';
import {
  getBuySlippage,
  getSellSlippage,
  getUseBuyPriceAsSellPrice,
  getVolume,
  getGapThreshold,
  getCancelThreshold,
  getEnableDynamicSlippage,
  sleep,
  waitForElm,
  getLatestPrice,
  getOpenOrders,
  random,
  // Algorithm helpers
  addPriceToHistory,
  checkTradeConditions,
  checkProactiveCutLoss,
  getMomentum,
} from '@/entrypoints/app/utils.ts';

// Signal types
export type TradingSignal = 'none' | 'buy' | 'cancel_buy' | 'cut_loss';

// Stats for display
export interface AdvancedBuyStats {
  signal: TradingSignal;
  signalReason: string | null;
  gap: number | null;
  momentum: number | null;
  hasBuyOrders: boolean;
  hasSellOrders: boolean;
}

interface AdvancedBuyProps {
  onSignalChange?: (stats: AdvancedBuyStats) => void;
}

const AdvancedBuy = ({ onSignalChange }: AdvancedBuyProps) => {
  const [signal, setSignal] = useState<TradingSignal>('none');
  const [signalReason, setSignalReason] = useState<string | null>(null);
  const [currentGap, setCurrentGap] = useState<number | null>(null);
  const [hasBuyOrders, setHasBuyOrders] = useState(false);
  const [hasSellOrders, setHasSellOrders] = useState(false);

  const monitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // === Signal Determination Logic ===

  const determineSignal = (): { type: TradingSignal; reason: string | null } => {
    const { buyPrice, sellPrice } = getLatestPrice();
    if (!buyPrice || !sellPrice) {
      return { type: 'none', reason: 'Waiting for price data...' };
    }

    const gap = ((sellPrice - buyPrice) / buyPrice) * 100;
    const openOrders = getOpenOrders();
    const buyOrders = openOrders.filter((o) => o.type === 'Buy');
    const sellOrders = openOrders.filter((o) => o.type === 'Sell');
    const hasBuy = buyOrders.length > 0;
    const hasSell = sellOrders.length > 0;
    const cancelThreshold = getCancelThreshold();
    const gapThreshold = getGapThreshold();

    // Update order state
    setHasBuyOrders(hasBuy);
    setHasSellOrders(hasSell);

    // Priority 1: Cut Loss (when holding tokens and market crashing)
    if (hasSell) {
      const cutLossCheck = checkProactiveCutLoss();
      if (cutLossCheck.shouldCutLoss) {
        return { type: 'cut_loss', reason: cutLossCheck.reason };
      }
      // Also check for stale sell orders
      for (const order of sellOrders) {
        if (sellPrice < order.price * (1 - cancelThreshold / 100)) {
          return { type: 'cut_loss', reason: 'Sell order too stale' };
        }
      }
    }

    // Priority 2: Cancel Buy Order (when buy order conditions deteriorated)
    if (hasBuy) {
      const tradeCheck = checkTradeConditions(buyPrice, sellPrice);
      if (!tradeCheck.canTrade) {
        return { type: 'cancel_buy', reason: tradeCheck.reason };
      }
      // Check for stale buy orders
      for (const order of buyOrders) {
        if (buyPrice > order.price * (1 + cancelThreshold / 100)) {
          return { type: 'cancel_buy', reason: 'Buy order too stale' };
        }
      }
      // Buy order is still valid, waiting for fill
      return { type: 'none', reason: 'Waiting for buy order to fill' };
    }

    // Priority 3: BUY (when all conditions met and no open orders)
    if (!hasBuy && !hasSell) {
      if (Math.abs(gap) < gapThreshold) {
        const tradeCheck = checkTradeConditions(buyPrice, sellPrice);
        if (tradeCheck.canTrade) {
          return { type: 'buy', reason: null };
        } else {
          return { type: 'none', reason: tradeCheck.reason };
        }
      } else {
        return { type: 'none', reason: `Gap too high: ${gap.toFixed(4)}%` };
      }
    }

    // Waiting for sell order to fill
    if (hasSell && !hasBuy) {
      return { type: 'none', reason: 'Waiting for sell order to fill' };
    }

    return { type: 'none', reason: 'Monitoring...' };
  };

  // === Always-on Monitoring Effect ===

  useEffect(() => {
    const updateMonitoring = () => {
      const { buyPrice, sellPrice } = getLatestPrice();
      if (buyPrice && sellPrice) {
        // Calculate and update gap
        const gap = ((sellPrice - buyPrice) / buyPrice) * 100;
        setCurrentGap(gap);

        // Add mid price to history for momentum calculation
        const midPrice = (buyPrice + sellPrice) / 2;
        addPriceToHistory(midPrice);
      }

      // Determine current signal
      const result = determineSignal();
      setSignal(result.type);
      setSignalReason(result.reason);
    };

    // Initial update
    updateMonitoring();

    // Poll every 500ms
    monitorIntervalRef.current = setInterval(updateMonitoring, 500);

    return () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
    };
  }, []);

  // Notify parent of signal changes
  useEffect(() => {
    onSignalChange?.({
      signal,
      signalReason,
      gap: currentGap,
      momentum: getMomentum(),
      hasBuyOrders,
      hasSellOrders,
    });
  }, [signal, signalReason, currentGap, hasBuyOrders, hasSellOrders, onSignalChange]);

  // === Trade Execution Functions (for manual Advanced Buy) ===

  const fillBuyPrice = async (price: number, dynamicSlippage?: number) => {
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
  };

  const fillSellPrice = async (price: number, dynamicSlippage?: number) => {
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

  // === Main Advanced Buy Execution (manual trigger) ===

  const executeAdvancedBuy = async () => {
    const { buyPrice: latestBuyPrice, sellPrice: latestSellPrice } = getLatestPrice();
    if (!latestBuyPrice || !latestSellPrice) {
      console.error('[AdvancedBuy] Failed to get latest price');
      return;
    }

    // Get dynamic slippage if enabled
    const decision = checkTradeConditions(latestBuyPrice, latestSellPrice);
    const dynamicSlippage = decision.dynamicSlippage;

    const useBuyPriceAsSellPrice = getUseBuyPriceAsSellPrice();

    try {
      console.log(
        `[AdvancedBuy] Executing buy...` +
          (dynamicSlippage ? ` Dynamic slippage: ${dynamicSlippage.toFixed(4)}%` : '')
      );

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
      console.log('[AdvancedBuy] Order executed successfully');
    } catch (error) {
      console.error('[AdvancedBuy] Error executing trade:', error);
    }
  };

  // === Button Handler ===

  const handleAdvancedBuy = () => {
    executeAdvancedBuy();
  };

  // === UI ===

  return (
    <Button fullWidth onClick={handleAdvancedBuy} variant="outline" color="#2EBD85">
      Advanced Buy
    </Button>
  );
};

export default AdvancedBuy;
