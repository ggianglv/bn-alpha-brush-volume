import { renderApp } from './app/app.tsx';

export default defineContentScript({
  matches: ['*://*.binance.com/*/alpha/*'],
  main() {
    setTimeout(() => {
      const loginButton = document.querySelector('#toLoginPage');
      if (loginButton) return;
      const buyButton = document.querySelector('.bn-button__buy') as HTMLElement;
      if (!buyButton) {
        console.error('Buy button not found');
        return;
      }
      const container = document.createElement('div');
      buyButton.insertAdjacentElement('beforebegin', container);
      renderApp(container);
    }, 3000);
  },
});
