'use client'

import * as React from 'react'
import { Web3Bento } from './ui/web3-bento'

/**
 * O painel numa página escura, com os dados de exemplo que ele traz: a carteira de marina.eth na Ethereum, um ano de
 * valores, três cartões, o staking na Lido e uma posição de liquidez em ETH / USDC. Troque pelos seus dados: o formato
 * de cada prop está no componente.
 */

const FONTS =
  'https://fonts.googleapis.com/css2?family=Geist:wght@200;300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap'

/* a Geist e a Geist Mono do Google Fonts: o painel entra quando elas chegam (ou, em 2 s, com as do sistema), para os
   números já contarem na fonte certa */
function useGeist() {
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => {
    let link = document.getElementById('geist-fonts') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = 'geist-fonts'
      link.rel = 'stylesheet'
      link.href = FONTS
      document.head.appendChild(link)
    }
    const show = () => setReady(true)
    const load = () =>
      Promise.all(
        ['400 1em Geist', '600 1em Geist', "600 1em 'Geist Mono'"].map((f) =>
          document.fonts.load(f),
        ),
      ).then(show, show)
    if (link.sheet) load()
    else {
      link.addEventListener('load', load, { once: true })
      link.addEventListener('error', show, { once: true })
    }
    const timer = setTimeout(show, 2000)
    return () => clearTimeout(timer)
  }, [])
  return ready
}

export default function Web3BentoDemo() {
  const ready = useGeist()
  return (
    <div className="w3b-demo">
      <style dangerouslySetInnerHTML={{ __html: DEMO_CSS }} />
      {ready && <Web3Bento />}
    </div>
  )
}

const DEMO_CSS = `
.w3b-demo { box-sizing: border-box; display: flex; justify-content: center; align-items: flex-start; width: 100%; min-height: 100vh; min-height: 100svh; padding: 16px; background: oklch(0.145 0 0); }
@media (min-width: 640px) {
  .w3b-demo { padding: 32px; }
}
`
