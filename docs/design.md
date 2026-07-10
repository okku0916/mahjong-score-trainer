# 麻雀点数計算練習アプリ 基本設計書

## 1. 文書情報

- プロジェクト名: mahjong-score-trainer
- 対象: MVP
- 最終更新日: 2026-07-10
- 関連文書: [要件定義書](./requirements.md)

## 2. 設計方針

- スマートフォンの縦画面を基準とする。
- ホームでは3モードの選択以外を求めない。
- 問題画面では「問題を読む、回答する、解説を確認する、次へ進む」を1画面内で完結させる。
- 麻雀の判定・計算ロジックはUIから分離する。
- 問題生成結果は、採点に必要な正解と解説を含む不変データとして扱う。
- MVPではデータを永続化しないが、将来の成績保存に対応できる回答記録を生成する。

## 3. 画面・ルーティング

| パス | 画面 | 用途 |
| --- | --- | --- |
| `/` | ホーム | 3モードから選択する |
| `/practice/fu` | 符計算 | 手牌から符を回答する |
| `/practice/han` | 翻数計算 | 手牌から合計翻数を回答する |
| `/practice/score` | 点数計算 | 条件から最終点数を回答する |
| `*` | Not Found | ホームへ戻す |

ブラウザの戻る操作でもホームへ戻れるようにする。問題内容はURLへ含めず、画面表示時に生成する。

## 4. 画面設計

### 4.1 ホーム画面

#### 表示要素

- アプリ名
- 短い説明
- 「符計算」ボタン
- 「翻数計算」ボタン
- 「点数計算」ボタン
- 牌画像素材のクレジット

#### 操作

- モードボタンを押すと、対応する問題画面へ移動する。
- 設定画面や確認ダイアログは表示しない。

#### スマートフォン概略

```text
┌────────────────────┐
│ 麻雀 点数計算練習    │
│ 符・翻・点数を反復練習 │
│                    │
│ ┌────────────────┐ │
│ │     符計算      │ │
│ └────────────────┘ │
│ ┌────────────────┐ │
│ │    翻数計算     │ │
│ └────────────────┘ │
│ ┌────────────────┐ │
│ │    点数計算     │ │
│ └────────────────┘ │
│                    │
│ 牌画像: 麻雀豆腐     │
└────────────────────┘
```

### 4.2 共通問題画面

#### 表示要素

- ホームへ戻るボタン
- モード名
- 問題領域
- 回答選択肢
- 採点結果・解説領域
- 「次の問題」ボタン

#### 画面状態

| 状態 | 内容 |
| --- | --- |
| `generating` | 問題生成中。ローディングを表示し、回答を無効化する |
| `answering` | 問題と回答選択肢を表示する |
| `answered` | 回答を固定し、正誤・正解・解説・次ボタンを表示する |
| `error` | 生成に失敗。再試行ボタンとホームボタンを表示する |

#### 回答動作

- 選択肢を1回押した時点で回答を確定する。
- 確認ダイアログは表示しない。
- 回答確定後は全選択肢を無効化する。
- 選んだ回答、正解、不正解を色だけでなくアイコンと文言でも区別する。
- 「次の問題」は採点後にだけ表示する。

### 4.3 符計算画面

#### 問題表示

- 場風、自風
- 親・子
- ロン・ツモ
- 門前・副露
- 手牌
- 副露面子
- 和了牌
- 符計算に必要な状況ラベル

和了牌は手牌本体との間隔、枠線またはラベルで明示する。副露面子は手牌と分離し、鳴いた牌を横向きで表示する。

#### 回答

`20 / 25 / 30 / 40 / 50 / 60 / 70 / 80 / 90 / 100 / 110符`

#### 解説

- 基本符
- 門前ロン・ツモによる符
- 雀頭の符
- 各面子の符
- 待ちの符
- 合計
- 10符単位への切り上げ
- 七対子などの固定符

### 4.4 翻数計算画面

#### 問題表示

- 場風、自風
- 親・子
- ロン・ツモ
- 門前・副露
- 手牌
- 副露面子
- 和了牌
- ドラ表示牌
- 一発、海底などの状況ラベル

裏ドラを数える問題では裏ドラ表示牌も表示する。リーチしていない問題には裏ドラを適用しない。

#### 回答

- `1翻`から`13翻`
- `役満`
- `2倍役満`
- `3倍役満以上`

3倍以上の場合は、問題に合わせて正解となる倍数の選択肢を動的に追加する。

#### 解説

- 成立役と各翻数
- ドラ、裏ドラ、赤ドラの枚数
- 合計翻数
- 役満の場合は成立役満と合計倍数

