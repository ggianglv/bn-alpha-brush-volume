import { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import Setting from './components/setting.tsx';
import QuickSell from './components/quick-sell.tsx';
import QuickBuy from './components/quick-buy.tsx';
import AdvancedBuy, { TradingSignal, AdvancedBuyStats } from './components/advanced-buy.tsx';
import { getGapThreshold } from './utils.ts';

// Helper function to get signal display text and color
const getSignalDisplay = (
  signal: TradingSignal,
  reason: string | null
): { text: string; color: string; isBold: boolean } => {
  switch (signal) {
    case 'buy':
      return { text: 'BUY', color: '#2EBD85', isBold: true };
    case 'cancel_buy':
      return {
        text: `CANCEL BUY ORDER${reason ? ` (${reason})` : ''}`,
        color: '#F0B90B',
        isBold: true,
      };
    case 'cut_loss':
      return {
        text: `CUT LOSS${reason ? ` (${reason})` : ''}`,
        color: '#F6465D',
        isBold: true,
      };
    case 'none':
    default:
      return { text: reason || 'Monitoring...', color: '#848e9c', isBold: false };
  }
};

const App = () => {
  const [stats, setStats] = useState<AdvancedBuyStats>({
    signal: 'none',
    signalReason: null,
    gap: null,
    momentum: null,
    hasBuyOrders: false,
    hasSellOrders: false,
  });

  const handleSignalChange = useCallback((newStats: AdvancedBuyStats) => {
    setStats(newStats);
  }, []);

  const gapThreshold = getGapThreshold();
  const isGapGood = stats.gap !== null && Math.abs(stats.gap) < gapThreshold;
  const signalDisplay = getSignalDisplay(stats.signal, stats.signalReason);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Stats display row - Gap and Momentum */}
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

        {/* Order status indicator */}
        {(stats.hasBuyOrders || stats.hasSellOrders) && (
          <>
            <span>|</span>
            <span style={{ color: '#F0B90B' }}>
              {stats.hasBuyOrders && stats.hasSellOrders
                ? 'Buy+Sell orders'
                : stats.hasBuyOrders
                  ? 'Buy order'
                  : 'Sell order'}
            </span>
          </>
        )}
      </div>

      {/* Signal display row - prominent signal indicator */}
      <div
        style={{
          fontSize: '12px',
          padding: '6px 8px',
          borderRadius: '4px',
          backgroundColor:
            stats.signal === 'buy'
              ? 'rgba(46, 189, 133, 0.15)'
              : stats.signal === 'cancel_buy'
                ? 'rgba(240, 185, 11, 0.15)'
                : stats.signal === 'cut_loss'
                  ? 'rgba(246, 70, 93, 0.15)'
                  : 'rgba(132, 142, 156, 0.1)',
          border: `1px solid ${
            stats.signal === 'buy'
              ? 'rgba(46, 189, 133, 0.3)'
              : stats.signal === 'cancel_buy'
                ? 'rgba(240, 185, 11, 0.3)'
                : stats.signal === 'cut_loss'
                  ? 'rgba(246, 70, 93, 0.3)'
                  : 'rgba(132, 142, 156, 0.2)'
          }`,
        }}
      >
        <span
          style={{
            color: signalDisplay.color,
            fontWeight: signalDisplay.isBold ? 700 : 400,
            letterSpacing: signalDisplay.isBold ? '0.5px' : 'normal',
          }}
        >
          Signal: {signalDisplay.text}
        </span>
      </div>

      {/* Buttons row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <QuickSell />
        <QuickBuy />
        <AdvancedBuy onSignalChange={handleSignalChange} />
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
