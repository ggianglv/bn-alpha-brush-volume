
import { createRoot } from 'react-dom/client';
import { Button, MantineProvider } from '@mantine/core';
import {IconSettings} from '@tabler/icons-react'
import '@mantine/core/styles.css';


const QuickBuy = () => {
  const getCurrentPrice = () => {
    const price = document.querySelector('.chart-title-indicator-container span:nth-child(9)');
    return price ? Number(price.textContent) : null;
  }

  const handleTrade = () => {
    console.log("Trade button clicked");
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Button h={40} onClick={handleTrade}>
        Trade
      </Button>
      <IconSettings size={20} style={{ cursor: 'pointer' }} />
    </div>
  );
};

export const renderQuickBuy = (container: HTMLElement) => {
  console.log(container, 'container')
  const root = createRoot(container)
  root.render(
    <MantineProvider>
      <QuickBuy />
    </MantineProvider>
  )
}

export default QuickBuy;