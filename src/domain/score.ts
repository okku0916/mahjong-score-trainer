export type WinMethod = 'ron' | 'tsumo'
export interface ScoreCondition { dealer: boolean; winMethod: WinMethod; fu?: number; han?: number; yakumanMultiplier?: number }
export interface Payment { ron?: number; dealerPays?: number; nonDealerPays?: number; eachPlayerPays?: number }
export interface ScoreResult { basicPoints: number; limitName?: string; payment: Payment }

const ceil100 = (value: number) => Math.ceil(value / 100) * 100

export function calculateScore(c: ScoreCondition): ScoreResult {
  let basicPoints: number
  let limitName: string | undefined
  if (c.yakumanMultiplier) {
    basicPoints = 8000 * c.yakumanMultiplier
    limitName = c.yakumanMultiplier === 1 ? '役満' : `${c.yakumanMultiplier}倍役満`
  } else {
    const han = c.han ?? 1
    const fu = c.fu ?? 30
    const raw = fu * 2 ** (han + 2)
    if (han >= 13) [basicPoints, limitName] = [8000, '数え役満']
    else if (han >= 11) [basicPoints, limitName] = [6000, '三倍満']
    else if (han >= 8) [basicPoints, limitName] = [4000, '倍満']
    else if (han >= 6) [basicPoints, limitName] = [3000, '跳満']
    else if (han >= 5 || raw >= 2000) [basicPoints, limitName] = [2000, '満貫']
    else basicPoints = raw
  }
  const payment: Payment = c.winMethod === 'ron'
    ? { ron: ceil100(basicPoints * (c.dealer ? 6 : 4)) }
    : c.dealer
      ? { eachPlayerPays: ceil100(basicPoints * 2) }
      : { dealerPays: ceil100(basicPoints * 2), nonDealerPays: ceil100(basicPoints) }
  return { basicPoints, limitName, payment }
}

export function paymentLabel(p: Payment): string {
  if (p.ron) return `${p.ron.toLocaleString()}点`
  if (p.eachPlayerPays) return `${p.eachPlayerPays.toLocaleString()}点オール`
  return `親 ${p.dealerPays?.toLocaleString()}点 / 子 ${p.nonDealerPays?.toLocaleString()}点`
}
