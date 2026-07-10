import { calculateScore, paymentLabel, type ScoreCondition } from '../domain/score'
export type Mode = 'fu' | 'han' | 'score'
export interface Question { id:string; mode:Mode; title:string; facts:string[]; tiles?:string[]; winTile?:string; choices:string[]; answer:string; explanation:string[]; tags:string[] }
const pick = <T,>(xs:T[]) => xs[Math.floor(Math.random()*xs.length)]
const shuffle = <T,>(xs:T[]) => [...xs].sort(() => Math.random()-.5)
const hands = [
  { tiles:['man2','man3','man4','pin3','pin4','pin5','sou6','sou7','sou8','ji5','ji5','man7','man8'], win:'man9' },
  { tiles:['pin2','pin3','pin4','sou2','sou3','sou4','man6','man7','man8','ji6','ji6','pin6','pin7'], win:'pin8' },
  { tiles:['man1','man1','man1','pin4','pin5','pin6','sou7','sou8','sou9','ji1','ji1','sou2','sou2'], win:'sou2' },
]
export const tileSrc = (id:string) => `/tiles/${id}-66-90-l.png`

function fuQuestion(): Question {
  const h = pick(hands)
  const closedRon = h === hands[0]
  const answer = closedRon ? '30符' : h === hands[1] ? '20符' : '40符'
  const explanation = closedRon
    ? ['基本符 20符', '門前ロン 10符', '合計30符']
    : h === hands[1] ? ['平和ツモは固定20符'] : ['基本符 20符', '么九牌の暗刻 8符', '単騎待ち 2符', '合計30符 → 40符に切り上げ']
  return { id:crypto.randomUUID(), mode:'fu', title:'この和了は何符？', facts:[closedRon?'子・ロン':'子・ツモ','門前','場風 東・自風 南'], tiles:h.tiles, winTile:h.win, choices:['20符','25符','30符','40符','50符','60符','70符','80符','90符','100符','110符'], answer, explanation, tags:['符計算'] }
}
function hanQuestion(): Question {
  const h=pick(hands.slice(0,2)); const first=h===hands[0]
  return { id:crypto.randomUUID(), mode:'han', title:'合計で何翻？', facts:first?['子・ロン','門前・リーチ','ドラ表示牌：三萬']:['子・ツモ','門前','場風 東・自風 南'], tiles:h.tiles, winTile:h.win, choices:['1翻','2翻','3翻','4翻','5翻','6翻','役満'], answer:first?'2翻':'2翻', explanation:first?['リーチ 1翻','一盃口 1翻','合計 2翻']:['門前清自摸和 1翻','平和 1翻','合計 2翻'], tags:['翻数計算'] }
}
function scoreQuestion(): Question {
  const c:ScoreCondition=pick([
    {dealer:false,winMethod:'ron',fu:30,han:4},{dealer:true,winMethod:'ron',fu:60,han:3},
    {dealer:false,winMethod:'tsumo',fu:40,han:3},{dealer:true,winMethod:'tsumo',fu:30,han:4},
    {dealer:false,winMethod:'ron',fu:30,han:5},{dealer:false,winMethod:'tsumo',yakumanMultiplier:2},
  ] as ScoreCondition[])
  const r=calculateScore(c), answer=paymentLabel(r.payment)
  const distractors = c.winMethod==='ron' ? ['3,900点','7,700点','8,000点','11,600点','12,000点','16,000点','32,000点','64,000点'] : ['1,000点オール','2,000点オール','3,900点オール','4,000点オール','親 3,900点 / 子 2,000点','親 32,000点 / 子 16,000点']
  const facts=[c.dealer?'親':'子',c.winMethod==='ron'?'ロン':'ツモ',c.yakumanMultiplier?`${c.yakumanMultiplier}倍役満`:`${c.fu}符 ${c.han}翻`]
  return {id:crypto.randomUUID(),mode:'score',title:c.winMethod==='ron'?'受取点数は？':'各プレイヤーの支払いは？',facts,choices:shuffle([answer,...shuffle(distractors.filter(x=>x!==answer)).slice(0,3)]),answer,explanation:[`基本点：${r.basicPoints.toLocaleString()}点`,r.limitName?`点数区分：${r.limitName}`:'基本点に親・子と和了方法の倍率を適用',`100点単位に切り上げ：${answer}`],tags:['点数計算']}
}
export const createQuestion=(mode:Mode):Question => mode==='fu'?fuQuestion():mode==='han'?hanQuestion():scoreQuestion()
