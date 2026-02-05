import { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import Setting from './components/setting.tsx';
import QuickSell from './components/quick-sell.tsx';
import QuickBuy from './components/quick-buy.tsx';
import AutoTrade, { AutoTradeStatus } from './components/auto-trade.tsx';
import { getGapThreshold, getOrderLimit } from './utils.ts';

// Helper function to get display text for status
const getStatusText = (status: AutoTradeStatus): string => {
  switch (status) {
    case 'ready':
      return 'Ready to trade';
    case 'cooling_down':
      return 'Cooling down...';
    case 'waiting_order':
      return 'Waiting for order to fill';
    case 'cancelling':
      return 'Cancelling order...';
    case 'cut_loss':
      return 'Executing cut-loss...';
    default:
      return '';
  }
};

const App = () => {
  const [autoTradeStatus, setAutoTradeStatus] = useState<AutoTradeStatus>('idle');
  const [currentGap, setCurrentGap] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState(0);

  const handleStatusChange = useCallback(
    (status: AutoTradeStatus, gap: number | null, count: number) => {
      setAutoTradeStatus(status);
      setCurrentGap(gap);
      setOrderCount(count);
    },
    []
  );

  const orderLimit = getOrderLimit();
  const gapThreshold = getGapThreshold();
  const isGapGood = currentGap !== null && Math.abs(currentGap) < gapThreshold;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Status display - Gap is always visible, status only when running */}
      <div
        style={{
          fontSize: '11px',
          color: '#848e9c',
          display: 'flex',
          gap: '8px',
          padding: '4px 0',
        }}
      >
        {/* Gap - always visible */}
        <span
          style={{
            color: isGapGood ? '#2EBD85' : '#848e9c',
          }}
        >
          Gap: {currentGap !== null ? `${currentGap.toFixed(4)}%` : '-'}
        </span>

        {/* Order count - only visible when limit > 0 */}
        {orderLimit > 0 && (
          <>
            <span>|</span>
            <span>
              Orders: {orderCount}/{orderLimit}
            </span>
          </>
        )}

        {/* Status text - only visible when running */}
        {autoTradeStatus !== 'idle' && (
          <>
            <span>|</span>
            <span>{getStatusText(autoTradeStatus)}</span>
          </>
        )}
      </div>

      {/* Buttons row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <QuickSell />
        <QuickBuy />
        <AutoTrade onStatusChange={handleStatusChange} />
        <Setting />
      </div>
    </div>
  );
};

export const renderApp = (container: HTMLElement) => {
  const root = createRoot(container);
  root.render(
    <MantineProvider defaultColorScheme="dark">
      <App />
    </MantineProvider>
  );
};

export default App;
