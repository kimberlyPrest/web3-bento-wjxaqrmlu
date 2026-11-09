'use client'

import * as React from 'react'

export interface Web3Allocation {
  symbol: string
  value: number
}
export interface Web3Activity {
  id: string
  kind: 'swap' | 'bridge' | 'stake' | 'mint' | 'receive'
  title: string
  detail: string
  amount: string
  status: 'confirmed' | 'pending' | 'failed'
  time: string
}
export interface Web3Card {
  id: string
  label: string
  last4: string
  holder?: string
  expiry?: string
  balance?: string
  logo?: React.ReactNode
  color: string
  color2: string
  ink: string
}
export interface Web3BentoProps {
  account?: string
  network?: string
  history?: number[]
  benchmark?: number[]
  allocation?: Web3Allocation[]
  staking?: { asset: string; staked: number; apy: number; rewards: number; usdPrice: number }
  liquidity?: { pair: string; fee: string; min: number; max: number; price: number; fees: number }
  activity?: Web3Activity[]
  cards?: Web3Card[]
  accent?: string
  accent2?: string
  locale?: string
  className?: string
}

function walk(seed: number, n: number, start: number, drift: number, vol: number) {
  let h = seed,
    v = start
  const out: number[] = []
  const rnd = () => (h = (h * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < n; i++) {
    v *= 1 + drift + (rnd() - 0.5) * vol
    out.push(v)
  }
  return out.map((_, i) => {
    const w = out.slice(Math.max(0, i - 3), i + 1)
    return w.reduce((s, x) => s + x, 0) / w.length
  })
}

const HISTORY = walk(7, 365, 61000, 0.0011, 0.045)
const BENCHMARK = walk(11, 365, 61000, 0.0006, 0.05)
const ALLOCATION = [
  { symbol: 'ETH', value: 58200 },
  { symbol: 'USDC', value: 21400 },
  { symbol: 'ARB', value: 9800 },
  { symbol: 'OP', value: 6100 },
  { symbol: 'Outros', value: 4300 },
]
const CARDS: Web3Card[] = [
  {
    id: 'k3',
    label: 'Reserva',
    last4: '3368',
    holder: 'Marina Costa',
    expiry: '09/29',
    balance: 'US$ 12.480',
    color: 'oklch(0.82 0.11 55)',
    color2: 'oklch(0.7 0.15 30)',
    ink: 'oklch(0.25 0.05 40)',
  },
  {
    id: 'k2',
    label: 'Virtual',
    last4: '4352',
    holder: 'Marina Costa',
    expiry: '03/28',
    balance: 'US$ 2.910',
    color: 'oklch(0.8 0.1 300)',
    color2: 'oklch(0.64 0.15 285)',
    ink: 'oklch(0.2 0.06 290)',
  },
  {
    id: 'k1',
    label: 'Principal',
    last4: '6902',
    holder: 'Marina Costa',
    expiry: '07/27',
    balance: 'US$ 84.316',
    color: 'oklch(0.89 0.2 128)',
    color2: 'oklch(0.74 0.17 165)',
    ink: 'oklch(0.22 0.06 140)',
  },
]
const ACTIVITIES: Web3Activity[] = [
  {
    id: 'a1',
    kind: 'bridge',
    title: 'Bridge para a Base',
    detail: 'via Across',
    amount: '−1,20 ETH',
    status: 'pending',
    time: 'agora',
  },
  {
    id: 'a2',
    kind: 'swap',
    title: 'Swap ETH → USDC',
    detail: 'Uniswap v4',
    amount: '+4.210 USDC',
    status: 'confirmed',
    time: '12 min',
  },
  {
    id: 'a3',
    kind: 'stake',
    title: 'Stake',
    detail: 'Lido',
    amount: '−2,00 ETH',
    status: 'confirmed',
    time: '2 h',
  },
  {
    id: 'a4',
    kind: 'mint',
    title: 'Mint · Genesis Pass #418',
    detail: 'Zora',
    amount: '−0,01 ETH',
    status: 'confirmed',
    time: '1 d',
  },
]
const useReduced = () =>
  React.useSyncExternalStore(
    (cb) => {
      const m = matchMedia('(prefers-reduced-motion: reduce)')
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
const usd = (v: number, d = 0) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(v)
const num = (v: number, d = 0) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)
const Tile = ({
  title,
  action,
  className = '',
  children,
}: {
  title?: React.ReactNode
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) => (
  <section className={`w3b-tile ${className}`}>
    <header>
      <h3>{title}</h3>
      {action}
    </header>
    {children}
  </section>
)

function Hero({
  account,
  history,
  reduced,
}: {
  account: string
  history: number[]
  reduced: boolean
}) {
  const target = 120917
  const [value, setValue] = React.useState(reduced ? target : 0)
  React.useEffect(() => {
    if (reduced) return
    let raf = 0,
      start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1300)
      setValue(target * (1 - (1 - p) ** 4))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])
  const month = history.slice(-31)
  const daily = month.slice(1).map((v, i) => (v / month[i] - 1) * 100)
  const max = Math.max(...daily.map(Math.abs))
  const [hover, setHover] = React.useState<number | null>(null)
  return (
    <Tile className="w3b-hero">
      <div className="w3b-hero-top">
        <div>
          <p className="w3b-gm">
            gm, <b>{account}</b>
          </p>
          <p className="muted">Seu mês onchain num relance.</p>
        </div>
        <div className="worth">
          <small>Patrimônio</small>
          <strong>{usd(value)}</strong>
          <p>
            +US$ 8.916 (+8,0%) <span>· 30d</span>
          </p>
        </div>
      </div>
      <div className="w3b-pnl" onPointerLeave={() => setHover(null)}>
        {daily.map((v, i) => (
          <button
            key={i}
            aria-label={`${i + 1} dias atrás: ${v >= 0 ? '+' : '−'}${num(Math.abs(v), 2)}%`}
            onPointerEnter={() => setHover(i)}
            style={{
              height: `${18 + (Math.abs(v) / max) * 82}%`,
              background: v >= 0 ? 'var(--lime)' : 'var(--lilac)',
              animationDelay: `${i * 18}ms`,
              opacity: hover === null || hover === i ? 1 : 0.25,
            }}
          />
        ))}
      </div>
      <div className="axis">
        <span>30 dias</span>
        <span>{hover === null ? 'PnL diário' : `${hover + 1} · ${num(daily[hover], 2)}%`}</span>
        <span>Hoje</span>
      </div>
    </Tile>
  )
}

function Cards({ cards }: { cards: Web3Card[] }) {
  const [order, setOrder] = React.useState(cards)
  const front = order.at(-1)!
  return (
    <Tile
      title={
        <>
          Cartões <sup>{cards.length}</sup>
        </>
      }
      className="w3b-cards"
    >
      <div className="card-stack">
        {order.map((c, i) => {
          const back = order.length - 1 - i
          return (
            <button
              key={c.id}
              aria-label={`Cartão ${c.label} final ${c.last4}`}
              onClick={() => back && setOrder((o) => [...o.filter((x) => x.id !== c.id), c])}
              style={{
                top: `${i * 46}px`,
                zIndex: i,
                transform: `translateX(-50%) scale(${1 - back * 0.055})`,
                color: c.ink,
                background: `linear-gradient(135deg, ${c.color}, ${c.color2})`,
              }}
            >
              <span>▤ {c.label}</span>
              <b>**** {c.last4}</b>
            </button>
          )
        })}
      </div>
      <div className="card-panel">
        <div>
          <b>•••• {front.last4}</b>
          <small>
            {front.holder} · {front.expiry}
          </small>
        </div>
        <strong>{front.balance}</strong>
      </div>
    </Tile>
  )
}

function Gas({ reduced }: { reduced: boolean }) {
  const [gas, setGas] = React.useState(14.2)
  const [speed, setSpeed] = React.useState('Normal')
  React.useEffect(() => {
    if (reduced) return
    const id = setInterval(
      () => setGas((g) => Math.max(4, Math.min(60, g + (Math.random() - 0.5) * 3.2))),
      2200,
    )
    return () => clearInterval(id)
  }, [reduced])
  const multi = speed === 'Lento' ? 0.85 : speed === 'Rápido' ? 1.35 : 1
  const v = gas * multi
  return (
    <Tile title="Gas" action={<small>ao vivo</small>} className="w3b-gas">
      <div
        className="gauge"
        style={{ '--gas': `${Math.min(100, (v / 60) * 100)}%` } as React.CSSProperties}
      >
        <i />
      </div>
      <strong>
        {num(v, 1)} <span>gwei</span>
      </strong>
      <p>≈ {usd(v * 21000e-9 * 3368.5, 2)} por transferência</p>
      <div className="pills">
        {['Lento', 'Normal', 'Rápido'].map((s) => (
          <button className={s === speed ? 'on' : ''} onClick={() => setSpeed(s)} key={s}>
            {s}
          </button>
        ))}
      </div>
    </Tile>
  )
}

function Chart({ history, benchmark }: { history: number[]; benchmark: number[] }) {
  const [period, setPeriod] = React.useState('1A')
  const take = period === '1S' ? 8 : period === '1M' ? 31 : 365
  const a = history.slice(-take)
  const b = benchmark.slice(-take)
  const all = [...a, ...b],
    lo = Math.min(...all),
    hi = Math.max(...all)
  const points = (x: number[]) =>
    x.map((v, i) => `${(i / (x.length - 1)) * 640},${205 - ((v - lo) / (hi - lo)) * 180}`).join(' ')
  return (
    <Tile
      title="Carteira vs ETH"
      action={
        <div className="pills">
          {['1S', '1M', '1A'].map((p) => (
            <button className={p === period ? 'on' : ''} onClick={() => setPeriod(p)} key={p}>
              {p}
            </button>
          ))}
        </div>
      }
      className="w3b-chart"
    >
      <div className="legend">
        <div>
          <small>━ Carteira</small>
          <strong>{usd(a.at(-1)!)}</strong>
        </div>
        <div>
          <small>┄ Só ETH</small>
          <strong>{usd(b.at(-1)!)}</strong>
        </div>
        <b>+60,9% vs ETH</b>
      </div>
      <svg viewBox="0 0 640 220" preserveAspectRatio="none">
        <polyline points={points(b)} className="bench" />
        <polygon points={`${points(a)} 640,220 0,220`} />
        <polyline points={points(a)} />
      </svg>
      <div className="axis">
        <span>Mai</span>
        <span>Jul</span>
        <span>Set</span>
        <span>Nov</span>
        <span>Jan</span>
        <span>Mar</span>
        <span>Hoje</span>
      </div>
    </Tile>
  )
}

function Allocation({ allocation }: { allocation: Web3Allocation[] }) {
  const total = allocation.reduce((s, a) => s + a.value, 0)
  const colors = ['var(--lime)', 'var(--lilac)', '#aaa1bd', '#77717f', '#57535c']
  return (
    <Tile title="Alocação" className="w3b-alloc">
      <strong>{usd(total)}</strong>
      <div className="allocbar">
        {allocation.map((a, i) => (
          <i
            key={a.symbol}
            style={{ width: `${(a.value / total) * 100}%`, background: colors[i] }}
          />
        ))}
      </div>
      <ul>
        {allocation.map((a, i) => (
          <li key={a.symbol}>
            <span>
              <i style={{ background: colors[i] }} />
              {a.symbol}
            </span>
            <b>{num((a.value / total) * 100, 1)}%</b>
          </li>
        ))}
      </ul>
    </Tile>
  )
}

function Staking({ reduced }: { reduced: boolean }) {
  const [reward, setReward] = React.useState(0.41837215),
    [claimed, setClaimed] = React.useState(false)
  React.useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setReward((r) => r + (32 * 0.0342) / 315360000), 100)
    return () => clearInterval(id)
  }, [reduced])
  return (
    <section className="w3b-stake">
      <header>
        <h3>Staking</h3>
        <b>● Rendendo</b>
      </header>
      <strong className="apy">
        3,42<span>%</span>
      </strong>
      <p>APY sobre 32 ETH</p>
      <div className="payout">
        <span>Próximo pagamento</span>
        <b>2m 53s</b>
        <i />
      </div>
      <dl>
        <div>
          <dt>Validador</dt>
          <dd>#1.204.381</dd>
        </div>
        <div>
          <dt>Eficiência</dt>
          <dd>99,4%</dd>
        </div>
        <div>
          <dt>Provedor</dt>
          <dd>Lido</dd>
        </div>
      </dl>
      <div className="stake-foot">
        <small>Recompensas até agora</small>
        <strong>
          {num(reward, 8)} <span>ETH</span>
        </strong>
        <p>≈ {usd(reward * 3368.5)}</p>
        <div className="epochs">
          {[62, 70, 58, 81, 74, 90, 86, 95, 88, 100].map((h, i) => (
            <i key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
        <small>Últimas 10 épocas</small>
        <button disabled={claimed} onClick={() => setClaimed(true)}>
          {claimed ? 'Resgate enviado' : 'Resgatar recompensas'}
        </button>
      </div>
    </section>
  )
}

function Liquidity({ reduced }: { reduced: boolean }) {
  const [price, setPrice] = React.useState(3368.5)
  React.useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setPrice((p) => p * (1 + (Math.random() - 0.5) * 0.006)), 1800)
    return () => clearInterval(id)
  }, [reduced])
  return (
    <Tile title="ETH / USDC · 0,05%" action={<b className="badge">Na faixa</b>} className="w3b-lp">
      <strong>{usd(price, 2)}</strong>
      <small>preço atual</small>
      <div className="range">
        <i />
        <b style={{ left: `${25 + ((price - 3120) / 520) * 50}%` }} />
      </div>
      <div className="axis">
        <span>3.120</span>
        <span>3.640</span>
      </div>
      <p>
        Taxas ganhas <b>US$ 412,80</b>
      </p>
    </Tile>
  )
}

