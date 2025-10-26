import React, { useState, useEffect } from 'react';
import { Popover, Checkbox, NumberInput, Button } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { DEFAULT_BUY_SLIPPAGE, DEFAULT_SELL_SLIPPAGE, DEFAULT_VOLUME } from '@/entrypoints/app/constants.ts';
import { saveSettings, getSavedSettings } from '@/entrypoints/app/utils.ts';

const Setting = () => {
  const [buySlippage, setBuySlippage] = useState<number | string>(DEFAULT_BUY_SLIPPAGE);
  const [sellSlippage, setSellSlippage] = useState<number | string>(DEFAULT_SELL_SLIPPAGE);
  const [volume, setVolume] = useState<number | string>(DEFAULT_VOLUME);
  const [useBuyPriceAsSellPrice, setUseBuyPriceAsSellPrice] = useState<boolean>(false);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const settings = getSavedSettings();
    setBuySlippage(settings.buySlippage);
    setSellSlippage(settings.sellSlippage);
    setVolume(settings.volume);
    setUseBuyPriceAsSellPrice(settings.useBuyPriceAsSellPrice);
  }, []);

  const handleSave = () => {
    const settings = {
      buySlippage,
      sellSlippage,
      volume,
      useBuyPriceAsSellPrice
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

  return (
    <Popover width={300} trapFocus position="top-end" withArrow shadow="md" opened={opened} onChange={setOpened}>
      <Popover.Target>
        <IconSettings size={20} style={{ cursor: 'pointer', flexShrink: 0, color: '#ffffff' }} onClick={() => setOpened((o) => !o)} />
      </Popover.Target>
      <Popover.Dropdown>
        <div>
          <NumberInput
            value={buySlippage}
            onChange={setBuySlippage}
            style={{ marginTop: '8px' }}
            label="Buy slippage (default 0.01%)"
            placeholder="Buy slippage (%)"
            size="xs"
          />
          <NumberInput
            value={sellSlippage}
            onChange={setSellSlippage}
            style={{ marginTop: '8px' }}
            label="Sell slippage (default 0.01%)"
            placeholder="Sell slippage (%)"
            size="xs"
          />
          <NumberInput
            value={volume}
            onChange={setVolume}
            style={{ marginTop: '8px' }}
            label="Volume"
            placeholder="Volume"
            size="xs"
          />
          <Checkbox
            checked={useBuyPriceAsSellPrice}
            onChange={(event) => setUseBuyPriceAsSellPrice(event.currentTarget.checked)}
            style={{ marginTop: '12px' }}
            label="Use buy price with slippage as sell price"
            size="xs"
          />

          <div style={{ marginTop: '16px', marginBottom: '8px', display: 'flex', gap: '8px' }}>
            <Button size="xs" onClick={handleSave}>Save</Button>
            <Button size="xs" variant="outline" onClick={handleCancel}>Cancel</Button>
          </div>
        </div>
      </Popover.Dropdown>
    </Popover>
  );
};

export default Setting;
