import { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import Setting from './components/setting.tsx';
import QuickSell from './components/quick-sell.tsx';
import QuickBuy from './components/quick-buy.tsx';
import AutoTrade, { AutoTradeStatus } from './components/auto-trade.tsx';
import { getGapThreshold } from './utils.ts';

// Helper function to get display text for status
const getStatusText = (status: AutoTradeStatus): string => {
  switch (status) {
    case 'ready':
      return 'Ready to trade';
    case 'cooling_down':
      return 'Cooling down...';
    case 'waiting_order':
      return 'Waiting for order to fill';
    default:
      return '';
  }
};

const App = () => {
  const [autoTradeStatus, setAutoTradeStatus] = useState<AutoTradeStatus>('idle');
  const [currentGap, setCurrentGap] = useState<number | null>(null);

  const handleStatusChange = useCallback((status: AutoTradeStatus, gap: number | null) => {
    setAutoTradeStatus(status);
    setCurrentGap(gap);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Status display - only visible when auto trade is running */}
      {autoTradeStatus !== 'idle' && (
        <div
          style={{
            fontSize: '11px',
            color: '#848e9c',
            display: 'flex',
            gap: '8px',
            padding: '4px 0',
          }}
        >
          <span
            style={{
              color:
                currentGap !== null && Math.abs(currentGap) < getGapThreshold()
                  ? '#2EBD85'
                  : '#848e9c',
            }}
          >
            Gap: {currentGap !== null ? `${currentGap.toFixed(4)}%` : '-'}
          </span>
          <span>|</span>
          <span>{getStatusText(autoTradeStatus)}</span>
        </div>
      )}

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