function Blocks({ reduced }: { reduced: boolean }) {
  const [block, setBlock] = React.useState(21094331),
    [ago, setAgo] = React.useState(0)
  React.useEffect(() => {
    if (reduced) return
    const a = setInterval(() => setAgo((x) => x + 1), 1000),
      b = setInterval(() => {
        setBlock((x) => x + 1)
        setAgo(0)
      }, 3000)
    return () => {
      clearInterval(a)
      clearInterval(b)
    }
  }, [reduced])
  const bars = React.useMemo(
    () => Array.from({ length: 42 }, (_, i) => 25 + ((Math.sin(i * 12.9) + 1) / 2) * 70),
    [block],
  )
  return (
    <Tile title="Blocos" action={<small>há {ago}s</small>} className="w3b-blocks">
      <strong>#{num(block)}</strong>
      <p>218 txs · 82% cheio</p>
      <div className="blockbars">
        {bars.map((h, i) => (
          <i key={i} style={{ height: `${h}%` }} />
        ))}
      </div>
      <dl>
        <div>
          <dt>Bloco médio</dt>
          <dd>12,1s</dd>
        </div>
        <div>
          <dt>Gas usado</dt>
          <dd>68%</dd>
        </div>
        <div>
          <dt>Vazão</dt>
          <dd>14,2 tx/s</dd>
        </div>
      </dl>
    </Tile>
  )
}