### 4.5 点数計算画面

#### 問題表示

- 親・子
- ロン・ツモ
- 符
- 翻または役満倍数

手牌、役名、ドラは表示しない。

#### 回答

- ロン: 受取点数を選ぶ。
- 子のツモ: 「親の支払い / 子の支払い」の組み合わせを選ぶ。
- 親のツモ: 「各子の支払い（オール）」を選ぶ。

選択肢は正解1件と妥当な誤答3件を基本とし、重複を除去する。候補不足時は3件未満でもよい。

#### 解説

- 基本点
- 満貫以上の場合は点数区分
- 親・子、ロン・ツモによる倍率
- 100点単位への切り上げ
- 最終的な受取点または支払点

## 5. レスポンシブ設計

- 最小対応幅は320pxを目安とする。
- コンテンツ幅は最大720px程度とし、PCでは中央配置する。
- 牌は1列表示を基本とし、画面幅に応じて縮小する。
- 手牌の判読性を優先し、牌画像同士を重ねない。
- 選択肢はスマートフォンでは2列、狭い場合は1列とする。
- タップ領域は原則44px以上とする。
- 横スクロールが必要な場合は、手牌領域だけに限定する。

## 6. アクセシビリティ

- すべての操作をキーボードで実行可能にする。
- フォーカス位置を視覚的に表示する。
- 牌画像に「一萬」「白」などの代替テキストを設定する。
- 正誤を色だけで表現しない。
- 採点結果を `aria-live` で通知する。
- 十分な文字サイズとコントラストを確保する。
- アニメーションは必要最小限とする。

## 7. ドメインモデル

### 7.1 牌

```ts
type Suit = 'man' | 'pin' | 'sou';
type Wind = 'east' | 'south' | 'west' | 'north';
type Dragon = 'white' | 'green' | 'red';

type Tile =
  | {
      kind: 'number';
      suit: Suit;
      rank: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
      red: boolean;
    }
  | {
      kind: 'wind';
      wind: Wind;
    }
  | {
      kind: 'dragon';
      dragon: Dragon;
    };
```

同じ種類の牌を区別する必要がある場合に備え、問題内では別途インスタンスIDを付与する。

### 7.2 面子

```ts
type MeldType = 'sequence' | 'triplet' | 'quad';
type CallType = 'closed' | 'chi' | 'pon' | 'open-kan' | 'closed-kan' | 'added-kan';

interface Meld {
  id: string;
  type: MeldType;
  callType: CallType;
  tiles: Tile[];
  calledTileIndex?: number;
}
```

### 7.3 局面

```ts
type WinMethod = 'ron' | 'tsumo';

interface RoundContext {
  roundWind: Wind;
  seatWind: Wind;
  winMethod: WinMethod;
  riichi: boolean;
  doubleRiichi: boolean;
  ippatsu: boolean;
  haitei: boolean;
  houtei: boolean;
  rinshan: boolean;
  chankan: boolean;
  tenhou: boolean;
  chiihou: boolean;
  doraIndicators: Tile[];
  uraDoraIndicators: Tile[];
}
```

相互排他的な状況は、生成時および検証時に制約を確認する。

### 7.4 和了手

```ts
interface WinningHand {
  concealedTiles: Tile[];
  melds: Meld[];
  winningTile: Tile;
  context: RoundContext;
}
```

`concealedTiles` は和了牌を除いた手牌として保持し、表示時に和了牌を明確に分離できるようにする。

### 7.5 計算結果

```ts
interface YakuResult {
  id: string;
  name: string;
  han: number;
  yakumanMultiplier: number;
}

interface FuItem {
  label: string;
  fu: number;
}

interface FuResult {
  rawFu: number;
  roundedFu: number;
  items: FuItem[];
}

interface ScorePayment {
  ron?: number;
  dealerPays?: number;
  nonDealerPays?: number;
  eachPlayerPays?: number;
}

interface CalculationResult {
  yaku: YakuResult[];
  han: number;
  yakumanMultiplier: number;
  fu?: FuResult;
  limitName?: string;
  payment: ScorePayment;
}
```

役満では通常役の翻数と符を点数計算に使用しない。

## 8. 問題モデル

```ts
type PracticeMode = 'fu' | 'han' | 'score';

interface AnswerChoice<T> {
  id: string;
  label: string;
  value: T;
}

interface PracticeQuestion<TAnswer> {
  id: string;
  mode: PracticeMode;
  prompt: string;
  hand?: WinningHand;
  scoreCondition?: {
    dealer: boolean;
    winMethod: WinMethod;
    fu?: number;
    han?: number;
    yakumanMultiplier?: number;
  };
  choices: AnswerChoice<TAnswer>[];
  correctAnswer: TAnswer;
  explanation: Explanation;
  tags: string[];
  source: 'generated' | 'fallback';
}

interface Explanation {
  summary: string;
  yakuItems?: YakuResult[];
  fuItems?: FuItem[];
  calculationSteps: string[];
}
```

