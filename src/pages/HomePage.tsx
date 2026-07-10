import { Link } from 'react-router-dom'
import styles from './HomePage.module.css'
const modes=[['fu','符計算','符の積み上げを身につける','符'],['han','翻数計算','役とドラから翻数を数える','翻'],['score','点数計算','符・翻から支払いを導く','点']] as const
export function HomePage(){return <main className={styles.page}>
  <header className={styles.hero}><p className={styles.kicker}>MAHJONG PRACTICE</p><h1>麻雀 点数計算練習</h1><p>符・翻・点数。覚えるだけでは難しい計算を、<br/>一問ずつ手を動かして身につけよう。</p></header>
  <section className={styles.grid} aria-label="練習モード">{modes.map(([path,name,desc,mark],i)=><Link key={path} to={`/practice/${path}`} className={styles.card}><span className={styles.number}>0{i+1}</span><span className={styles.mark}>{mark}</span><span><strong>{name}</strong><small>{desc}</small></span><b aria-hidden>→</b></Link>)}</section>
  <aside className={styles.tip}><span>今日のひとこと</span><p>点数計算は、まず「満貫になる境目」から覚えるとぐっと楽になります。</p></aside>
  <footer>牌画像: <a href="https://majandofu.com/mahjong-images" target="_blank" rel="noreferrer">麻雀豆腐</a></footer>
  </main>}
