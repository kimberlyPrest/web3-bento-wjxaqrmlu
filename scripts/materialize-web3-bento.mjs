import { readFileSync, writeFileSync } from 'node:fs'

const source = readFileSync('src/assets/item-1-a0adf.md', 'utf8')
const content = source.replace(/^```tsx\r?\n/, '').replace(/\r?\n```\s*$/, '')
writeFileSync('src/components/ui/web3-bento.tsx', content)
