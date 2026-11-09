```tsx
'use client'

import * as React from 'react'

/**
 * Web3 Bento — um painel de carteira cripto escuro, montado em bento: o patrimônio com o PnL de cada dia do mês, os
 * cartões empilhados, o gas ao vivo, a carteira contra o ETH, a alocação, o staking rendendo por segundo, a faixa de
 * liquidez, os blocos chegando e a atividade onchain.
 *
 * Os gráficos são SVG e DOM, sem biblioteca. As barras crescem, as linhas se desenham e os números contam na entrada;
 * o gas, o preço da faixa, os blocos e as recompensas andam sozinhos. Passar o mouse nas barras e no gráfico mostra o
 * valor de cada ponto, e clicar num cartão de trás o traz para a frente.
 *
 * O painel segue a largura dele, não a da tela (container queries): quatro colunas a partir de 1024 px, duas a partir
 * de 640 px e uma abaixo disso.
 *
 * Autocontido: o React é o único import. Sem Tailwind, sem bibliotecas, sem arquivo CSS: o CSS mora numa <style> com
 * classes w3b-*, e o painel não herda nada da página. As cores do tema são variáveis --w3b-* na raiz; as fontes, a
 * Geist e a Geist Mono, que a página carrega.
 */

/* ------------------------------------------------------------------ */
/*  Tipos                                                              */
/* ------------------------------------------------------------------ */

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
  /** O nome do cartão, que aparece quando não há logo. */
  label: string
  last4: string
  holder?: string
  expiry?: string
  balance?: string
  /** O logo da bandeira (passe o SVG oficial da Visa, da Mastercard etc.); sem ele, o chip. */
  logo?: React.ReactNode
  /** A cor de base da face do cartão. */
  color: string
  /** A segunda cor do degradê. */
  color2: string
  /** A cor do texto no cartão. */
  ink: string
}

export interface Web3BentoProps {
  /** O ENS ou o endereço curto da saudação. */
  account?: string
  network?: string
  /** O valor da carteira em dólares, do mais antigo ao mais novo, um ponto por dia (pelo menos 31; o 1A usa 365). */
  history?: number[]
  /** A referência (só ETH) na mesma escala e com o mesmo tamanho de history. */
  benchmark?: number[]
  allocation?: Web3Allocation[]
  staking?: { asset: string; staked: number; apy: number; rewards: number; usdPrice: number }
  liquidity?: { pair: string; fee: string; min: number; max: number; price: number; fees: number }
  activity?: Web3Activity[]
  /** Os cartões da pilha, de trás para a frente. */
  cards?: Web3Card[]
  /** O acento principal (verde-limão) e o segundo (lilás), para as altas e as baixas. */
  accent?: string
  accent2?: string
  /** O formato dos números (pt-BR: US$ 99.800,00). */
  locale?: string
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Dados da demo                                                      */
/* ------------------------------------------------------------------ */

// um passeio aleatório com semente (o mesmo a cada carga), suavizado por uma média de 4 dias
function walk(seed: number, n: number, start: number, drift: number, vol: number) {
  let h = seed
  const rnd = () => {
    h = (h * 16807) % 2147483647
    return h / 2147483647
  }
  const out: number[] = []
  let v = start
  for (let i = 0; i < n; i++) {
    v *= 1 + drift + (rnd() - 0.5) * vol
    out.push(v)
  }
  return out.map((_, i) => {
    const w = out.slice(Math.max(0, i - 3), i + 1)
    return w.reduce((s, x) => s + x, 0) / w.length
  })
}

const DEMO = {
  account: 'marina.eth',
  network: 'Ethereum',
  history: walk(7, 365, 61000, 0.0011, 0.045),
  benchmark: walk(11, 365, 61000, 0.0006, 0.05),
  allocation: [
    { symbol: 'ETH', value: 58200 },
    { symbol: 'USDC', value: 21400 },
    { symbol: 'ARB', value: 9800 },
    { symbol: 'OP', value: 6100 },
    { symbol: 'Outros', value: 4300 },
  ],
  staking: { asset: 'ETH', staked: 32, apy: 3.42, rewards: 0.41837215, usdPrice: 3368.5 },
  liquidity: { pair: 'ETH / USDC', fee: '0,05%', min: 3120, max: 3640, price: 3368.5, fees: 412.8 },
  activity: [
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
    {
      id: 'a5',
      kind: 'receive',
      title: 'Recebido',
      detail: 'de 0x8f…21c4',
      amount: '+500 USDC',
      status: 'confirmed',
      time: '2 d',
    },
  ] as Web3Activity[],
}

/* ------------------------------------------------------------------ */
/*  Utilitários                                                        */
/* ------------------------------------------------------------------ */

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const STATUS: Record<Web3Activity['status'], string> = {
  confirmed: 'confirmada',
  pending: 'pendente',
  failed: 'falhou',
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

const REDUCED = '(prefers-reduced-motion: reduce)'
const onReducedChange = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

// no servidor, sem preferência; no navegador, a do sistema, e ela muda junto
function useReducedMotion() {
  return React.useSyncExternalStore(
    onReducedChange,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  )
}

function useMounted() {
  const [on, setOn] = React.useState(false)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return on
}

const noSubscribe = () => () => {}
const todayKey = () => new Date().toDateString()

// o dia de hoje só no navegador: no HTML do servidor as datas saem vazias, e a hidratação não briga com o relógio
function useToday() {
  const key = React.useSyncExternalStore(noSubscribe, todayKey, () => null)
  return React.useMemo(() => (key ? new Date(key) : null), [key])
}

// conta de 0 até o valor; sem movimento, o valor direto
function useCountUp(target: number, enabled: boolean, duration = 1300) {
  const [v, setV] = React.useState(0)
  React.useEffect(() => {
    if (!enabled) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      setV(target * (1 - Math.pow(1 - p, 4)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, enabled, duration])
  return enabled ? v : target
}

function smooth(pts: ReadonlyArray<readonly [number, number]>) {
  return pts
    .map(([x, y], i) => {
      if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`
      const [px, py] = pts[i - 1]
      const m = (px + x) / 2
      return `C ${m.toFixed(1)} ${py.toFixed(1)}, ${m.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

const shortDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`
const sign = (v: number) => (v >= 0 ? '+' : '−')

type Fmt = { usd: (v: number, d?: number) => string; num: (v: number, d?: number) => string }

/* ------------------------------------------------------------------ */
/*  Casca                                                              */
/* ------------------------------------------------------------------ */

