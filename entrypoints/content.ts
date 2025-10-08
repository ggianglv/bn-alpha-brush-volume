import { renderQuickBuy } from "./components/quick-buy";

export default defineContentScript({
  matches: ['*://*.binance.com/*/alpha/*'],
  main() {
    setTimeout(() => {
      const loginButton = document.querySelector('#toLoginPage')
      if (loginButton) return
      const buyButton = document.querySelector('.bn-button__buy') as HTMLElement
      if (!buyButton) {
        console.error('Buy button not found')
        return
      }
      const container = document.createElement('div')
      buyButton.insertAdjacentElement('beforebegin', container)
      renderQuickBuy(container)
    }, 3000)
  },
});
