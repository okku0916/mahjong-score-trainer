import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createQuestion, tileSrc, type Mode, type Question } from '../features/questions'
import styles from './PracticePage.module.css'
const names={fu:'符計算',han:'翻数計算',score:'点数計算'}
export function PracticePage(){
  const raw=useParams().mode; const mode=(raw==='fu'||raw==='han'||raw==='score'?raw:null) as Mode|null
  const [q,setQ]=useState<Question|null>(null); const [selected,setSelected]=useState<string|null>(null)
  useEffect(()=>{if(mode){setQ(createQuestion(mode));setSelected(null)}},[mode])
  if(!mode)return <main className={styles.center}><h1>ページが見つかりません</h1><Link to="/">ホームへ</Link></main>
  if(!q)return <main className={styles.center}>問題を作っています…</main>
  const answered=selected!==null, correct=selected===q.answer
  const next=()=>{setQ(createQuestion(mode));setSelected(null);window.scrollTo({top:0,behavior:'smooth'})}
  return <main className={styles.page}>
    <header className={styles.header}><Link to="/" className={styles.back}>← ホーム</Link><span>{names[mode]}</span><em>練習問題</em></header>
    <section className={styles.problem}><p className={styles.eyebrow}>QUESTION</p><h1>{q.title}</h1><div className={styles.facts}>{q.facts.map(x=><span key={x}>{x}</span>)}</div>
      {q.tiles&&<div className={styles.hand} aria-label="手牌">{q.tiles.map((t,i)=><img key={`${t}-${i}`} src={tileSrc(t)} alt={t}/>) }<div className={styles.win}><small>和了牌</small><img src={tileSrc(q.winTile!)} alt={q.winTile}/></div></div>}
    </section>
    <section className={styles.answers}><h2>答えを選んでください</h2><div className={styles.choices}>{q.choices.map(c=>{const state=answered?(c===q.answer?'correct':c===selected?'wrong':'muted'):'';return <button key={c} disabled={answered} className={styles[state]} onClick={()=>setSelected(c)}>{c}{answered&&c===q.answer&&<span>✓</span>}{answered&&c===selected&&c!==q.answer&&<span>×</span>}</button>})}</div></section>
    {answered&&<section className={`${styles.result} ${correct?styles.ok:styles.ng}`} aria-live="polite"><div className={styles.verdict}><span>{correct?'✓':'×'}</span><div><small>{correct?'正解です！':'おしい！'}</small><h2>正解は {q.answer}</h2></div></div><div className={styles.explanation}><h3>計算の内訳</h3>{q.explanation.map((x,i)=><p key={x}><b>{i+1}</b>{x}</p>)}</div><button className={styles.next} onClick={next}>次の問題へ <span>→</span></button></section>}
  </main>
}
