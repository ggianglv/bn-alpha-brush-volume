import { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import Setting from './components/setting.tsx';
import QuickSell from './components/quick-sell.tsx';
import QuickBuy from './components/quick-buy.tsx';
import AutoTrade, { AutoTradeStatus, AutoTradeStats } from './components/auto-trade.tsx';
import { getGapThreshold, getOrderLimit } from './utils.ts';

// Helper function to get display text for status
const getStatusText = (status: AutoTradeStatus, skipReason: string | null): string => {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'cooling_down':
      return 'Cooling...';
    case 'waiting_order':
      return 'Waiting order';
    case 'cancelling':
      return 'Cancelling...';
    case 'cut_loss':
      return 'Cut-loss...';
    case 'skipping':
      return skipReason ? `Skip: ${skipReason}` : 'Skipping...';
    default:
      return '';
  }
};

const App = () => {
  const [stats, setStats] = useState<AutoTradeStats>({
    status: 'idle',
    gap: null,
    orderCount: 0,
    totalProfit: 0,
    momentum: null,
    skipReason: null,
  });

  const handleStatusChange = useCallback((newStats: AutoTradeStats) => {
    setStats(newStats);
  }, []);

  const orderLimit = getOrderLimit();
  const gapThreshold = getGapThreshold();
  const isGapGood = stats.gap !== null && Math.abs(stats.gap) < gapThreshold;
  const isRunning = stats.status !== 'idle';
  const isProfitable = stats.totalProfit >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Stats display row 1 - Gap and Momentum */}
      <div
        style={{
          fontSize: '11px',
          color: '#848e9c',
          display: 'flex',
          gap: '8px',
          padding: '4px 0',
          flexWrap: 'wrap',
        }}
      >
        {/* Gap - always visible */}
        <span
          style={{
            color: isGapGood ? '#2EBD85' : '#848e9c',
          }}
        >
          Gap: {stats.gap !== null ? `${stats.gap.toFixed(4)}%` : '-'}
        </span>

        {/* Momentum - visible when available */}
        {stats.momentum !== null && (
          <>
            <span>|</span>
            <span
              style={{
                color: stats.momentum >= 0 ? '#2EBD85' : '#F6465D',
              }}
            >
              Mom: {stats.momentum.toFixed(2)}%
            </span>
          </>
        )}

        {/* Profit/Loss - visible when running or has trades */}
        {(isRunning || stats.totalProfit !== 0) && (
          <>
            <span>|</span>
            <span
              style={{
                color: isProfitable ? '#2EBD85' : '#F6465D',
                fontWeight: 600,
              }}
              title="Estimated P/L based on order prices (actual fill prices may vary)"
            >
              P/L: ~{stats.totalProfit >= 0 ? '+' : ''}
              {stats.totalProfit.toFixed(4)} USDT
            </span>
          </>
        )}

        {/* Order count - visible when limit > 0 or running */}
        {(orderLimit > 0 || isRunning) && (
          <>
            <span>|</span>
            <span>
              Orders: {stats.orderCount}
              {orderLimit > 0 ? `/${orderLimit}` : ''}
            </span>
          </>
        )}

        {/* Status text - only visible when running */}
        {isRunning && (
          <>
            <span>|</span>
            <span
              style={{
                color:
                  stats.status === 'skipping'
                    ? '#F0B90B'
                    : stats.status === 'ready'
                      ? '#2EBD85'
                      : '#848e9c',
              }}
            >
              {getStatusText(stats.status, stats.skipReason)}
            </span>
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
