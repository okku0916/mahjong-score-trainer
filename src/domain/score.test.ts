import { describe, expect, it } from 'vitest'
import { calculateScore } from './score'
describe('calculateScore', () => {
  it('子30符4翻ロンは7700点', () => expect(calculateScore({ dealer:false, winMethod:'ron', fu:30, han:4 }).payment.ron).toBe(7700))
  it('親60符3翻ロンは11600点', () => expect(calculateScore({ dealer:true, winMethod:'ron', fu:60, han:3 }).payment.ron).toBe(11600))
  it('数え役満は1倍で打ち止め', () => expect(calculateScore({ dealer:false, winMethod:'ron', fu:30, han:26 }).payment.ron).toBe(32000))
  it('2倍役満の子ツモ', () => expect(calculateScore({ dealer:false, winMethod:'tsumo', yakumanMultiplier:2 }).payment).toEqual({dealerPays:32000, nonDealerPays:16000}))
})