function Tile({
  title,
  action,
  className,
  children,
}: {
  title?: React.ReactNode
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cx('w3b-tile', className)}>
      {(title || action) && (
        <header className="w3b-head">
          {title && <h3>{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

function Pills<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: T[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="w3b-pills">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={o === value}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Abertura: saudação, patrimônio e o PnL de 30 dias                  */
/* ------------------------------------------------------------------ */

function HeroTile({
  account,
  history,
  fmt,
  accent,
  accent2,
  reduced,
}: {
  account: string
  history: number[]
  fmt: Fmt
  accent: string
  accent2: string
  reduced: boolean
}) {
  const mounted = useMounted()
  const today = useToday()
  const value = history[history.length - 1]
  const shown = useCountUp(value, !reduced)
  const month = history.slice(-31)
  const daily = month.slice(1).map((v, i) => (v / month[i] - 1) * 100)
  const maxAbs = Math.max(...daily.map(Math.abs), 0.01)
  const change = value - month[0]
  const pct = (value / month[0] - 1) * 100
  const [hover, setHover] = React.useState<number | null>(null)
  const dayLabel = (i: number) => {
    if (!today) return ''
    const d = new Date(today)
    d.setDate(d.getDate() - (daily.length - 1 - i))
    return shortDate(d)
  }

  return (
    <Tile className="w3b-hero">
      <div className="w3b-hero__top">
        <div className="w3b-hero__hi">
          <p className="w3b-hero__gm">
            gm, <span style={{ color: accent }}>{account}</span>
          </p>
          <p className="w3b-hero__sub">Seu mês onchain num relance.</p>
        </div>
        <div className="w3b-hero__worth">
          <p className="w3b-label">Patrimônio</p>
          <p className="w3b-hero__value">{fmt.usd(shown)}</p>
          <p className="w3b-hero__change">
            <span style={{ color: change >= 0 ? accent : accent2 }}>
              {sign(change)}
              {fmt.usd(Math.abs(change))} ({sign(pct)}
              {fmt.num(Math.abs(pct), 1)}%)
            </span>
            <span className="w3b-muted"> · 30d</span>
          </p>
        </div>
      </div>

      {/* PnL de cada dia */}
      <div className="w3b-hero__pnl">
        <div className="w3b-bars" onPointerLeave={() => setHover(null)}>
          {daily.map((d, i) => {
            const h = 18 + (Math.abs(d) / maxAbs) * 82
            const up = d >= 0
            return (
              <button
                key={i}
                type="button"
                onPointerEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${dayLabel(i)}: ${sign(d)}${fmt.num(Math.abs(d), 2)}%`}
                className="w3b-bar"
                style={{
                  height: mounted ? `${h}%` : '6%',
                  background: up ? accent : accent2,
                  opacity:
                    hover === null ? 0.35 + (Math.abs(d) / maxAbs) * 0.65 : hover === i ? 1 : 0.25,
                  transition: `height 900ms ${EASE} ${i * 18}ms, opacity 200ms ease`,
                }}
              />
            )
          })}
        </div>
        <div className="w3b-axis">
          <span>{dayLabel(0)}</span>
          <span className="w3b-axis__now" aria-live="polite">
            {hover !== null
              ? `${dayLabel(hover)} · ${sign(daily[hover])}${fmt.num(Math.abs(daily[hover]), 2)}%`
              : 'PnL diário'}
          </span>
          <span>Hoje</span>
        </div>
      </div>
    </Tile>
  )
}

/* ------------------------------------------------------------------ */
/*  Cartões: a pilha em leque; clicar num de trás o traz para a frente */
/* ------------------------------------------------------------------ */

function Chip() {
  return (
    <svg width="26" height="20" viewBox="0 0 26 20" aria-hidden>
      <rect
        x="0.5"
        y="0.5"
        width="25"
        height="19"
        rx="4.5"
        fill="oklch(0.9 0.06 90)"
        stroke="oklch(0.62 0.07 80 / 0.6)"
      />
      <path
        d="M0.5 7h7.5v6H0.5M25.5 7H18v6h7.5M8 0.5v19M18 0.5v19M8 10h10"
        fill="none"
        stroke="oklch(0.6 0.07 80 / 0.55)"
        strokeWidth="0.9"
      />
    </svg>
  )
}

function CardFace({ c, glare }: { c: Web3Card; glare: number }) {
  return (
    <>
      <span
        aria-hidden
        className="w3b-face"
        style={{
          backgroundImage: [
            'linear-gradient(180deg, oklch(1 0 0 / 0.3) 0%, transparent 34%)',
            `radial-gradient(110% 90% at 100% 0%, ${c.color2} 0%, transparent 60%)`,
            `linear-gradient(135deg, ${c.color} 0%, ${c.color2} 100%)`,
          ].join(', '),
        }}
      >
        {/* película holográfica */}
        <span className="w3b-holo" style={{ backgroundPosition: `${glare}% 0` }} />
      </span>

      <span className="w3b-face__top">
        <span className="w3b-face__name">
          {c.logo ?? <Chip />}
          <span>{c.label}</span>
        </span>
        <span className="w3b-face__last4">**** {c.last4}</span>
      </span>

      <span className="w3b-face__nfc" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M8.5 7.5a6 6 0 0 1 0 9M12 5a9.5 9.5 0 0 1 0 14M15.5 2.5a13 13 0 0 1 0 19"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </>
  )
}

function CardsTile({ cards, reduced }: { cards: Web3Card[]; reduced: boolean }) {
  const [order, setOrder] = React.useState(() => cards.map((c) => c.id))
  const mounted = useMounted()
  const PEEK = 46
  const depth = order.length - 1
  const byId = (id: string) => cards.find((c) => c.id === id) ?? cards[cards.length - 1]
  const front = byId(order[order.length - 1])
  const [glare, setGlare] = React.useState(30)
  const dragGlare = React.useRef(false)
  React.useEffect(() => {
    if (reduced) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      setGlare((g) => (dragGlare.current ? g : 30 + Math.sin((now - t0) / 2600) * 30))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  return (
    <Tile
      title={
        <span>
          Cartões <sup>{cards.length}</sup>
        </span>
      }
      className="w3b-cards"
    >
      <div
        className="w3b-cards__well"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          dragGlare.current = true
          setGlare(((e.clientX - r.left) / r.width) * 100)
        }}
        onPointerLeave={() => {
          dragGlare.current = false
        }}
      >
        <div className="w3b-cards__stack">
          {order.map((id, pos) => {
            const c = byId(id)
            const fromFront = order.length - 1 - pos // 0 = o da frente
            const isFront = fromFront === 0
            return (
              <button
                key={id}
                type="button"
                onClick={() => !isFront && setOrder((o) => [...o.filter((x) => x !== id), id])}
                aria-label={`Cartão ${c.label} final ${c.last4}${isFront ? ', selecionado' : ', trazer para a frente'}`}
                aria-pressed={isFront}
                className="w3b-card"
                style={{
                  top: (depth - fromFront) * PEEK,
                  zIndex: pos + 1,
                  transform: `translateX(-50%) scale(${1 - fromFront * 0.055}) translateY(${mounted ? 0 : 20}px)`,
                  opacity: mounted ? 1 : 0,
                  color: c.ink,
                  transition: reduced
                    ? 'none'
                    : `top 650ms cubic-bezier(0.34, 1.35, 0.64, 1), transform 650ms cubic-bezier(0.34, 1.35, 0.64, 1), opacity 500ms ease ${pos * 90}ms`,
                  cursor: isFront ? 'default' : 'pointer',
                }}
              >
                {/* a proporção de um cartão de banco (85,6 × 54 mm), sem depender de aspect-ratio num botão */}
                <span className="w3b-card__ratio">
                  <span className="w3b-card__fill">
                    <CardFace c={c} glare={glare + fromFront * 18} />
                  </span>
                </span>
              </button>
            )
          })}

          {/* o espaçador dá à pilha a altura de verdade, e o cartão da frente nunca é espremido */}
          <div aria-hidden className="w3b-cards__spacer" style={{ marginTop: depth * PEEK }}>
            {/* só a parte de cima do cartão da frente aparece; o resto passa por baixo do painel */}
            <div />
          </div>
        </div>

        {/* o painel fosco por onde a pilha entra */}
        <div className="w3b-cards__panel" aria-live="polite">
          <div className="w3b-cards__info">
            <p className="w3b-cards__number">•••• {front.last4}</p>
            <p className="w3b-cards__holder">
              {front.holder ?? front.label}
              {front.expiry ? ` · ${front.expiry}` : ''}
            </p>
          </div>
          {front.balance && <p className="w3b-cards__balance">{front.balance}</p>}
        </div>
      </div>
    </Tile>
  )
}

/* ------------------------------------------------------------------ */
/*  Gas: o mostrador em meia-lua com o gwei ao vivo                    */
/* ------------------------------------------------------------------ */

type Speed = 'Lento' | 'Normal' | 'Rápido'

function GasTile({
  accent,
  ethPrice,
  fmt,
  reduced,
}: {
  accent: string
  ethPrice: number
  fmt: Fmt
  reduced: boolean
}) {
  const [gwei, setGwei] = React.useState(14.2)
  const [tier, setTier] = React.useState<Speed>('Normal')
  React.useEffect(() => {
    if (reduced) return
    const id = window.setInterval(
      () => setGwei((g) => Math.max(4, Math.min(60, g + (Math.random() - 0.5) * 3.2))),
      2200,
    )
    return () => window.clearInterval(id)
  }, [reduced])

  const mult = { Lento: 0.85, Normal: 1, Rápido: 1.35 }[tier]
  const value = gwei * mult
  const t = Math.min(1, value / 60)
  const R = 62
  const len = Math.PI * R
  const angle = -90 + t * 180
  // uma transferência simples gasta 21.000 de gas
  const cost = value * 21000 * 1e-9 * ethPrice

  return (
    <Tile title="Gas" className="w3b-gas" action={<span className="w3b-tag">ao vivo</span>}>
      <div className="w3b-gas__body">
        <svg width="150" height="86" viewBox="0 0 150 86" aria-hidden>
          <path
            d="M 13 78 A 62 62 0 0 1 137 78"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            style={{ stroke: 'var(--w3b-muted)' }}
          />
          <path
            d="M 13 78 A 62 62 0 0 1 137 78"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={len}
            style={{
              stroke: accent,
              strokeDashoffset: len * (1 - t),
              transition: `stroke-dashoffset 900ms ${EASE}`,
            }}
          />
          <g
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: '75px 78px',
              transition: `transform 900ms ${EASE}`,
            }}
          >
            <line
              x1="75"
              y1="78"
              x2="75"
              y2="30"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ stroke: 'var(--w3b-fg)' }}
            />
          </g>
          <circle cx="75" cy="78" r="5" style={{ fill: 'var(--w3b-fg)' }} />
        </svg>
        <p className="w3b-gas__value">
          {fmt.num(value, 1)} <span>gwei</span>
        </p>
        <p className="w3b-small">≈ {fmt.usd(cost, 2)} por transferência</p>
      </div>
      <div className="w3b-gas__speed">
        <Pills
          label="Velocidade"
          value={tier}
          options={['Lento', 'Normal', 'Rápido']}
          onChange={setTier}
        />
      </div>
    </Tile>
  )
}

/* ------------------------------------------------------------------ */
/*  A carteira contra o ETH                                            */
/* ------------------------------------------------------------------ */

type Range = '1S' | '1M' | '1A'

function ChartTile({
  history,
  benchmark,
  fmt,
  accent,
  reduced,
}: {
  history: number[]
  benchmark: number[]
  fmt: Fmt
  accent: string
  reduced: boolean
}) {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [range, setRange] = React.useState<Range>('1A')
  const [hover, setHover] = React.useState<number | null>(null)
  const mounted = useMounted()
  const today = useToday()
  const take = { '1S': 8, '1M': 31, '1A': history.length }[range]
  const step = range === '1A' ? 7 : 1
  const pick = (a: number[]) =>
    a.slice(-take).filter((_, i, arr) => i % step === 0 || i === arr.length - 1)
  const a = pick(history)
  const b = pick(benchmark)
  const W = 640
  const H = 220
  const lo = Math.min(...a, ...b)
  const hi = Math.max(...a, ...b)
  const y = (v: number) => H - 16 - ((v - lo) / (hi - lo || 1)) * (H - 40)
  const pa = a.map((v, i) => [(i / (a.length - 1)) * W, y(v)] as const)
  const pb = b.map((v, i) => [(i / (b.length - 1)) * W, y(v)] as const)
  const la = smooth(pa)
  const lb = smooth(pb)
  const idx = hover ?? a.length - 1
  const lead = (a[a.length - 1] / a[0] - 1 - (b[b.length - 1] / b[0] - 1)) * 100

  // as marcas do eixo saem do dia de hoje: um mês a cada dois no 1A, as semanas no 1M e os dias no 1S
  const labels = (() => {
    if (range === '1M') return ['4 sem', '3 sem', '2 sem', '1 sem', 'Hoje']
    if (!today) return Array<string>(7).fill('')
    if (range === '1A') {
      return [12, 10, 8, 6, 4, 2]
        .map((k) => {
          const m = MONTHS[(today.getMonth() - k + 24) % 12]
          return m[0].toUpperCase() + m.slice(1)
        })
        .concat('Hoje')
    }
    return [6, 5, 4, 3, 2, 1].map((k) => WEEKDAYS[(today.getDay() - k + 7) % 7]).concat('Hoje')
  })()

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // clientWidth e offsetX não mudam com um transform em volta (um zoom, uma prévia encolhida)
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * el.clientWidth
    setHover(Math.max(0, Math.min(a.length - 1, Math.round((x / el.clientWidth) * (a.length - 1)))))
  }

  const left = `${(pa[idx][0] / W) * 100}%`

  return (
    <Tile
      title="Carteira vs ETH"
      className="w3b-chart"
      action={
        <Pills
          label="Período do gráfico"
          value={range}
          options={['1S', '1M', '1A']}
          onChange={setRange}
        />
      }
    >
      <div className="w3b-chart__legend">
        <div>
          <p className="w3b-key">
            <span className="w3b-key__line" style={{ background: accent }} aria-hidden />
            Carteira
          </p>
          <p className="w3b-figure">{fmt.usd(a[idx])}</p>
        </div>
        <div>
          <p className="w3b-key">
            <span className="w3b-key__dash" aria-hidden />
            Só ETH
          </p>
          <p className="w3b-figure w3b-muted">{fmt.usd(b[idx])}</p>
        </div>
        <span
          className="w3b-chart__lead"
          style={{ background: `color-mix(in oklch, ${accent} 18%, transparent)`, color: accent }}
        >
          {sign(lead)}
          {fmt.num(Math.abs(lead), 1)}% vs ETH
        </span>
      </div>

      <div
        className="w3b-chart__plot"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Carteira em ${fmt.usd(a[a.length - 1])} contra ${fmt.usd(b[b.length - 1])} só em ETH, em ${range}`}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={`${uid}-f`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" style={{ stopColor: accent, stopOpacity: 0.28 }} />
              <stop offset="1" style={{ stopColor: accent, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={0}
              x2={W}
              y1={H * f}
              y2={H * f}
              vectorEffect="non-scaling-stroke"
              strokeDasharray="1 5"
              style={{ stroke: 'var(--w3b-border)' }}
            />
          ))}
          <path
            d={`${la} L ${W} ${H} L 0 ${H} Z`}
            fill={`url(#${uid}-f)`}
            style={{ opacity: mounted ? 1 : 0, transition: 'opacity 900ms ease 400ms' }}
          />
          <path
            d={lb}
            fill="none"
            strokeWidth={1.5}
            strokeDasharray="4 5"
            vectorEffect="non-scaling-stroke"
            style={{ stroke: 'var(--w3b-muted-fg)' }}
          />
          <path
            key={range}
            d={la}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            style={{
              stroke: accent,
              strokeDasharray: 1,
              strokeDashoffset: mounted || reduced ? 0 : 1,
              transition: reduced ? 'none' : `stroke-dashoffset 1300ms ${EASE}`,
            }}
          />
        </svg>
        <span
          aria-hidden
          className="w3b-chart__cross"
          style={{ left, opacity: hover !== null ? 1 : 0 }}
        />
        <span
          aria-hidden
          className="w3b-chart__dot"
          style={{ left, top: `${(pa[idx][1] / H) * 100}%`, background: accent }}
        />
        <span
          aria-hidden
          className="w3b-chart__dot2"
          style={{ left, top: `${(pb[idx][1] / H) * 100}%`, opacity: hover !== null ? 1 : 0 }}
        />
      </div>
      <div className="w3b-axis w3b-chart__axis" aria-hidden>
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </Tile>
  )
}

/* ------------------------------------------------------------------ */
/*  Alocação: a barra em segmentos                                     */
/* ------------------------------------------------------------------ */

function AllocationTile({
  allocation,
  fmt,
  accent,
  accent2,
}: {
  allocation: Web3Allocation[]
  fmt: Fmt
  accent: string
  accent2: string
}) {
  const mounted = useMounted()
  const total = allocation.reduce((s, a) => s + a.value, 0)
  const colors = [
    accent,
    accent2,
    'oklch(0.78 0.04 280)',
    'oklch(0.6 0.03 280)',
    'oklch(0.42 0.02 280)',
  ]
  const [hover, setHover] = React.useState<number | null>(null)

  return (
    <Tile title="Alocação" className="w3b-alloc">
      <p className="w3b-figure">{fmt.usd(total)}</p>
      <div className="w3b-alloc__bar" onPointerLeave={() => setHover(null)}>
        {allocation.map((a, i) => (
          <span
            key={a.symbol}
            onPointerEnter={() => setHover(i)}
            style={{
              flexBasis: mounted ? `${(a.value / total) * 100}%` : `${100 / allocation.length}%`,
              background: colors[i % colors.length],
              opacity: hover === null || hover === i ? 1 : 0.3,
              transition: `flex-basis 1000ms ${EASE} ${200 + i * 60}ms, opacity 200ms ease`,
            }}
            aria-hidden
          />
        ))}
      </div>
      <ul className="w3b-alloc__list">
        {allocation.map((a, i) => (
          <li
            key={a.symbol}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
          >
            <span className="w3b-alloc__name">
              <i style={{ background: colors[i % colors.length] }} aria-hidden />
              {a.symbol}
            </span>
            <span className="w3b-alloc__pct">{fmt.num((a.value / total) * 100, 1)}%</span>
          </li>
        ))}
      </ul>
    </Tile>
  )
}

/* ------------------------------------------------------------------ */
/*  Staking: o cartão no acento, com as recompensas rendendo ao vivo   */
/* ------------------------------------------------------------------ */

const EPOCH = 6.4 * 60
const EPOCHS = [0.62, 0.7, 0.58, 0.81, 0.74, 0.9, 0.86, 0.95, 0.88, 1]

function StakingTile({
  staking,
  fmt,
  accent,
  reduced,
}: {
  staking: NonNullable<Web3BentoProps['staking']>
  fmt: Fmt
  accent: string
  reduced: boolean
}) {
  const [rewards, setRewards] = React.useState(staking.rewards)
  const perSecond = (staking.staked * staking.apy) / 100 / (365 * 24 * 3600)
  React.useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setRewards((r) => r + perSecond * 0.1), 100)
    return () => window.clearInterval(id)
  }, [reduced, perSecond])
  const [claimed, setClaimed] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(211)
  React.useEffect(() => {
    const id = window.setInterval(() => setElapsed((e) => (e + 1) % EPOCH), 1000)
    return () => window.clearInterval(id)
  }, [])
  const left = EPOCH - elapsed
  const payoutLeft = `${Math.floor(left / 60)}m ${String(Math.floor(left % 60)).padStart(2, '0')}s`
  const payoutPct = (elapsed / EPOCH) * 100

  return (
    <section className="w3b-stake" style={{ background: accent }}>
      <header className="w3b-stake__head">
        <h3>Staking</h3>
        <span className="w3b-stake__badge">
          <i aria-hidden />
          Rendendo
        </span>
      </header>

      <p className="w3b-stake__apy">
        {fmt.num(staking.apy, 2)}
        <span>%</span>
      </p>
      <p className="w3b-stake__on">
        APY sobre {fmt.num(staking.staked)} {staking.asset}
      </p>

      {/* próximo pagamento */}
      <div className="w3b-stake__payout">
        <div className="w3b-stake__row">
          <span className="w3b-dim">Próximo pagamento</span>
          <span className="w3b-mono">{payoutLeft}</span>
        </div>
        <div className="w3b-stake__track">
          <div style={{ width: `${payoutPct}%` }} />
        </div>
      </div>
      <dl className="w3b-stake__facts">
        {[
          ['Validador', '#1.204.381'],
          ['Eficiência', '99,4%'],
          ['Provedor', 'Lido'],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <div className="w3b-stake__foot">
        <p className="w3b-stake__label">Recompensas até agora</p>
        <p className="w3b-stake__rewards" aria-live="off">
          {fmt.num(rewards, 8)} <span>{staking.asset}</span>
        </p>
        <p className="w3b-stake__usd">≈ {fmt.usd(rewards * staking.usdPrice)}</p>

        <div className="w3b-stake__epochs" aria-hidden>
          {EPOCHS.map((e, i) => (
            <span
              key={i}
              style={{ height: `${e * 100}%`, opacity: 0.12 + (i / EPOCHS.length) * 0.5 }}
            />
          ))}
        </div>
        <p className="w3b-stake__caption">Últimas 10 épocas</p>

        <button
          type="button"
          onClick={() => setClaimed(true)}
          disabled={claimed}
          className="w3b-stake__claim"
          style={{ color: accent }}
        >
          {claimed ? 'Resgate enviado' : 'Resgatar recompensas'}
        </button>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  A faixa de liquidez                                                */
/* ------------------------------------------------------------------ */

function LiquidityTile({
  lp,
  fmt,
  accent,
  accent2,
  reduced,
}: {
  lp: NonNullable<Web3BentoProps['liquidity']>
  fmt: Fmt
  accent: string
  accent2: string
  reduced: boolean
}) {
  const [price, setPrice] = React.useState(lp.price)
  React.useEffect(() => {
    if (reduced) return
    const id = window.setInterval(
      () => setPrice((p) => p * (1 + (Math.random() - 0.5) * 0.006)),
      1800,
    )
    return () => window.clearInterval(id)
  }, [reduced])
  const lo = lp.min - (lp.max - lp.min) * 0.45
  const hi = lp.max + (lp.max - lp.min) * 0.45
  const pos = (v: number) => ((v - lo) / (hi - lo)) * 100
  const inRange = price >= lp.min && price <= lp.max
  const tone = inRange ? accent : accent2

  return (
    <Tile
      title={`${lp.pair} · ${lp.fee}`}
      className="w3b-lp"
      action={
        <span
          className="w3b-badge"
          style={{ background: `color-mix(in oklch, ${tone} 18%, transparent)`, color: tone }}
        >
          {inRange ? 'Na faixa' : 'Fora da faixa'}
        </span>
      }
    >
      <p className="w3b-figure">{fmt.usd(price, 2)}</p>
      <p className="w3b-small">preço atual</p>

      <div
        className="w3b-lp__range"
        role="img"
        aria-label={`Faixa de ${fmt.usd(lp.min)} a ${fmt.usd(lp.max)}, preço em ${fmt.usd(price, 2)}`}
      >
        <div className="w3b-lp__line" />
        <div
          className="w3b-lp__band"
          style={{
            left: `${pos(lp.min)}%`,
            width: `${pos(lp.max) - pos(lp.min)}%`,
            background: `repeating-linear-gradient(135deg, color-mix(in oklch, ${accent} 26%, transparent) 0 6px, color-mix(in oklch, ${accent} 12%, transparent) 6px 12px)`,
            boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${accent} 55%, transparent)`,
          }}
        />
        <div
          className="w3b-lp__price"
          style={{
            left: `${Math.max(2, Math.min(98, pos(price)))}%`,
            transition: `left 900ms ${EASE}`,
          }}
        />
      </div>
      <div className="w3b-axis">
        <span style={{ marginLeft: `${pos(lp.min) - 6}%` }}>{fmt.num(lp.min)}</span>
        <span style={{ marginRight: `${100 - pos(lp.max) - 6}%` }}>{fmt.num(lp.max)}</span>
      </div>
      <p className="w3b-lp__fees">
        Taxas ganhas <b>{fmt.usd(lp.fees, 2)}</b>
      </p>
    </Tile>
  )
}

/* ------------------------------------------------------------------ */
/*  Os blocos chegando                                                 */
/* ------------------------------------------------------------------ */

function BlocksTile({ accent, fmt, reduced }: { accent: string; fmt: Fmt; reduced: boolean }) {
  const seed = React.useMemo(
    () =>
      Array.from(
        { length: 42 },
        (_, i) => 0.35 + ((((Math.sin(i * 12.9898) * 43758.5453) % 1) + 1) % 1) * 0.65,
      ),
    [],
  )
  const [blocks, setBlocks] = React.useState(() =>
    seed.map((f, i) => ({ n: 21094290 + i, fill: f, txs: Math.round(80 + f * 180) })),
  )
  const [ago, setAgo] = React.useState(0)
  React.useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => {
      setBlocks((b) => {
        const f = 0.3 + Math.random() * 0.7
        return [...b.slice(1), { n: b[b.length - 1].n + 1, fill: f, txs: Math.round(80 + f * 180) }]
      })
      setAgo(0)
    }, 3000)
    const t = window.setInterval(() => setAgo((a) => a + 1), 1000)
    return () => {
      window.clearInterval(id)
      window.clearInterval(t)
    }
  }, [reduced])
  const last = blocks[blocks.length - 1]

  return (
    <Tile title="Blocos" className="w3b-blocks" action={<span className="w3b-tag">há {ago}s</span>}>
      <div className="w3b-blocks__top">
        <div>
          <p className="w3b-figure">#{fmt.num(last.n)}</p>
          <p className="w3b-small">
            {last.txs} txs · {fmt.num(last.fill * 100)}% cheio
          </p>
        </div>
        <p className="w3b-small">alvo de 12s</p>
      </div>
      <div className="w3b-blocks__bars" aria-hidden>
        {blocks.map((b, i) => {
          const isLast = i === blocks.length - 1
          return (
            <span
              key={b.n}
              className={isLast && !reduced ? 'w3b-pop' : undefined}
              style={{
                height: `${b.fill * 100}%`,
                background: isLast ? accent : 'var(--w3b-muted-fg)',
                opacity: isLast ? 1 : 0.15 + (i / blocks.length) * 0.45,
              }}
            />
          )
        })}
      </div>
      <dl className="w3b-blocks__stats">
        {[
          ['Bloco médio', '12,1s'],
          [
            'Gas usado',
            `${Math.round((blocks.reduce((t, b) => t + b.fill, 0) / blocks.length) * 100)}%`,
          ],
          ['Vazão', `${fmt.num(blocks.slice(-10).reduce((t, b) => t + b.txs, 0) / 120, 1)} tx/s`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </Tile>
  )
}

/* ------------------------------------------------------------------ */
/*  Atividade                                                          */
/* ------------------------------------------------------------------ */

function KindIcon({ kind }: { kind: Web3Activity['kind'] }) {
  const p = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (kind === 'swap')
    return (
      <svg {...p}>
        <path d="M7 7h12l-3-3M17 17H5l3 3" />
      </svg>
    )
  if (kind === 'bridge')
    return (
      <svg {...p}>
        <path d="M3 17c3-6 15-6 18 0M7 13v4M17 13v4M12 11.5V17" />
      </svg>
    )
  if (kind === 'stake')
    return (
      <svg {...p}>
        <path d="M12 3 4 7l8 4 8-4-8-4ZM4 12l8 4 8-4M4 17l8 4 8-4" />
      </svg>
    )
  if (kind === 'mint')
    return (
      <svg {...p}>
        <path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18" />
      </svg>
    )
  return (
    <svg {...p}>
      <path d="M12 5v14m0 0-6-6m6 6 6-6" />
    </svg>
  )
}

function ActivityTile({
  activity,
  accent,
  accent2,
}: {
  activity: Web3Activity[]
  accent: string
  accent2: string
}) {
  const mounted = useMounted()
  return (
    <Tile title="Atividade onchain" className="w3b-activity">
      <ul className="w3b-activity__list">
        {activity.slice(0, 4).map((a, i) => (
          <li
            key={a.id}
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'none' : 'translateY(6px)',
              transition: `opacity 500ms ease ${300 + i * 70}ms, transform 500ms ${EASE} ${300 + i * 70}ms, background-color 150ms ease`,
            }}
          >
            <span className="w3b-activity__icon">
              <KindIcon kind={a.kind} />
            </span>
            <div className="w3b-activity__text">
              <p className="w3b-activity__title">{a.title}</p>
              <p className="w3b-activity__detail">
                {a.detail} · {a.time}
              </p>
            </div>
            <div className="w3b-activity__end">
              <p className="w3b-activity__amount">{a.amount}</p>
              <p
                className="w3b-activity__status"
                style={{
                  color:
                    a.status === 'pending'
                      ? accent
                      : a.status === 'failed'
                        ? accent2
                        : 'var(--w3b-muted-fg)',
                }}
              >
                {a.status === 'pending' && (
                  <svg width="10" height="10" viewBox="0 0 24 24" className="w3b-spin" aria-hidden>
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity="0.3"
                      strokeWidth="3"
                    />
                    <path
                      d="M21 12a9 9 0 0 0-9-9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {STATUS[a.status]}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Tile>
  )
}

/* ------------------------------------------------------------------ */
/*  O painel                                                           */
/* ------------------------------------------------------------------ */

// O React 19 sobe uma <style> com href e precedence para o <head>, uma vez só para todos os painéis. O React 18 não
// conhece isso: lá ela vai ao lado do painel, escondida e com o CSS cru, porque como filho de texto o SSR do 18
// escaparia as aspas e quebraria os seletores.
const HOISTS_STYLES = Number(React.version.split('.')[0]) >= 19

function Web3BentoStyles() {
  if (HOISTS_STYLES) {
    const hoist = {
      href: 'web3-bento',
      precedence: 'default',
    } as React.StyleHTMLAttributes<HTMLStyleElement>
    return <style {...hoist}>{W3B_CSS}</style>
  }
  return <style hidden dangerouslySetInnerHTML={{ __html: W3B_CSS }} />
}

export function Web3Bento({
  account = DEMO.account,
  network = DEMO.network,
  history = DEMO.history,
  benchmark = DEMO.benchmark,
  allocation = DEMO.allocation,
  staking = DEMO.staking,
  liquidity = DEMO.liquidity,
  activity = DEMO.activity,
  cards,
  accent = 'oklch(0.89 0.2 128)',
  accent2 = 'oklch(0.74 0.12 300)',
  locale = 'pt-BR',
  className,
}: Web3BentoProps) {
  const reduced = useReducedMotion()
  const fmt = React.useMemo<Fmt>(() => {
    const cache: Record<string, Intl.NumberFormat> = {}
    const get = (k: string, o: Intl.NumberFormatOptions) =>
      (cache[k] ??= new Intl.NumberFormat(locale, o))
    return {
      usd: (v, d = 0) =>
        get(`u${d}`, {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: d,
          maximumFractionDigits: d,
        }).format(v),
      num: (v, d = 0) =>
        get(`n${d}`, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v),
    }
  }, [locale])

  return (
    <div className={cx('w3b', className)}>
      <Web3BentoStyles />

      {/* barra de cima */}
      <nav className="w3b-nav" aria-label="Painel">
        <span className="w3b-nav__net">
          <i style={{ background: accent }} aria-hidden />
          {network}
        </span>
        <span className="w3b-nav__account">{account}</span>
      </nav>

      <div className="w3b-grid">
        <HeroTile
          account={account}
          history={history}
          fmt={fmt}
          accent={accent}
          accent2={accent2}
          reduced={reduced}
        />
        {/* outra lista de cartões recomeça a pilha na ordem dela */}
        <CardsTile
          key={(cards ?? []).map((c) => c.id).join('|')}
          reduced={reduced}
          cards={
            cards ?? [
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
                color: accent,
                color2: 'oklch(0.74 0.17 165)',
                ink: 'oklch(0.22 0.06 140)',
              },
            ]
          }
        />
        <GasTile accent={accent} ethPrice={staking.usdPrice} fmt={fmt} reduced={reduced} />
        <ChartTile
          history={history}
          benchmark={benchmark}
          fmt={fmt}
          accent={accent}
          reduced={reduced}
        />
        <AllocationTile allocation={allocation} fmt={fmt} accent={accent} accent2={accent2} />
        <StakingTile staking={staking} fmt={fmt} accent={accent} reduced={reduced} />
        <LiquidityTile
          lp={liquidity}
          fmt={fmt}
          accent={accent}
          accent2={accent2}
          reduced={reduced}
        />
        <BlocksTile accent={accent} fmt={fmt} reduced={reduced} />
        <ActivityTile activity={activity} accent={accent} accent2={accent2} />
      </div>
    </div>
  )
}

export default Web3Bento

/* ------------------------------------------------------------------ */
/*  CSS                                                                */
/* ------------------------------------------------------------------ */

// a Geist do next/font (o create-next-app já a carrega nessas variáveis) ou, sem ela, a do Google Fonts
const SANS = 'var(--font-geist-sans, Geist), ui-sans-serif, system-ui, -apple-system, sans-serif'
const MONO = 'var(--font-geist-mono, "Geist Mono"), ui-monospace, SFMono-Regular, Menlo, monospace'
const STAKE_INK = 'oklch(0.24 0.06 135)'

const W3B_CSS = `
/* o que o projeto pode trocar com uma classe (posição, largura, margem): na camada base, que vem antes dos utilitários
   (Tailwind v4) e perde para o CSS fora de camada (Tailwind v3, CSS Modules, CSS comum) */
@layer base {
  .w3b { position: relative; width: 100%; max-width: 1120px; margin: 0; }
}
/* o tema: troque estas variáveis para outras cores (um tema claro, por exemplo) */
.w3b {
  --w3b-bg: oklch(0.145 0 0);
  --w3b-fg: oklch(0.985 0 0);
  --w3b-card: oklch(0.205 0 0);
  --w3b-muted: oklch(0.269 0 0);
  --w3b-muted-fg: oklch(0.708 0 0);
  --w3b-border: oklch(1 0 0 / 0.1);
  --w3b-ring: oklch(0.556 0 0);
}
/* o painel não herda nada da página: fonte, entrelinha e espaçamento são dele */
.w3b {
  container: w3b / inline-size;
  font: 400 16px/1.5 ${SANS};
  letter-spacing: normal;
  text-align: left;
  text-transform: none;
  text-indent: 0;
  word-spacing: normal;
  color: var(--w3b-fg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.w3b *, .w3b *::before, .w3b *::after { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid; }
.w3b svg { display: block; flex-shrink: 0; }
.w3b p, .w3b h3, .w3b dl, .w3b dd { font-size: inherit; font-weight: inherit; line-height: inherit; letter-spacing: inherit; color: inherit; }
.w3b ul { list-style: none; }
.w3b sup { font: 10px ${MONO}; vertical-align: super; line-height: 0; }
.w3b button { font: inherit; color: inherit; letter-spacing: inherit; text-transform: none; background: none; cursor: pointer; appearance: none; -webkit-tap-highlight-color: transparent; }
.w3b button:disabled { cursor: default; }
.w3b :focus { outline: none; }
.w3b :focus-visible { outline: 2px solid var(--w3b-ring); outline-offset: 0; }
.w3b i { display: block; flex-shrink: 0; border-radius: 9999px; }

.w3b .w3b-mono, .w3b .w3b-figure, .w3b .w3b-small, .w3b .w3b-tag, .w3b .w3b-axis, .w3b .w3b-badge { font-family: ${MONO}; font-variant-numeric: tabular-nums; }
.w3b .w3b-muted { color: var(--w3b-muted-fg); }
.w3b .w3b-label { font-size: 12px; color: var(--w3b-muted-fg); }
.w3b .w3b-figure { font-size: 22px; font-weight: 600; }
.w3b .w3b-small { font-size: 11px; color: var(--w3b-muted-fg); }
.w3b .w3b-tag { font-size: 11px; color: var(--w3b-muted-fg); }
.w3b .w3b-badge { border-radius: 9999px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
.w3b .w3b-axis { display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: var(--w3b-muted-fg); }

/* barra de cima */
.w3b .w3b-nav { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px; margin-bottom: 12px; padding: 0 4px; }
.w3b .w3b-nav__net { display: flex; align-items: center; gap: 8px; border: 1px solid var(--w3b-border); border-radius: 9999px; padding: 6px 12px; font-size: 12px; font-weight: 500; }
.w3b .w3b-nav__net i { width: 8px; height: 8px; }
.w3b .w3b-nav__account { border-radius: 9999px; background: var(--w3b-fg); padding: 6px 12px; font: 600 12px/1.5 ${MONO}; color: var(--w3b-bg); }

/* a grade: uma coluna, duas a partir de 640 px e quatro a partir de 1024 px, pela largura do painel */
.w3b .w3b-grid { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 12px; }
@container w3b (min-width: 640px) {
  .w3b .w3b-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .w3b .w3b-hero, .w3b .w3b-chart, .w3b .w3b-blocks, .w3b .w3b-activity { grid-column: span 2 / span 2; }
}
@container w3b (min-width: 1024px) {
  .w3b .w3b-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .w3b .w3b-hero { grid-column: 1 / span 2; grid-row: 1; }
  .w3b .w3b-cards { grid-column: 3; grid-row: 1; }
  .w3b .w3b-gas { grid-column: 4; grid-row: 1; }
  .w3b .w3b-chart { grid-column: 1 / span 2; grid-row: 2 / span 2; }
  .w3b .w3b-alloc { grid-column: 3; grid-row: 2; }
  .w3b .w3b-stake { grid-column: 4; grid-row: 2 / span 2; }
  .w3b .w3b-lp { grid-column: 3; grid-row: 3; }
  .w3b .w3b-blocks { grid-column: 1 / span 2; grid-row: 4; }
  .w3b .w3b-activity { grid-column: 3 / span 2; grid-row: 4; }
}

/* os cartões do bento */
.w3b .w3b-tile { position: relative; display: flex; flex-direction: column; min-width: 0; overflow: hidden; border: 1px solid var(--w3b-border); border-radius: 26px; background: var(--w3b-card); padding: 20px; color: var(--w3b-fg); }
.w3b .w3b-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.w3b .w3b-head h3 { font-size: 13px; font-weight: 500; color: var(--w3b-muted-fg); }
.w3b .w3b-pills { display: inline-flex; border: 1px solid var(--w3b-border); border-radius: 9999px; padding: 2px; }
.w3b .w3b-pills button { border-radius: 9999px; padding: 4px 10px; font: 500 11px/1.5 ${MONO}; color: var(--w3b-muted-fg); transition: color .15s, background-color .15s; }
.w3b .w3b-pills button:hover { color: var(--w3b-fg); }
.w3b .w3b-pills button[aria-checked="true"] { background: var(--w3b-fg); color: var(--w3b-bg); }

/* abertura */
.w3b .w3b-hero__top { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 24px; }
.w3b .w3b-hero__hi { min-width: 0; }
.w3b .w3b-hero__gm { font-size: 28px; font-weight: 600; line-height: 1.1; letter-spacing: -.03em; }
.w3b .w3b-hero__sub { margin-top: 4px; font-size: 14px; line-height: 20px; color: var(--w3b-muted-fg); }
.w3b .w3b-hero__worth { text-align: right; }
.w3b .w3b-hero__value { font: 600 34px/1 ${MONO}; letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
.w3b .w3b-hero__change { margin-top: 6px; font: 12px/1.5 ${MONO}; font-variant-numeric: tabular-nums; }
@container w3b (min-width: 640px) {
  .w3b .w3b-hero__gm { font-size: 34px; }
  .w3b .w3b-hero__value { font-size: 40px; }
}
.w3b .w3b-hero__pnl { display: flex; flex: 1; flex-direction: column; margin-top: 24px; }
.w3b .w3b-bars { display: flex; flex: 1; align-items: flex-end; gap: 3px; min-height: 64px; }
.w3b .w3b-bar { position: relative; flex: 1; border-radius: 4px; }
.w3b .w3b-axis__now { color: var(--w3b-fg); }

/* a pilha de cartões */
.w3b .w3b-cards__well { position: relative; display: flex; flex: 1; flex-direction: column; justify-content: flex-end; overflow: hidden; margin: 0 -20px -20px; padding-top: 4px; }
.w3b .w3b-cards__stack { position: relative; }
.w3b .w3b-card { position: absolute; left: 50%; display: block; width: calc(100% - 32px); max-width: 300px; border-radius: 12px; text-align: left; transform-origin: top center; box-shadow: 0 -10px 28px -14px oklch(0 0 0 / 0.75); }
.w3b .w3b-card:focus-visible { outline-offset: 2px; }
.w3b .w3b-card__ratio { position: relative; display: block; width: 100%; padding-top: 63.08%; }
.w3b .w3b-card__fill { position: absolute; inset: 0; display: block; }
.w3b .w3b-face { position: absolute; inset: 0; overflow: hidden; border-radius: 12px; box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.5), inset 0 0 0 1px oklch(1 0 0 / 0.16); }
.w3b .w3b-holo { position: absolute; inset: 0; background-image: linear-gradient(115deg, transparent 18%, oklch(0.9 0.12 350 / 0.55) 32%, oklch(0.92 0.1 220 / 0.55) 42%, oklch(0.94 0.14 130 / 0.5) 52%, oklch(0.92 0.12 60 / 0.45) 62%, transparent 78%); background-size: 260% 100%; mix-blend-mode: soft-light; transition: background-position 700ms ${EASE}; }
.w3b .w3b-face__top { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 16px 0; }
.w3b .w3b-face__name { display: flex; align-items: center; gap: 10px; min-width: 0; }
.w3b .w3b-face__name > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 700; letter-spacing: -.025em; }
.w3b .w3b-face__last4 { flex-shrink: 0; font: 600 12px/1.5 ${MONO}; font-variant-numeric: tabular-nums; }
.w3b .w3b-face__nfc { position: absolute; right: 16px; bottom: 14px; opacity: .7; }
.w3b .w3b-cards__spacer { visibility: hidden; flex-shrink: 0; width: calc(100% - 32px); max-width: 300px; margin-inline: auto; }
.w3b .w3b-cards__spacer > div { padding-top: 30%; }
.w3b .w3b-cards__panel { position: relative; z-index: 10; display: flex; flex-shrink: 0; align-items: flex-end; justify-content: space-between; gap: 12px; height: 88px; padding: 0 20px 16px; background: color-mix(in oklch, var(--w3b-card) 72%, transparent); -webkit-backdrop-filter: blur(18px) saturate(1.3); backdrop-filter: blur(18px) saturate(1.3); border-top: 1px solid color-mix(in oklch, var(--w3b-fg) 10%, transparent); }
.w3b .w3b-cards__info { min-width: 0; }
.w3b .w3b-cards__number, .w3b .w3b-cards__holder { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.w3b .w3b-cards__number { font: 600 15px/1.5 ${MONO}; letter-spacing: .08em; font-variant-numeric: tabular-nums; }
.w3b .w3b-cards__holder { margin-top: 4px; font-size: 11px; color: var(--w3b-muted-fg); }
.w3b .w3b-cards__balance { flex-shrink: 0; font: 600 15px/1.5 ${MONO}; font-variant-numeric: tabular-nums; }

/* gas */
.w3b .w3b-gas__body { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; }
.w3b .w3b-gas__value { margin: 8px 0 4px; font: 600 26px/1 ${MONO}; font-variant-numeric: tabular-nums; }
.w3b .w3b-gas__value span { font-size: 14px; color: var(--w3b-muted-fg); }
.w3b .w3b-gas__speed { display: flex; justify-content: center; margin-top: 16px; }

/* a carteira contra o ETH */
.w3b .w3b-chart__legend { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 8px 32px; }
.w3b .w3b-key { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--w3b-muted-fg); }
.w3b .w3b-key + .w3b-figure { margin-top: 4px; }
.w3b .w3b-key__line { width: 16px; height: 3px; border-radius: 9999px; }
.w3b .w3b-key__dash { width: 16px; height: 0; border-top: 2px dashed var(--w3b-muted-fg); }
.w3b .w3b-chart__lead { margin-left: auto; border-radius: 9999px; padding: 4px 10px; font: 600 11px/1.5 ${MONO}; font-variant-numeric: tabular-nums; }
.w3b .w3b-chart__plot { position: relative; flex: 1; min-height: 220px; margin-top: 16px; touch-action: pan-y; }
.w3b .w3b-chart__plot svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.w3b .w3b-chart__cross { pointer-events: none; position: absolute; top: 0; bottom: 0; width: 1px; transform: translateX(-50%); background: var(--w3b-border); }
.w3b .w3b-chart__dot, .w3b .w3b-chart__dot2 { pointer-events: none; position: absolute; transform: translate(-50%, -50%); border-radius: 9999px; border-style: solid; border-color: var(--w3b-card); }
.w3b .w3b-chart__dot { width: 14px; height: 14px; border-width: 3px; }
.w3b .w3b-chart__dot2 { width: 10px; height: 10px; border-width: 2px; background: var(--w3b-muted-fg); }
.w3b .w3b-chart__axis { margin-top: 12px; }

/* alocação */
.w3b .w3b-alloc__bar { display: flex; gap: 4px; height: 36px; margin-top: 16px; }
.w3b .w3b-alloc__bar span { border-radius: 8px; }
.w3b .w3b-alloc__list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; margin-top: 16px; }
.w3b .w3b-alloc__list li { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; }
.w3b .w3b-alloc__name { display: flex; align-items: center; gap: 8px; }
.w3b .w3b-alloc__name i { width: 8px; height: 8px; }
.w3b .w3b-alloc__pct { font-family: ${MONO}; font-variant-numeric: tabular-nums; color: var(--w3b-muted-fg); }

/* staking */
.w3b .w3b-stake { position: relative; display: flex; flex-direction: column; min-width: 0; overflow: hidden; border-radius: 26px; padding: 20px; color: ${STAKE_INK}; }
.w3b .w3b-stake .w3b-mono { font-variant-numeric: tabular-nums; }
.w3b .w3b-stake__head { display: flex; align-items: center; justify-content: space-between; }
.w3b .w3b-stake__head h3 { font-size: 13px; font-weight: 600; opacity: .75; }
.w3b .w3b-stake__badge { display: flex; align-items: center; gap: 6px; border-radius: 9999px; padding: 2px 8px; background: oklch(0.24 0.06 135 / 0.12); font: 600 11px/1.5 ${MONO}; }
.w3b .w3b-stake__badge i { width: 6px; height: 6px; background: ${STAKE_INK}; }
.w3b .w3b-stake__apy { margin-top: 20px; font: 600 52px/1 ${MONO}; letter-spacing: -.05em; font-variant-numeric: tabular-nums; }
.w3b .w3b-stake__apy span { font-size: 22px; }
.w3b .w3b-stake__on { margin-top: 4px; font-size: 12px; font-weight: 500; opacity: .7; }
.w3b .w3b-stake__payout { margin-top: 20px; border-radius: 16px; padding: 12px; background: oklch(0.24 0.06 135 / 0.1); }
.w3b .w3b-stake__row { display: flex; align-items: baseline; justify-content: space-between; font-size: 12px; font-weight: 600; }
.w3b .w3b-dim { opacity: .7; }
.w3b .w3b-stake__track { height: 6px; margin-top: 8px; overflow: hidden; border-radius: 9999px; background: oklch(0.24 0.06 135 / 0.14); }
.w3b .w3b-stake__track div { height: 100%; border-radius: 9999px; background: ${STAKE_INK}; transition: width 1s linear; }
.w3b .w3b-stake__facts { margin-top: 12px; font-size: 12px; }
.w3b .w3b-stake__facts div { display: flex; justify-content: space-between; }
.w3b .w3b-stake__facts div + div { margin-top: 6px; }
.w3b .w3b-stake__facts dt { opacity: .7; }
.w3b .w3b-stake__facts dd { font-family: ${MONO}; font-weight: 600; font-variant-numeric: tabular-nums; }
.w3b .w3b-stake__foot { margin-top: auto; padding-top: 24px; }
.w3b .w3b-stake__label { font-size: 12px; font-weight: 600; opacity: .7; }
.w3b .w3b-stake__rewards { margin-top: 4px; font: 600 20px/1.5 ${MONO}; font-variant-numeric: tabular-nums; }
.w3b .w3b-stake__rewards span { font-size: 13px; }
.w3b .w3b-stake__usd { font: 12px/1.5 ${MONO}; font-variant-numeric: tabular-nums; opacity: .7; }
.w3b .w3b-stake__epochs { display: flex; align-items: flex-end; gap: 4px; height: 48px; margin-top: 20px; }
.w3b .w3b-stake__epochs span { flex: 1; border-radius: 4px; background: ${STAKE_INK}; }
.w3b .w3b-stake__caption { margin-top: 6px; font: 10px/1.5 ${MONO}; opacity: .6; }
.w3b .w3b-stake__claim { width: 100%; margin-top: 16px; border-radius: 16px; padding: 12px 0; background: ${STAKE_INK}; font-size: 14px; font-weight: 600; line-height: 20px; transition: transform .15s; }
.w3b .w3b-stake__claim:active:not(:disabled) { transform: scale(.98); }
.w3b .w3b-stake__claim:disabled { opacity: .6; }
.w3b .w3b-stake__claim:focus-visible { outline-color: ${STAKE_INK}; outline-offset: 2px; }

/* liquidez */
.w3b .w3b-lp__range { position: relative; height: 40px; margin-top: 24px; }
.w3b .w3b-lp__line { position: absolute; left: 0; right: 0; top: 50%; height: 2px; transform: translateY(-50%); border-radius: 9999px; background: var(--w3b-muted); }
.w3b .w3b-lp__band { position: absolute; top: 50%; height: 40px; transform: translateY(-50%); border-radius: 10px; }
.w3b .w3b-lp__price { position: absolute; top: 50%; width: 3px; height: 56px; transform: translate(-50%, -50%); border-radius: 9999px; background: var(--w3b-fg); }
.w3b .w3b-lp__fees { margin-top: auto; padding-top: 16px; font-size: 12px; color: var(--w3b-muted-fg); }
.w3b .w3b-lp__fees b { font-family: ${MONO}; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--w3b-fg); }

/* blocos */
.w3b .w3b-blocks__top { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.w3b .w3b-blocks__bars { display: flex; flex: 1; align-items: flex-end; gap: 3px; min-height: 64px; margin-top: 16px; }
.w3b .w3b-blocks__bars span { flex: 1; border-radius: 3px; transform-origin: bottom; }
.w3b .w3b-pop { animation: w3b-pop 500ms cubic-bezier(.3,1.5,.6,1); }
.w3b .w3b-blocks__stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 16px; border-top: 1px solid var(--w3b-border); padding-top: 12px; }
.w3b .w3b-blocks__stats div { min-width: 0; }
.w3b .w3b-blocks__stats dt { font-size: 11px; color: var(--w3b-muted-fg); }
.w3b .w3b-blocks__stats dd { margin-top: 2px; font: 600 13px/1.5 ${MONO}; font-variant-numeric: tabular-nums; }
@keyframes w3b-pop { 0% { transform: scaleY(0); } 100% { transform: scaleY(1); } }

/* atividade */
.w3b .w3b-activity__list { margin: -4px -8px; }
.w3b .w3b-activity__list li { display: flex; align-items: center; gap: 12px; border-radius: 16px; padding: 8px; }
.w3b .w3b-activity__list li:hover { background: color-mix(in oklch, var(--w3b-muted) 50%, transparent); }
.w3b .w3b-activity__icon { display: grid; flex-shrink: 0; place-items: center; width: 36px; height: 36px; border-radius: 12px; background: var(--w3b-muted); color: var(--w3b-fg); }
.w3b .w3b-activity__text { flex: 1; min-width: 0; }
.w3b .w3b-activity__title, .w3b .w3b-activity__detail { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.w3b .w3b-activity__title { font-size: 13px; font-weight: 500; }
.w3b .w3b-activity__detail { font-size: 11px; color: var(--w3b-muted-fg); }
.w3b .w3b-activity__end { text-align: right; }
.w3b .w3b-activity__amount { font: 500 13px/1.5 ${MONO}; font-variant-numeric: tabular-nums; }
.w3b .w3b-activity__status { display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 2px; font: 600 10px/1.5 ${MONO}; }
.w3b .w3b-spin { animation: w3b-spin 1s linear infinite; }
@keyframes w3b-spin { to { transform: rotate(360deg); } }
/* sem movimento: tudo aparece pronto (as transições das barras, da alocação e da atividade estão no style de cada uma) */
@media (prefers-reduced-motion: reduce) {
  .w3b, .w3b * { transition: none !important; animation: none !important; }
}
`
```