function Activity({ activity }: { activity: Web3Activity[] }) {
  return (
    <Tile title="Atividade onchain" className="w3b-activity">
      <ul>
        {activity.map((a) => (
          <li key={a.id}>
            <i>
              {a.kind === 'bridge' ? '⌒' : a.kind === 'swap' ? '⇄' : a.kind === 'stake' ? '◇' : '✣'}
            </i>
            <div>
              <b>{a.title}</b>
              <small>
                {a.detail} · {a.time}
              </small>
            </div>
            <span>
              <b>{a.amount}</b>
              <small className={a.status}>
                {a.status === 'pending' ? '◌ pendente' : 'confirmada'}
              </small>
            </span>
          </li>
        ))}
      </ul>
    </Tile>
  )
}

export function Web3Bento({
  account = 'marina.eth',
  network = 'Ethereum',
  history = HISTORY,
  benchmark = BENCHMARK,
  allocation = ALLOCATION,
  activity = ACTIVITIES,
  cards = CARDS,
  className = '',
}: Web3BentoProps) {
  const reduced = useReduced()
  return (
    <div className={`w3b ${className}`}>
      <style>{W3B_CSS}</style>
      <nav>
        <span>● {network}</span>
        <b>{account}</b>
      </nav>
      <main>
        <Hero account={account} history={history} reduced={reduced} />
        <Cards cards={cards} />
        <Gas reduced={reduced} />
        <Chart history={history} benchmark={benchmark} />
        <Allocation allocation={allocation} />
        <Staking reduced={reduced} />
        <Liquidity reduced={reduced} />
        <Blocks reduced={reduced} />
        <Activity activity={activity} />
      </main>
    </div>
  )
}
export default Web3Bento

