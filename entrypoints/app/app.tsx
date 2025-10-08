import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import Setting from './components/setting.tsx';
import QuickSell from './components/quick-sell.tsx';
import QuickBuy from './components/quick-buy.tsx';

const App = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <QuickSell />
      <QuickBuy />
      <Setting />
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
