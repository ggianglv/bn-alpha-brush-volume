import React, { useState, useEffect } from 'react';
import { Popover, Checkbox, NumberInput, Button, Tabs } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import {
  DEFAULT_BUY_SLIPPAGE,
  DEFAULT_SELL_SLIPPAGE,
  DEFAULT_VOLUME,
  DEFAULT_GAP_THRESHOLD,
  DEFAULT_CANCEL_THRESHOLD,
  DEFAULT_ORDER_LIMIT,
  DEFAULT_MAX_LOSS,
  DEFAULT_ENABLE_MOMENTUM_CHECK,
  DEFAULT_MOMENTUM_THRESHOLD,
  DEFAULT_ENABLE_DYNAMIC_SLIPPAGE,
  DEFAULT_DYNAMIC_SLIPPAGE_FACTOR,
  DEFAULT_MIN_SLIPPAGE,
  DEFAULT_ENABLE_ORDER_BOOK_CHECK,
  DEFAULT_ORDER_BOOK_RATIO_THRESHOLD,
  DEFAULT_ENABLE_PROACTIVE_CUT_LOSS,
  DEFAULT_PROACTIVE_MOMENTUM_THRESHOLD,
  DEFAULT_PROACTIVE_ORDER_BOOK_THRESHOLD,
} from '@/entrypoints/app/constants.ts';
import { saveSettings, getSavedSettings } from '@/entrypoints/app/utils.ts';