const W3B_CSS = `
@layer base { .w3b { position:relative;width:100%;max-width:1120px;margin:0 } }
.w3b{--lime:oklch(.89 .2 128);--lilac:oklch(.74 .12 300);--card:oklch(.205 0 0);--muted:oklch(.708 0 0);container:w3b/inline-size;color:oklch(.985 0 0);font:400 16px/1.5 var(--font-geist-sans,Geist),system-ui,sans-serif;-webkit-font-smoothing:antialiased}.w3b *{box-sizing:border-box;margin:0;padding:0}.w3b button{font:inherit;color:inherit;border:0;background:none;cursor:pointer}.w3b nav{display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px}.w3b nav span,.w3b nav b{border:1px solid #ffffff1a;border-radius:99px;padding:6px 12px;font-size:12px}.w3b nav span{color:#fff}.w3b nav span::first-letter{color:var(--lime)}.w3b nav b{background:#fafafa;color:#171717;font-family:"Geist Mono",monospace}.w3b main{display:grid;grid-template-columns:1fr;gap:12px}.w3b-tile,.w3b-stake{min-width:0;overflow:hidden;border:1px solid #ffffff1a;border-radius:26px;background:var(--card);padding:20px}.w3b-tile>header,.w3b-stake>header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.w3b h3{font-size:13px;font-weight:500;color:var(--muted)}.w3b strong,.w3b b,.w3b dd{font-family:"Geist Mono",monospace;font-variant-numeric:tabular-nums}.w3b .muted,.w3b small,.w3b p{color:var(--muted)}.w3b .axis{display:flex;justify-content:space-between;margin-top:8px;color:var(--muted);font:11px "Geist Mono",monospace}.w3b .w3b-hero-top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:24px}.w3b .w3b-gm{font-size:34px;font-weight:600;color:#fff}.w3b .w3b-gm b{color:var(--lime);font-family:inherit}.w3b .worth{text-align:right}.w3b .worth small{display:block}.w3b .worth strong{display:block;font-size:40px;line-height:1}.w3b .worth p{margin-top:6px;color:var(--lime);font:12px "Geist Mono",monospace}.w3b .w3b-pnl{display:flex;align-items:flex-end;gap:3px;height:80px;margin-top:24px}.w3b .w3b-pnl button{flex:1;border-radius:4px;animation:w3grow .9s cubic-bezier(.22,1,.36,1) both}.w3b-cards{display:flex;flex-direction:column}.w3b .card-stack{position:relative;flex:1;min-height:180px}.w3b .card-stack button{position:absolute;left:50%;width:calc(100% - 32px);height:158px;border-radius:12px;padding:16px;text-align:left;transition:.65s cubic-bezier(.34,1.35,.64,1);box-shadow:0 -10px 28px -14px #000}.w3b .card-stack button span{display:block;font-weight:700}.w3b .card-stack button b{position:absolute;right:16px;top:16px}.w3b .card-panel{position:relative;z-index:5;display:flex;align-items:flex-end;justify-content:space-between;height:88px;margin:0 -20px -20px;padding:0 20px 16px;border-top:1px solid #ffffff1a;background:#343434b8;backdrop-filter:blur(18px)}.w3b .card-panel small{display:block}.w3b-gas{text-align:center}.w3b-gas header{text-align:left}.w3b .gauge{position:relative;width:150px;height:75px;margin:15px auto 0;overflow:hidden;border-radius:150px 150px 0 0;background:conic-gradient(from 270deg at 50% 100%,var(--lime) var(--gas),#454545 0 50%,transparent 0)}.w3b .gauge:after{content:"";position:absolute;inset:10px 10px 0;border-radius:130px 130px 0 0;background:var(--card)}.w3b .gauge i{position:absolute;z-index:2;left:74px;bottom:0;width:2px;height:50px;background:#fff;transform-origin:bottom;transform:rotate(-48deg)}.w3b-gas>strong{display:block;margin:8px;font-size:26px}.w3b-gas>strong span{font-size:14px;color:var(--muted)}.w3b-gas>p{font-size:11px}.w3b .pills{display:inline-flex;border:1px solid #ffffff1a;border-radius:99px;padding:2px}.w3b-gas .pills{margin-top:16px}.w3b .pills button{border-radius:99px;padding:4px 10px;font:11px "Geist Mono",monospace;color:var(--muted)}.w3b .pills .on{background:#fff;color:#171717}.w3b .legend{display:flex;align-items:flex-end;gap:32px}.w3b .legend small,.w3b .legend strong{display:block}.w3b .legend strong{font-size:22px}.w3b .legend>b{margin-left:auto;border-radius:99px;padding:4px 10px;background:#b8f64e26;color:var(--lime);font-size:11px}.w3b-chart svg{width:100%;height:220px;margin-top:16px}.w3b-chart polyline{fill:none;stroke:var(--lime);stroke-width:2.5;vector-effect:non-scaling-stroke;stroke-linecap:round;animation:w3draw 1.3s}.w3b-chart polygon{fill:#b8f64e18}.w3b-chart .bench{stroke:var(--muted);stroke-width:1.5;stroke-dasharray:4 5;animation:none}.w3b-alloc>strong,.w3b-lp>strong,.w3b-blocks>strong{font-size:22px}.w3b .allocbar{display:flex;gap:4px;height:36px;margin-top:16px}.w3b .allocbar i{border-radius:8px}.w3b-alloc ul{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;margin-top:16px;list-style:none}.w3b-alloc li{display:flex;justify-content:space-between;font-size:12px}.w3b-alloc li span{display:flex;align-items:center;gap:8px}.w3b-alloc li i{width:8px;height:8px;border-radius:50%}.w3b-alloc li b{color:var(--muted)}.w3b .w3b-stake{display:flex;flex-direction:column;background:var(--lime);color:oklch(.24 .06 135);border:0}.w3b .w3b-stake h3,.w3b .w3b-stake p,.w3b .w3b-stake small{color:inherit}.w3b-stake header b{border-radius:99px;padding:2px 8px;background:#2142211f;font-size:11px}.w3b .apy{font-size:52px;line-height:1}.w3b .apy span{font-size:22px}.w3b .payout{margin-top:20px;border-radius:16px;padding:12px;background:#2142211a}.w3b .payout span,.w3b .payout b{font-size:12px}.w3b .payout b{float:right}.w3b .payout i{display:block;clear:both;height:6px;margin-top:8px;border-radius:99px;background:linear-gradient(90deg,#214221 55%,#21422122 55%)}.w3b-stake dl{margin-top:12px}.w3b-stake dl div{display:flex;justify-content:space-between;font-size:12px}.w3b .stake-foot{margin-top:auto;padding-top:24px}.w3b .stake-foot>strong{display:block;font-size:20px}.w3b .stake-foot>strong span{font-size:13px}.w3b .epochs{display:flex;align-items:end;gap:4px;height:48px;margin-top:20px}.w3b .epochs i{flex:1;border-radius:4px;background:#214221;opacity:.4}.w3b .stake-foot button{width:100%;margin-top:16px;border-radius:16px;padding:12px;background:#214221;color:var(--lime);font-weight:600}.w3b .stake-foot button:disabled{opacity:.6}.w3b .badge{border-radius:99px;padding:2px 8px;background:#b8f64e26;color:var(--lime);font-size:11px}.w3b-lp>small{display:block}.w3b .range{position:relative;height:40px;margin-top:24px;border-radius:10px;background:repeating-linear-gradient(135deg,#b8f64e42 0 6px,#b8f64e1f 6px 12px)}.w3b .range i{position:absolute;top:50%;width:100%;height:2px;background:#555}.w3b .range b{position:absolute;top:-8px;width:3px;height:56px;background:#fff}.w3b-lp>p{margin-top:auto;padding-top:20px;font-size:12px}.w3b-lp>p b{color:#fff}.w3b-blocks>p{font-size:11px}.w3b .blockbars{display:flex;align-items:end;gap:3px;height:64px;margin-top:16px}.w3b .blockbars i{flex:1;border-radius:3px;background:var(--muted);opacity:.45}.w3b .blockbars i:last-child{background:var(--lime);opacity:1}.w3b-blocks dl{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px;border-top:1px solid #ffffff1a;padding-top:12px}.w3b-blocks dt{font-size:11px;color:var(--muted)}.w3b-blocks dd{font-size:13px}.w3b-activity ul{list-style:none}.w3b-activity li{display:flex;align-items:center;gap:12px;padding:8px;border-radius:16px}.w3b-activity li:hover{background:#ffffff0d}.w3b-activity li>i{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:#454545}.w3b-activity li>div{flex:1}.w3b-activity li b,.w3b-activity li small{display:block}.w3b-activity li small{font-size:11px}.w3b-activity li>span{text-align:right}.w3b-activity .pending{color:var(--lime)}
@container w3b (min-width:640px){.w3b main{grid-template-columns:repeat(2,1fr)}.w3b-hero,.w3b-chart,.w3b-blocks,.w3b-activity{grid-column:span 2}}
@container w3b (min-width:1024px){.w3b main{grid-template-columns:repeat(4,1fr)}.w3b-hero{grid-column:1/span 2;grid-row:1}.w3b-cards{grid-column:3;grid-row:1}.w3b-gas{grid-column:4;grid-row:1}.w3b-chart{grid-column:1/span 2;grid-row:2/span 2}.w3b-alloc{grid-column:3;grid-row:2}.w3b-stake{grid-column:4;grid-row:2/span 2}.w3b-lp{grid-column:3;grid-row:3}.w3b-blocks{grid-column:1/span 2;grid-row:4}.w3b-activity{grid-column:3/span 2;grid-row:4}}
@keyframes w3grow{from{transform:scaleY(.05);transform-origin:bottom}}@keyframes w3draw{from{stroke-dasharray:1;stroke-dashoffset:1}to{stroke-dashoffset:0}}@media(prefers-reduced-motion:reduce){.w3b,.w3b *{animation:none!important;transition:none!important}}
`
