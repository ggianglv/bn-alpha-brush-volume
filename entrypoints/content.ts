import { renderQuickBuy } from "./components/quick-buy";



export default defineContentScript({
  matches: ['*://*.binance.com/*/alpha/*'],
  main() {
    setTimeout(() => {
      const loginButton = document.querySelector('#toLoginPage')
      if (loginButton) return
      const buyButton = document.querySelector('.bn-button__buy') as HTMLElement
      if (!buyButton) return
      const container = document.createElement('div')
      container.classList.add('flex')
      container.style.gap = '8px'
      buyButton.insertAdjacentElement('afterend', container)
      container.appendChild(buyButton)
      const quickBuyButtonContainer = document.createElement('div')
      container.appendChild(quickBuyButtonContainer)
      renderQuickBuy(quickBuyButtonContainer)
    }, 3000)
  },
});