`correctAnswer` は画面表示から再計算せず、検証済みの問題生成結果として保持する。回答値の比較には表示ラベルではなく、正規化した数値または構造体を使用する。

## 9. 回答記録

```ts
interface AnswerRecord {
  id: string;
  questionId: string;
  mode: PracticeMode;
  selectedAnswer: unknown;
  correctAnswer: unknown;
  correct: boolean;
  tags: string[];
  answeredAt: string;
}
```

MVPでは回答中のメモリにだけ保持する。将来はこの構造をIndexedDBまたはAPIへ保存する。

## 10. 問題生成設計

### 10.1 共通フロー

1. モードに応じた出題条件を抽選する。
2. 条件を満たす候補を生成する。
3. 独立した計算処理で役、符、翻、点数を算出する。
4. モード要件と一致するか検証する。
5. 正解と誤答選択肢、解説を構築する。
6. 最大100回失敗した場合は固定問題を返す。

### 10.2 符計算

待ち、雀頭、面子構成、門前・副露、ロン・ツモなどの符要素を先に抽選し、成立する和了手を生成する。役満は除外する。

### 10.3 翻数計算

対象役と局面条件を抽選し、指定役を含む和了手を生成する。生成後に意図しない複合役、ドラ、役満を含めて合計を再計算する。

### 10.4 点数計算

親・子、ロン・ツモ、符、翻または役満倍数を抽選する。手牌は生成しない。存在しない組み合わせや、点数区分上意味のない符を除外する。

## 11. モジュール構成

```text
src/
├── app/
│   ├── App.tsx
│   └── router.tsx
├── components/
│   ├── AnswerChoices/
│   ├── Explanation/
│   ├── HandView/
│   ├── MeldView/
│   ├── ResultPanel/
│   └── TileImage/
├── domain/
│   ├── tile/
│   ├── hand/
│   ├── yaku/
│   ├── fu/
│   ├── score/
│   └── rules/
├── features/
│   ├── home/
│   └── practice/
│       ├── generators/
│       ├── fallback/
│       └── usePracticeQuestion.ts
├── pages/
│   ├── HomePage.tsx
│   └── PracticePage.tsx
├── assets/
├── styles/
└── test/

public/
└── tiles/
```

## 12. エラー処理

- 問題生成中に例外が発生しても再試行回数へ含める。
- 最大100回の失敗後はモード別の固定問題を使用する。
- 固定問題は起動時またはテスト時に正解を検証する。
- 固定問題も取得できない場合だけ、利用者へ再試行可能なエラーを表示する。
- 内部の例外内容やスタックトレースは画面へ表示しない。

## 13. テスト方針

### 単体テスト

- 役判定
- 符の各加算条件と切り上げ
- 親・子、ロン・ツモの点数
- 満貫以上の点数
- 切り上げ満貫を適用しない境界
- 数え役満と複数倍役満
- ドラ、裏ドラ、赤ドラ
- 問題生成の制約

### コンポーネントテスト

- 問題と局面情報の表示
- 回答確定後の選択肢ロック
- 正誤表示
- 解説表示
- 次の問題への遷移

### E2Eテスト

- ホームから各モードを開始できる。
- 回答後に正誤と解説が表示される。
- 次の問題へ進める。
- ホームへ戻れる。
- 生成失敗時に固定問題へ切り替わる。

## 14. 受け入れ基準

- 320px幅の画面で主要操作ができ、ページ全体に不要な横スクロールが発生しない。
- ホームから各モードを1回の操作で開始できる。
- 各問題で回答を1回だけ確定できる。
- 回答後に正解と根拠を確認できる。
- 「次の問題」で同じモードの新しい問題を表示できる。
- 採用ルールに基づく固定テストがすべて成功する。
- 問題生成に失敗しても画面が操作不能にならない。
- 牌画像の出典リンクがホーム画面に表示される。

## 15. 次工程

1. Vite、React、TypeScriptの初期構築
2. 牌画像を `public/tiles` へ配置
3. ドメイン型と牌ユーティリティの実装
4. 点数計算エンジンと固定テスト
5. 符計算・役判定エンジン
6. 固定問題による各画面の実装
7. 条件付きランダム問題生成
8. レスポンシブ表示とE2Eテスト