const Setting = () => {
  // Basic trading settings
  const [buySlippage, setBuySlippage] = useState<number | string>(DEFAULT_BUY_SLIPPAGE);
  const [sellSlippage, setSellSlippage] = useState<number | string>(DEFAULT_SELL_SLIPPAGE);
  const [volume, setVolume] = useState<number | string>(DEFAULT_VOLUME);
  const [useBuyPriceAsSellPrice, setUseBuyPriceAsSellPrice] = useState<boolean>(false);
  const [gapThreshold, setGapThreshold] = useState<number | string>(DEFAULT_GAP_THRESHOLD);
  const [cancelThreshold, setCancelThreshold] = useState<number | string>(DEFAULT_CANCEL_THRESHOLD);
  const [orderLimit, setOrderLimit] = useState<number | string>(DEFAULT_ORDER_LIMIT);

  // Algorithm settings
  const [maxLoss, setMaxLoss] = useState<number | string>(DEFAULT_MAX_LOSS);
  const [enableMomentumCheck, setEnableMomentumCheck] = useState<boolean>(
    DEFAULT_ENABLE_MOMENTUM_CHECK
  );
  const [momentumThreshold, setMomentumThreshold] = useState<number | string>(
    DEFAULT_MOMENTUM_THRESHOLD
  );
  const [enableDynamicSlippage, setEnableDynamicSlippage] = useState<boolean>(
    DEFAULT_ENABLE_DYNAMIC_SLIPPAGE
  );
  const [dynamicSlippageFactor, setDynamicSlippageFactor] = useState<number | string>(
    DEFAULT_DYNAMIC_SLIPPAGE_FACTOR
  );
  const [minSlippage, setMinSlippage] = useState<number | string>(DEFAULT_MIN_SLIPPAGE);
  const [enableOrderBookCheck, setEnableOrderBookCheck] = useState<boolean>(
    DEFAULT_ENABLE_ORDER_BOOK_CHECK
  );
  const [orderBookRatioThreshold, setOrderBookRatioThreshold] = useState<number | string>(
    DEFAULT_ORDER_BOOK_RATIO_THRESHOLD
  );

  // Proactive cut-loss settings
  const [enableProactiveCutLoss, setEnableProactiveCutLoss] = useState<boolean>(
    DEFAULT_ENABLE_PROACTIVE_CUT_LOSS
  );
  const [proactiveMomentumThreshold, setProactiveMomentumThreshold] = useState<number | string>(
    DEFAULT_PROACTIVE_MOMENTUM_THRESHOLD
  );
  const [proactiveOrderBookThreshold, setProactiveOrderBookThreshold] = useState<number | string>(
    DEFAULT_PROACTIVE_ORDER_BOOK_THRESHOLD
  );

  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const settings = getSavedSettings();
    // Basic settings
    setBuySlippage(settings.buySlippage);
    setSellSlippage(settings.sellSlippage);
    setVolume(settings.volume);
    setUseBuyPriceAsSellPrice(settings.useBuyPriceAsSellPrice);
    setGapThreshold(settings.gapThreshold);
    setCancelThreshold(settings.cancelThreshold);
    setOrderLimit(settings.orderLimit);
    // Algorithm settings
    setMaxLoss(settings.maxLoss);
    setEnableMomentumCheck(settings.enableMomentumCheck);
    setMomentumThreshold(settings.momentumThreshold);
    setEnableDynamicSlippage(settings.enableDynamicSlippage);
    setDynamicSlippageFactor(settings.dynamicSlippageFactor);
    setMinSlippage(settings.minSlippage);
    setEnableOrderBookCheck(settings.enableOrderBookCheck);
    setOrderBookRatioThreshold(settings.orderBookRatioThreshold);
    // Proactive cut-loss settings
    setEnableProactiveCutLoss(settings.enableProactiveCutLoss);
    setProactiveMomentumThreshold(settings.proactiveMomentumThreshold);
    setProactiveOrderBookThreshold(settings.proactiveOrderBookThreshold);
  }, []);

  const handleSave = () => {
    const settings = {
      // Basic settings
      buySlippage,
      sellSlippage,
      volume,
      useBuyPriceAsSellPrice,
      gapThreshold,
      cancelThreshold,
      orderLimit,
      // Algorithm settings
      maxLoss,
      enableMomentumCheck,
      momentumThreshold,
      enableDynamicSlippage,
      dynamicSlippageFactor,
      minSlippage,
      enableOrderBookCheck,
      orderBookRatioThreshold,
      // Proactive cut-loss settings
      enableProactiveCutLoss,
      proactiveMomentumThreshold,
      proactiveOrderBookThreshold,
    };

    const success = saveSettings(settings);
    if (success) {
      setOpened(false);
      window.location.reload();
    }
  };

  const handleCancel = () => {
    setOpened(false);
  };

  const handleReset = () => {
    // Reset all settings to defaults
    setBuySlippage(DEFAULT_BUY_SLIPPAGE);
    setSellSlippage(DEFAULT_SELL_SLIPPAGE);
    setVolume(DEFAULT_VOLUME);
    setUseBuyPriceAsSellPrice(false);
    setGapThreshold(DEFAULT_GAP_THRESHOLD);
    setCancelThreshold(DEFAULT_CANCEL_THRESHOLD);
    setOrderLimit(DEFAULT_ORDER_LIMIT);
    setMaxLoss(DEFAULT_MAX_LOSS);
    setEnableMomentumCheck(DEFAULT_ENABLE_MOMENTUM_CHECK);
    setMomentumThreshold(DEFAULT_MOMENTUM_THRESHOLD);
    setEnableDynamicSlippage(DEFAULT_ENABLE_DYNAMIC_SLIPPAGE);
    setDynamicSlippageFactor(DEFAULT_DYNAMIC_SLIPPAGE_FACTOR);
    setMinSlippage(DEFAULT_MIN_SLIPPAGE);
    setEnableOrderBookCheck(DEFAULT_ENABLE_ORDER_BOOK_CHECK);
    setOrderBookRatioThreshold(DEFAULT_ORDER_BOOK_RATIO_THRESHOLD);
    setEnableProactiveCutLoss(DEFAULT_ENABLE_PROACTIVE_CUT_LOSS);
    setProactiveMomentumThreshold(DEFAULT_PROACTIVE_MOMENTUM_THRESHOLD);
    setProactiveOrderBookThreshold(DEFAULT_PROACTIVE_ORDER_BOOK_THRESHOLD);
  };

  return (
    <Popover
      width={320}
      trapFocus
      position="top-end"
      withArrow
      shadow="md"
      opened={opened}
      onChange={setOpened}
    >
      <Popover.Target>
        <IconSettings
          size={20}
          style={{ cursor: 'pointer', flexShrink: 0, color: '#ffffff' }}
          onClick={() => setOpened((o) => !o)}
        />
      </Popover.Target>
      <Popover.Dropdown style={{ maxHeight: '450px' }}>
        <Tabs defaultValue="basic">
          <Tabs.List grow>
            <Tabs.Tab value="basic" size="xs">
              Basic
            </Tabs.Tab>
            <Tabs.Tab value="algorithm" size="xs">
              Algorithm
            </Tabs.Tab>
          </Tabs.List>

          {/* Basic Trading Settings Tab */}
          <Tabs.Panel value="basic" pt="xs" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <NumberInput
              value={buySlippage}
              onChange={setBuySlippage}
              style={{ marginTop: '8px' }}
              label="Buy slippage (%)"
              placeholder="Buy slippage (%)"
              size="xs"
              step={0.01}
            />
            <NumberInput
              value={sellSlippage}
              onChange={setSellSlippage}
              style={{ marginTop: '8px' }}
              label="Sell slippage (%)"
              placeholder="Sell slippage (%)"
              size="xs"
              step={0.01}
            />
            <NumberInput
              value={volume}
              onChange={setVolume}
              style={{ marginTop: '8px' }}
              label="Volume (USDT)"
              placeholder="Volume"
              size="xs"
            />
            <NumberInput
              value={gapThreshold}
              onChange={setGapThreshold}
              style={{ marginTop: '8px' }}
              label="Gap threshold (%)"
              placeholder="Gap threshold (%)"
              size="xs"
              step={0.1}
              min={0}
            />
            <NumberInput
              value={cancelThreshold}
              onChange={setCancelThreshold}
              style={{ marginTop: '8px' }}
              label="Cancel order threshold (%)"
              placeholder="Cancel threshold (%)"
              size="xs"
              step={0.1}
              min={0}
            />
            <NumberInput
              value={orderLimit}
              onChange={setOrderLimit}
              style={{ marginTop: '8px' }}
              label="Order limit (0 = unlimited)"
              placeholder="Order limit"
              size="xs"
              min={0}
            />
            <Checkbox
              checked={useBuyPriceAsSellPrice}
              onChange={(event) => setUseBuyPriceAsSellPrice(event.currentTarget.checked)}
              style={{ marginTop: '12px' }}
              label="Use buy price as sell price"
              size="xs"
            />
          </Tabs.Panel>

          {/* Algorithm Settings Tab */}
          <Tabs.Panel value="algorithm" pt="xs" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <NumberInput
              value={maxLoss}
              onChange={setMaxLoss}
              style={{ marginTop: '8px' }}
              label="Max loss (USDT)"
              placeholder="Max loss"
              size="xs"
              min={0}
            />

            {/* Momentum Check */}
            <Checkbox
              checked={enableMomentumCheck}
              onChange={(event) => setEnableMomentumCheck(event.currentTarget.checked)}
              style={{ marginTop: '12px' }}
              label="Enable momentum check"
              size="xs"
            />
            {enableMomentumCheck && (
              <NumberInput
                value={momentumThreshold}
                onChange={setMomentumThreshold}
                style={{ marginTop: '8px' }}
                label="Momentum threshold (%)"
                placeholder="Momentum threshold"
                size="xs"
                step={0.1}
              />
            )}

            {/* Dynamic Slippage */}
            <Checkbox
              checked={enableDynamicSlippage}
              onChange={(event) => setEnableDynamicSlippage(event.currentTarget.checked)}
              style={{ marginTop: '12px' }}
              label="Enable dynamic slippage"
              size="xs"
            />
            {enableDynamicSlippage && (
              <>
                <NumberInput
                  value={dynamicSlippageFactor}
                  onChange={setDynamicSlippageFactor}
                  style={{ marginTop: '8px' }}
                  label="Slippage factor (% of spread)"
                  placeholder="Factor"
                  size="xs"
                  step={0.1}
                  min={0}
                  max={1}
                />
                <NumberInput
                  value={minSlippage}
                  onChange={setMinSlippage}
                  style={{ marginTop: '8px' }}
                  label="Min slippage (%)"
                  placeholder="Min slippage"
                  size="xs"
                  step={0.01}
                  min={0}
                />
              </>
            )}

            {/* Order Book Check */}
            <Checkbox
              checked={enableOrderBookCheck}
              onChange={(event) => setEnableOrderBookCheck(event.currentTarget.checked)}
              style={{ marginTop: '12px' }}
              label="Enable order book analysis"
              size="xs"
            />
            {enableOrderBookCheck && (
              <NumberInput
                value={orderBookRatioThreshold}
                onChange={setOrderBookRatioThreshold}
                style={{ marginTop: '8px' }}
                label="Min buy/sell ratio"
                placeholder="Ratio threshold"
                size="xs"
                step={0.1}
                min={0}
              />
            )}

            {/* Proactive Cut-Loss */}
            <Checkbox
              checked={enableProactiveCutLoss}
              onChange={(event) => setEnableProactiveCutLoss(event.currentTarget.checked)}
              style={{ marginTop: '12px' }}
              label="Enable proactive cut-loss"
              size="xs"
            />
            {enableProactiveCutLoss && (
              <>
                <NumberInput
                  value={proactiveMomentumThreshold}
                  onChange={setProactiveMomentumThreshold}
                  style={{ marginTop: '8px' }}
                  label="Momentum threshold (%)"
                  description="Cut-loss when momentum drops below"
                  placeholder="-1"
                  size="xs"
                  step={0.1}
                />
                <NumberInput
                  value={proactiveOrderBookThreshold}
                  onChange={setProactiveOrderBookThreshold}
                  style={{ marginTop: '8px' }}
                  label="Order book ratio threshold"
                  description="Cut-loss when buy/sell ratio drops below"
                  placeholder="0.3"
                  size="xs"
                  step={0.1}
                  min={0}
                />
              </>
            )}
          </Tabs.Panel>
        </Tabs>

        {/* Save/Cancel/Reset buttons - always visible */}
        <div style={{ marginTop: '16px', marginBottom: '8px', display: 'flex', gap: '8px' }}>
          <Button size="xs" onClick={handleSave}>
            Save
          </Button>
          <Button size="xs" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="xs" variant="light" color="gray" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </Popover.Dropdown>
    </Popover>
  );
};

export default Setting;
