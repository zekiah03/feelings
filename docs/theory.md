# 生育環境×感情特性モデル: 理論的基盤と実装方針

**版**: 0.1 (草稿)
**対象**: feelings アプリ (`engine/calculator.ts`, `engine/weights.ts`, `engine/actionRules.ts`, `engine/inverseCalculator.ts`)

---

## 要旨

本ノートは、自己内省支援アプリ feelings が用いる「生育環境スコア → 感情特性プロファイル」変換モデルの理論的基盤を整理し、実装の各パラメータが何を意味し、どの先行研究に依拠し、どこまで信頼できるかを明示することを目的とする。

提案するモデルは、4つの年齢区分 (0-5, 6-10, 11-15, 16-20) における家庭・学校・出来事の3カテゴリの環境スコアを入力とし、9感情×3層 (強度・感度・持続) と4種の表現スタイルを出力する。 因果ルールはアタッチメント理論 (Bowlby, Ainsworth)、養育スタイル研究 (Baumrind, Grolnick)、ACE 研究 (Felitti et al.)、感情制御プロセスモデル (Gross)、早期不適応スキーマ理論 (Young) の交差点に位置付けられる。 行動提案ルールは介入研究 (運動・表出筆記・自己慈悲・予測可能性増強など) を根拠とする。

本モデルは予測モデルではなく**内省的フレームモデル**である。 個別の臨床診断や厳密な因果推論を意図しない。 数値パラメータの「形」(単調性・年齢勾配など) は理論で正当化されるが、絶対値は暫定的であり、ユーザー集団における経験的較正が将来の課題となる。

---

## 1. はじめに

### 1.1 動機

成人後の感情の出方には、幼少期から青年期にかけての養育環境・社会経験が反映されているという臨床的・経験的観察は広く共有されている。 しかし、それを「自分の場合はどう寄与しているか」という形でユーザーが俯瞰できるツールは少ない。 既存のセルフチェック (ACE質問紙、アタッチメントスタイル簡易版など) は単一スコアとカテゴリ分類に終始することが多く、(1)複数感情を独立に扱えない、(2)時期 (発達段階) ごとの寄与を分解できない、(3)介入候補を提示できない、という欠点がある。

本モデルは、入力を細粒度に取り、複数感情・複数時期に分解した上で、説明可能な要因ランキングと、そこから導かれる行動提案までを一気通貫で提供することを目指す。

### 1.2 立ち位置

本モデルは以下の3点で限定的である。これは限界であり同時に設計選択である。

1. **予測モデルではない**: ある入力 E が必ず特定のプロファイル P を生むとは主張しない。出力は「典型的にはこういう傾向が出やすい」という事前分布の中央値の近似と解釈される。
2. **診断ツールではない**: 出力スコアは医学的・心理学的診断の代替にならない。出力は内省の素材であり、専門家の判断を置き換えない。
3. **静的モデルである**: 一人の人が時系列で変化する様子は捉えない。スナップショットを取る道具である。

### 1.3 本ノートのスコープ

第2章で理論基盤を整理する。第3章でモデルを形式的に定義する。第4章と第5章でルールセットを記述し、第6章で逆算ロジックを定式化する。第7章で限界を、第8章で検証戦略を、第9章で拡張方向を述べる。付録A〜Cでコードへの対応・用語・パラメータを一覧する。

---

## 2. 理論的基盤

### 2.1 アタッチメント理論

Bowlby (1969) と Ainsworth ら (1978) は、養育者との早期相互作用から子どもが「内的作業モデル」を形成し、それが成人期の対人感情・ストレス応答に持続的影響を与えると示した。 安定型では他者は信頼でき自己は愛される存在として表象される。 不安型では他者の応答が不安定であり、自己は愛情を確保するために過剰警戒する。 回避型では情緒的接近そのものを抑制する。 恐怖型 (Main & Solomon, 1990) ではこの両者が混在する。

帰結 — **低い愛情量 (affection)** や **低い家庭安定性 (stability)** は、不安型・恐怖型のアタッチメントの形成を介して、成人期の **不安の強度 (fear intensity)** と **不安の感度 (fear sensitivity)** を持続的に押し上げる。 また、養育者の応答性が予測しにくい場合、報酬期待系の発達にも影響し、成人期の **喜びの強度 (joy intensity)** が低くなる傾向 (anhedonic な特徴) が報告される (Davis & Panksepp, 2018)。

### 2.2 養育スタイル: 温かさ × 統制

Baumrind (1971) は養育を「温かさ (responsiveness)」×「統制 (demandingness)」の2軸で記述した。 4類型 (権威的、独裁的、放任的、無関与的) のうち、権威的養育 (温かさ高 × 適切な統制) が子どもの自己制御・社会適応・ウェルビーイングと最も強く関連する。

ここで重要なのは「統制」の質的区別である (Grolnick, 2003; Barber, 1996):

- **行動的統制 (behavioral control)**: 子の行動に対する適切な期待・規範の提示 (例: 門限、宿題)。これは子の自律性の発達に概ね中立か正の影響を持つ。
- **心理的統制 (psychological control)**: 子の感情・思考・自己への侵入。罪悪感誘導、愛情撤回、否認、子のアイデンティティへの干渉などを含む。これが子の内在化問題 (不安・抑うつ・自己批判) を予測する。

帰結 — 本モデルの `family.control` (0=自由、100=支配的) は、**心理的統制を主に意識した尺度** と解釈すべきである。 高い control は **怒りの感度** を上げ (押し殺された反応潜在力)、**感情抑制 (suppression)** を上げ、後述する「服従」「自己犠牲」スキーマと整合する。

### 2.3 ACE 研究と毒性ストレス

Felitti ら (1998) の Adverse Childhood Experiences (ACE) 研究は、虐待・ネグレクト・家庭機能不全の累積が成人期の身体・精神疾患リスクに用量反応的 (dose-response) に効くことを示した。 続く神経科学的研究 (Shonkoff et al., 2012) は、慢性で予測不能なストレス (毒性ストレス) が HPA軸・前頭前野・扁桃体の発達を変調させ、感情調整の基盤を歪めることを記述した。

帰結 — 本モデルの `events.stressEvents` は、ACE 的な大きな出来事の累積 を簡略表現したものと解釈する。 累積負荷は **怒り・悲しみ・無感動** を高める。 無感動 (numbness) はここでは解離・遮断の経験的代理であり、慢性ストレスへの長期的な対処戦略としての感情遮断を含意する (Lanius et al., 2010)。

### 2.4 早期不適応スキーマ

Young (Young et al., 2003) のスキーマ療法は、幼少期の中核的ニーズ (安全な愛着、自律性、現実的な制限、自己表現の自由、自発性と遊び) が満たされなかった場合に形成される 18 個の「早期不適応スキーマ」を整理する。 ここでは特に以下のマッピングが本モデルと整合する:

| 環境要因 | 形成されやすいスキーマ | 表面化する感情 |
|---|---|---|
| 低い愛情量 | 情緒的剥奪、見捨てられ | 不安、悲しみ、恥 |
| 低い家庭安定性 | 不信・虐待、欠陥 | 不安、怒り |
| 高い心理的支配 | 服従、自己犠牲、感情抑制 | 抑制された怒り、罪悪感 |
| 低い所属感 | 社会的孤立、欠陥 | 悲しみ、恥 |

スキーマ理論は本モデルにおける「ルールの組み合わせ的解釈可能性」を支える。

### 2.5 ストレス感受性と差異感受性

Belsky の差異感受性仮説 (Belsky, 1997; Belsky & Pluess, 2009) は、子どもは環境のネガティブにのみ弱いのではなく、環境全体への感受性に個体差があり、感受性の高い子は良い環境からも強く恩恵を受けると主張する (「蘭の花とタンポポ」のメタファー)。

本モデルの限界として記しておく。 我々のモデルは個体差を陽に扱わない (年齢区分ごとの集団平均的な係数で動かす)。 同じ環境を経験しても感受性の高い人ほど影響が大きいというパターンは、現状ではモデル化されていない。 第8章・第9章で拡張余地として再訪する。

### 2.6 感情制御プロセスモデル

Gross (1998, 2015) の感情制御プロセスモデルは、感情生成を5段階 (情況選択 → 情況修正 → 注意配分 → 認知的変化 → 反応調整) に分け、各段階で介入可能な点を列挙する。 また、感情の「強度」「持続」「立ち上がり」が独立に変動しうることを指摘する (Davidson, 1998)。

帰結 — 本モデルの感情の3層は次のように対応する。

- **強度 (intensity)**: ベース水準。慢性的な気分傾向に近い。情況選択・注意配分の長期的偏りで決まる。
- **感度 (sensitivity)**: 発火閾値。同じ刺激でも反応するかどうかの閾値。扁桃体の準備状態、不確実性に対する priors と関連。
- **持続 (duration)**: 反応後の収まりにくさ。反応調整・回復関数の傾き。反芻 (Nolen-Hoeksema, 1991) や前頭前野によるトップダウン制御の強度と関連。

### 2.7 自律神経基盤 (簡略)

Porges (2011) の多重迷走神経理論は、社会的関与・可動化 (闘争逃走)・不動化 (凍結・解離) の3階層構造を仮定する。 慢性ストレスや養育環境の質は、この階層のどこに置かれやすいかを左右する。 本モデルでは個別の生理的指標は扱わないが、**怒り爆発性 (explosiveness)** は可動化系の易反応性、**無感動 (numbness)** は不動化系の優位性、**感情抑制 (suppression)** は社会的関与系を介した表出制御、と緩く対応すると解釈できる。

### 2.8 採用する4本の柱

第3章以降のモデル設計は、以下の4本に依拠する:

1. **アタッチメントの内的作業モデル**: 0-5歳の家庭環境が成人期感情の基底を形成する
2. **養育スタイル (温かさ×心理的統制)**: 統制の質的区別を行う
3. **累積ストレス (ACE 系)**: 出来事数の用量反応的影響
4. **感情制御の3層 (Gross + Davidson)**: 強度・感度・持続を独立に推定する

これら以外 (差異感受性、自律神経階層、スキーマ理論) は補助的な解釈枠として用い、明示的にはモデルに組み込まない。

---

## 3. モデル定式化

### 3.1 表記

| 記号 | 意味 |
|---|---|
| $B = \{0\text{-}5, 6\text{-}10, 11\text{-}15, 16\text{-}20\}$ | 年齢区分集合 |
| $E_b$ | 区分 $b$ における環境ベクトル |
| $E$ | 全区分の環境 $\{E_b\}_{b \in B}$ |
| $P_e$ | 感情 $e$ の3層スコア (intensity, sensitivity, duration) |
| $S$ | 表現スタイルベクトル |
| $\alpha_b$ | 区分 $b$ の感受性係数 |
| $R_1$ | 環境→感情の因果ルールセット (第4章) |
| $R_2$ | 感情→行動提案のルールセット (第5章) |

### 3.2 環境変数 $E$

各年齢区分 $b \in B$ における環境ベクトルは:

$$E_b = (F_b, S_b, V_b)$$

家庭部分:
$$F_b = (a_b, s_b, c_b) \in [0,100]^3$$
- $a_b$: 愛情量 (温かさ・応答性)
- $s_b$: 安定性 (生活基盤・関係性の予測可能性)
- $c_b$: 支配度 (心理的統制、0=自由、100=過干渉)

学校部分:
$$S_b = (\beta_b, \tau_b, \xi_b) \in [0,100]^3$$
- $\beta_b$: 所属感 (受容感、居場所)
- $\tau_b$: ストレス (慢性的な要求過多)
- $\xi_b$: 社会的成功体験 (達成・承認の経験密度)

出来事部分:
$$V_b = (n_b^-, n_b^+) \in \mathbb{N}^2$$
- $n_b^-$: 強いストレス出来事の累積 (ACE 的)
- $n_b^+$: 強い成功体験の累積

### 3.3 感情プロファイル $P$

採用する感情集合:

$$\mathcal{E} = \mathcal{E}_{core} \cup \mathcal{E}_{ext}$$

- コア感情 $\mathcal{E}_{core}$: 怒り、悲しみ、恐怖・不安、喜び、嫌悪、驚き (Ekman, 1992)
- 拡張感情 $\mathcal{E}_{ext}$: 無感動 (numbness)、罪悪感 (guilt)、恥 (shame)

各感情に3層を持たせる:

$$P_e = (\iota_e, \rho_e, \delta_e), \quad \iota_e, \rho_e, \delta_e \in [0,100]$$

- $\iota_e$: 強度 (intensity)
- $\rho_e$: 感度 (sensitivity)
- $\delta_e$: 持続 (duration)

3層を独立にモデル化する根拠は §2.6 に述べた通り、感情制御研究で強度・感度・回復が解離的に変動しうると示されているためである。

**感情選択の根拠**:
- コア6: Ekman の基本感情。神経・表出の証拠が比較的揃う
- 無感動: 抑うつ・解離・PTSD 圏で核となる経験 (Lanius et al., 2010)
- 罪悪感・恥: 自己意識感情 (Lewis, 1995)。罪悪感は行動志向的、恥は自己志向的という質的差異がある。 高い心理的統制下で罪悪感が、低い所属感下で恥が形成されやすい (Tangney & Dearing, 2002)

**選ばなかった感情**: 愛 (love)、誇り (pride)、嫉妬、好奇心 など。これらは複合感情あるいはトリガー条件が文脈依存的でモデル化が困難なため第一版では除外した。

### 3.4 表現スタイル $S$

感情がどのように表に出るか (内的経験ではなく外的振る舞い) を別軸として持つ:

$$S = (h, m, q, \chi)$$

- $h$: ユーモア
- $m$: 共感力
- $q$: 感情抑制
- $\chi$: 感情爆発性

**根拠**: 感情の経験と表出の二重性 (display rules; Ekman & Friesen, 1969) は文化心理学・感情労働研究で広く支持される。 抑制と爆発は感情調整の失敗様式の典型 (Gross & John, 2003) であり、ユーモアと共感は適応的調整の代表である。

### 3.5 年齢区分と感受性係数

各区分に係数 $\alpha_b$ を持たせ、ルール発火による効果に乗じる:

$$\alpha_{0\text{-}5} > \alpha_{6\text{-}10} > \alpha_{11\text{-}15} > \alpha_{16\text{-}20}$$

第一版の暫定値: $\alpha = (1.5, 1.3, 1.1, 1.0)$。

**形 (単調減少) の根拠**:
- アタッチメントの臨界期は 0-2 歳前後にあり、内的作業モデルの可塑性は早期で最も高い (Bowlby, 1969)
- 神経可塑性の experience-expectant 期は早期に集中する (Greenough et al., 1987)
- ACE 研究では年齢が早い体験ほど成人期影響が大きい傾向が報告される (Schalinski et al., 2016)
- 思春期 (11-15) には別のピーク (社会的脳の発達) があるため、単調ではなく緩やかな曲線が真の形に近い可能性があるが、第一版では単調減少で近似する

**絶対値の根拠**: 弱い。 1.5 と 1.0 の比 (1.5倍) は「幼少期は思春期後期の1.5倍効く」というラフな見積もりであり、ACE-IQ や retrospective recall study の効果量とは厳密に対応していない。 これは将来の経験的較正の対象とする (§8.3)。

### 3.6 計算フロー

ベースライン:
$$\iota_e^0 = \rho_e^0 = \delta_e^0 = 30, \quad h^0 = m^0 = q^0 = \chi^0 = 30$$

ルール $r \in R_1$ ごとに、各区分 $b$ で発火強度 $\psi_r(E_b) \in [0,1]$ を計算し、ターゲット $T_r$ (ある感情の特定層、または表現スタイル) に対して:

$$\Delta_r^b = \psi_r(E_b) \cdot \alpha_b \cdot \omega_r$$

ここで $\omega_r \in \mathbb{R}$ はルール固有の効果量 (符号付き)。 全効果を集約し:

$$P_e^{\text{out}} = \text{clip}_{[0,100]}\left( P_e^0 + \sum_{r, b} \Delta_r^b \cdot \mathbb{1}[T_r = (e, \cdot)] \right)$$

**発火強度関数 $\psi_r$**:
- 「X が低いと発火」型: $\psi_r(E_b) = \max(0, (\theta - X_b) / \theta)$ で $\theta$ は閾値 (典型的に50)
- 「X が高いと発火」型: $\psi_r(E_b) = \max(0, (X_b - \theta) / (100 - \theta))$
- 「カウントが多いと発火」型: $\psi_r(E_b) = \min(1, n_b / \kappa)$ で $\kappa$ は満強度件数 (現在 5)

この線形閾値マッピングは、効果が「ある閾値を超えるあたりから現れ、両端で飽和する」という臨床観察と整合する。

**説明可能性**:
各ターゲットへの寄与を $(r, b)$ 単位でログに残し、絶対値降順に上位3件を「主な影響要因」として提示する。 これは Saliency 系の説明と異なり、計算過程をそのまま記録するため誤魔化しがない。

---

## 4. 因果ルール ($R_1$)

### 4.1 ルール形式

各ルールは以下のフィールドを持つ:

```
id, label
trigger: 環境変数の閾値条件 → ψ ∈ [0,1]
effects: [(target, ω)]
理論的根拠: §2 のいずれかの章
```

### 4.2 既存ルール7本の理論的根拠

#### R1.1 low_affection — 愛情量が低い

- trigger: $a_b < 50 \Rightarrow \psi = (50 - a_b)/50$
- effects: $(\text{fear}, \iota, +12)$, $(\text{joy}, \iota, -8)$
- 根拠: §2.1 アタッチメント。 不安型・回避型の形成 → 不安の上昇と報酬感受性の低下。

#### R1.2 low_family_stability — 家庭安定性が低い

- trigger: $s_b < 50 \Rightarrow \psi = (50 - s_b)/50$
- effects: $(\text{fear}, \iota, +10)$, $(\text{anger}, \iota, +6)$
- 根拠: §2.3 慢性的予測不能性 → HPA軸の慢性活性化 → 不安と過敏な怒り。 安定性は経済不安定・親の精神疾患・別離なども含意する。

#### R1.3 high_stress_events — ストレスイベントが多い

- trigger: $\psi = \min(1, n_b^-/5)$
- effects: $(\text{anger}, \iota, +10)$, $(\text{sadness}, \iota, +8)$, $(\text{numbness}, \iota, +5)$
- 根拠: §2.3 ACE の用量反応。 感情の感作 (sensitization) と慢性化、解離的応答 (numbness)。

#### R1.4 high_social_success — 社会的成功体験が高い

- trigger: $\xi_b > 50 \Rightarrow \psi = (\xi_b - 50)/50$
- effects: $(\text{joy}, \iota, +9)$, $(\text{fear}, \iota, -4)$
- 根拠: 自己効力感 (Bandura, 1997)、broaden-and-build (Fredrickson, 2001)、approach motivation の発達。

#### R1.5 economic_instability — 経済的不安定 (= 安定性低)

- trigger: $s_b < 50 \Rightarrow \psi = (50 - s_b)/50$
- effects: $(\text{fear}, \rho, +7)$
- 根拠: §2.6 不確実性に対する prior の上方修正 → 微細刺激への過敏。 R1.2 と独立に効くのは、強度ではなく**感度** (反応閾値) を動かすため。

#### R1.6 low_belonging — 所属感が低い

- trigger: $\beta_b < 50 \Rightarrow \psi = (50 - \beta_b)/50$
- effects: $(\text{sadness}, \iota, +8)$, $(\text{shame}, \iota, +6)$
- 根拠: 社会的疎外と喪失 (Williams, 2007 ostracism)。 恥は「自分の存在自体が受け入れられない」という自己評価形成に強く関わる (Tangney & Dearing, 2002)。

#### R1.7 high_control — 支配度が高い

- trigger: $c_b > 50 \Rightarrow \psi = (c_b - 50)/50$
- effects: $(\text{anger}, \rho, +8)$, $(\text{suppression}, +10)$
- 根拠: §2.2 心理的統制。 表出を罰される経験 → 内在化された抑制 (introjected regulation; Ryan & Deci, 2000)。 怒りそのものは消えず、感度が上がりつつ表出は抑えられる。

### 4.3 改訂候補と新規ルール

#### R1.8 [新規] low_belonging × adolescent_amplifier

思春期 (11-15) と前期成人期 (16-20) では peer 関係性が自己同一性形成の中核となる (Erikson, 1968)。 同じ低 belonging でもこの時期は感情への影響が増幅される。

- trigger (現行と同): $\beta_b < 50$
- 効果倍率: $b \in \{11\text{-}15, 16\text{-}20\}$ では効果に追加で $\times 1.3$
- 影響: 既存 R1.6 の effects に対して、思春期以降だけ拡大

これは年齢係数 $\alpha_b$ が単調減少であることへの「思春期の peer 関係はその例外」という補正である。 実装上は別ルールとして並べる方が解釈可能性が高い。

#### R1.9 [新規] cumulative_success — 成功体験の累積効果

現状 R1.4 は学校での社会的成功 ($\xi$) のみ扱う。 出来事側の $n^+$ (大きな成功体験) は未活用である。

- trigger: $\psi = \min(1, n_b^+/5)$
- effects: $(\text{joy}, \iota, +6)$, $(\text{joy}, \rho, +4)$
- 根拠: 強い成功体験は anchor として機能し、後の喜び感受性のキャリブレーションを動かす (Lyubomirsky et al., 2005 hedonic adaptation の例外条件)。

#### R1.10 [新規] high_psychological_control × guilt

支配度 ($c_b$) は現状 anger/suppression に効くが、心理的統制の中核は罪悪感誘導 (guilt induction) である (Barber, 1996)。

- trigger: $c_b > 50$
- effects: $(\text{guilt}, \iota, +8)$
- 根拠: §2.2 §2.4。 罪悪感を「自己制御の手段」として内面化する。

#### R1.11 [新規] differential_susceptibility_marker (オプション、第2版で)

差異感受性を陽に扱うため、ユーザー入力に「環境への感受性自己評価」(SPS scale, Aron 1997 の簡略版) を追加し、感受性高ユーザーは効果を大きくする (正負両方)。

- 形式: ユーザーごとの倍率 $\sigma \in [0.7, 1.4]$ を全 effect に乗じる
- 注意: モデルの個人化はオーバーフィットを誘うため、極端な倍率は避ける
- 第一版では実装しない (§9 拡張候補)

### 4.4 ルールセット俯瞰

第一版 (R1.1-R1.7) と提案する追加 (R1.8-R1.10) を一覧する。 「効果」列は感情変数とその層を示す:

| ID | トリガー | 効果 | 主根拠 |
|---|---|---|---|
| R1.1 | 愛情量低 (a<50) | 不安強度 +12, 喜び強度 -8 | アタッチメント §2.1 |
| R1.2 | 家庭安定性低 (s<50) | 不安強度 +10, 怒り強度 +6 | 慢性予測不能性 §2.3 |
| R1.3 | ストレスイベント多 (n⁻≥5) | 怒り強度 +10, 悲しみ強度 +8, 無感動強度 +5 | ACE 用量反応 §2.3 |
| R1.4 | 社会的成功体験高 (ξ>50) | 喜び強度 +9, 不安強度 -4 | 自己効力 §4.2 |
| R1.5 | 経済的不安定 (s<50) | 不安感度 +7 | 不確実性 prior §2.6 |
| R1.6 | 所属感低 (β<50) | 悲しみ強度 +8, 恥強度 +6 | 社会的疎外・自己意識感情 §2.4 |
| R1.7 | 支配度高 (c>50) | 怒り感度 +8, 抑制 +10 | 心理的統制 §2.2 |
| R1.8★ | 所属感低 × 思春期以降 | R1.6 効果 ×1.3 | アイデンティティ形成期 |
| R1.9★ | 成功体験多 (n⁺≥5) | 喜び強度 +6, 喜び感度 +4 | hedonic anchor §4.3 |
| R1.10★ | 支配度高 (c>50) | 罪悪感強度 +8 | 罪悪感誘導 §2.2 |

★ = 第二版で追加検討。

**感情カバレッジの非対称性**: 喜び・無感動・恥・罪悪感を上げる経路は1〜2本ずつなのに対し、不安・怒り・悲しみを上げる経路は3〜4本ある。 これは現実の発達でネガティブ感情への寄与経路が多様という観察と整合するが、同時に「ポジティブ側の解像度が低い」モデル限界でもある。 R1.9 の追加はこの非対称を緩和する。

**層カバレッジ**: 強度 (intensity) を動かすルールが大半で、感度 (sensitivity) は3本 (R1.5, R1.7, R1.9 の喜び側)、持続 (duration) を直接動かすルールは無い。 持続は本来反芻傾向や前頭前野機能と関連するが、現状は他層からの間接効果のみ。 第二版では持続を直接動かすルール (例: 「家庭での感情応答が一貫しない」→ 悲しみ持続↑) を追加検討する。

---

## 5. 行動提案ルール ($R_2$)

### 5.1 ルール形式

```
id, category, text
trigger: 感情プロファイル P 上の閾値条件 → score ∈ [0,1]
difficulty: 低 / 中 / 高
basis: ユーザー向けの根拠文 (P の値を参照)
理論的根拠: 介入研究のレファレンス
```

### 5.2 介入カテゴリの整理

カテゴリは Gross の感情制御プロセスモデル §2.6 に対応させて読むと整理しやすい:

- **感情調整 (regulation)**: 反応調整・認知変化への介入。 既に発火した感情を扱う
- **環境設計 (situation selection/modification)**: 状況選択・修正への介入。 発火しにくい環境を作る
- **習慣 (long-term modulation)**: 注意配分・スキーマレベルの介入。 ベースを動かす

### 5.3 既存ルール10本の根拠

#### R2.1 high_anger_intensity → 有酸素運動を週3回以上 (感情調整)

- trigger: $\iota_{\text{anger}} > 70$
- 根拠: 有酸素運動は HPA 軸の調整・BDNF 上昇・前頭前野機能改善を通じて怒りのベース水準を下げる (Ratey, 2008; Stathopoulou et al., 2006)。 怒りの「背景圧」を下げる代謝的介入。

#### R2.2 high_anger_sensitivity → 刺激の多い環境から距離を置く (環境設計)

- trigger: $\rho_{\text{anger}} > 70$
- 根拠: 感度は刺激量と頻度で reset されない (Davidson, 1998)。 短期では暴露を減らす方が回復可能性を高める。 sensory processing sensitivity の文脈にも整合 (Aron & Aron, 1997)。

#### R2.3 low_joy_intensity → 週1回、初めての体験を入れる (習慣)

- trigger: $\iota_{\text{joy}} < 30$
- 根拠: ドーパミン系は新奇性に強く反応する (Bunzeck & Düzel, 2006)。 hedonic adaptation の打破には novelty が必要 (Lyubomirsky et al., 2005)。

#### R2.4 low_joy_sensitivity → 小さな達成を記録する習慣 (感情調整)

- trigger: $\rho_{\text{joy}} < 30$
- 根拠: 感度の問題は気づきの問題でもある (affective blunting)。 3 good things 介入 (Seligman et al., 2005) で感受性が回復する経験的証拠。

#### R2.5 high_fear_intensity → 朝のルーティン固定 (習慣)

- trigger: $\iota_{\text{fear}} > 70$
- 根拠: 不安の中核は不確実性 (uncertainty intolerance; Carleton, 2016)。 予測可能性を増やすことで Bayesian な事前分布の分散を減らし、ベース不安を下げる。

#### R2.6 high_fear_sensitivity → 意思決定の数を減らす (環境設計)

- trigger: $\rho_{\text{fear}} > 70$
- 根拠: 認知資源の枯渇は不安感受性を高める (Baumeister et al., 1998 ego depletion; ただし近年再現性議論あり Hagger et al., 2016)。 確実な経路として、選択肢削減はワーキングメモリ負荷を減らす。

#### R2.7 high_numbness → 身体感覚を使う活動 (感情調整)

- trigger: $\iota_{\text{numbness}} > 60$
- 根拠: 無感動は内受容感覚 (interoception) の低下と関連 (Murphy et al., 2017)。 運動・料理・自然との接触は身体感覚を高解像化し、解離の緩和につながる。

#### R2.8 high_suppression → 安全な場で言語化 (感情調整)

- trigger: $q > 70$
- 根拠: アレキシサイミア研究で言語化能力 (emotion granularity; Barrett, 2017) と感情調整能力の正相関。 表出筆記 (Pennebaker, 1997) の中長期効果。 affect labeling は扁桃体活動を下げる (Lieberman et al., 2007)。

#### R2.9 high_explosiveness → シグナル記録 (習慣)

- trigger: $\chi > 70$
- 根拠: 爆発性はメタ認知の不在で生じる (Siegel, 2010 window of tolerance)。 発火前のシグナル (身体感覚・状況) を可視化することで、可動化への移行に介入可能になる。

#### R2.10 long_sadness_duration → 悲しみに時間制限 (感情調整)

- trigger: $\delta_{\text{sadness}} > 70$
- 根拠: 持続の長さは反芻 (rumination; Nolen-Hoeksema, 1991) で説明される。 行動活性化 (Behavioral Activation; Martell et al., 2010) と「悲しみと付き合う時間」を構造化する介入は、両方とも反芻の中断を狙う。

### 5.4 改訂候補と新規ルール

#### R2.11 [新規] high_guilt → 自己批判の言語化 (感情調整)

- trigger: $\iota_{\text{guilt}} > 65$
- 根拠: 罪悪感の慢性化は「言われていない自己批判」の頭の中での反復で維持される。 紙に書き出して第三者視点で読むだけで強度が下がる (defusion; ACT の枠組み, Hayes et al., 2006)。

#### R2.12 [新規] high_shame → 自己慈悲練習 (感情調整)

- trigger: $\iota_{\text{shame}} > 60$
- 根拠: 恥は自己への「存在批判」であり、罪悪感より共感的応答に弱く反応する。 self-compassion 練習 (Neff, 2003) は恥の介入として最強のエビデンス。

#### R2.13 [新規] low_empathy → 視点取得練習 (習慣)

- trigger: $m < 30$
- 根拠: 共感はメンタライゼーション能力で構成され、訓練可能 (Bateman & Fonagy, 2010)。

#### R2.14 [新規] high_anger_intensity × high_suppression → 構造化された怒りの解放 (感情調整)

- trigger: $\iota_{\text{anger}} > 70 \land q > 70$
- 根拠: 表出抑制と高怒りの組み合わせは身体化リスクが高い (Pennebaker, 1990 inhibition theory)。 単発の発散ではなく、構造化された練習 (boundary-setting practice) が必要。

### 5.5 推奨制限ロジック

ルールが多数発火する場合の絞り込み:

- カテゴリあたり最大2件
- 全体で最大5件
- $score$ (= 閾値からの超過/不足の正規化値) で降順ソート

これは「全部見せても行動できない」「一度に変えられる介入は2-3個」というセルフコーチング文脈での経験則 (Duhigg, 2012; Clear, 2018) に従う。

---

## 6. 逆算: 介入ランキング

### 6.1 形式

ユーザーは目標を設定する:

$$g = (e^*, \ell^*, P_{e^*, \ell^*}^{\text{tgt}})$$

$e^*$ は目標感情、$\ell^* \in \{\iota, \rho, \delta\}$ は層、 $P^{\text{tgt}}$ は目標値。 現在値との差を:

$$\Delta P = P^{\text{tgt}} - P^{\text{cur}}$$

として、$\Delta P \neq 0$ の場合のみ進行。

修正可能な (variable, age bracket) 集合 $\mathcal{V} \times B^*$ について、各要素 $(v, b)$ に対し:

1. **単位勾配**: $E$ から $v_b$ を $\pm 1$ 動かしたときの $P_{e^*, \ell^*}$ の変化:
$$g(v, b) = \frac{P_{e^*, \ell^*}(E') - P_{e^*, \ell^*}(E)}{\pm 1}$$

2. **方向選択**: $\text{dir}(v, b) = \text{sign}(g(v, b) \cdot \Delta P)$。 目標に近づく方向。

3. **現実的ステップ** $w_v$ (スコア型: 20、カウント型: 3) を方向で適用、境界でクランプ:
$$\Delta v = \text{clip}_{[0, w_v]}(\text{dir} \cdot w_v, \text{境界})$$

4. **期待影響量**:
$$\text{impact}(v, b) = (P_{e^*, \ell^*}(E'') - P_{e^*, \ell^*}(E)) \cdot \text{sign}(\Delta P)$$

ここで $E''$ は $v_b$ にステップを適用した環境。 sign 調整により「目標に近づく方向への変化量」が常に正になる。

5. **ランキング**: $\text{impact} > 0$ の要素のみ採用、降順ソート、上位 $K$ 件を返す。

### 6.2 「修正可能」の解釈

既定では $B^* = \{16\text{-}20\}$ とする。 これは「過去は変えられない」という素朴な制約に対する第一近似である。

しかし臨床的には以下の留保が必要:

1. **記憶の再評価**: 過去の出来事は変えられないが「過去の意味づけ」は変えられる (Pennebaker, 1997; cognitive restructuring)。 完全な過去固定は現実より厳しい想定である。
2. **発達的補償**: 後の年齢区分での経験は、前の区分の不足を完全には埋めないが部分的には補償しうる (e.g., earned secure attachment; Roisman et al., 2002)。
3. **逆算が示すのは「現在以降の介入候補」であり「過去の改竄」ではない**: ユーザーへの提示文言で明示する必要がある。

将来の拡張として $B^* = \{11\text{-}15, 16\text{-}20\}$ をオプション化すること、過去区分への介入を「再評価としてのワーク」と意味づけして提示することを検討する (§9)。

### 6.3 限界

- 単位勾配は局所線形近似であり、現実の発達的影響は閾値・相互作用を含む
- 「期待影響量」は「もしステップが完全に実現したら」の前提値であり、実現可能性は別問題
- ランキングは決定論的だが、複数の上位介入は近接した impact を持つことが多く、順位差が信頼できないことがある (numerical noise)
- 因果でなく「モデル内での感度分析」であることを利用者に明示する

---

## 7. 妥当性、限界、倫理

### 7.1 自己報告と回顧バイアス

入力は本人の主観的回顧である。 一般に:
- 気分一致記憶 (mood-congruent recall; Bower, 1981) で現在の感情に色付けされる
- 出来事の単純化・神話化が起こる (life narrative; McAdams, 2001)
- 早期記憶ほど不正確になる (infantile amnesia)

この特性ゆえに、本モデルの出力は「過去の客観的記述」ではなく**「現在のユーザーが抱いている過去のナラティブ」を入力としたモデル予測**と読むべきである。 内省ツールとしてはこれで十分だが、過去の事実推定には使えない。

### 7.2 因果性の主張は限定的

ルールは「環境 → 感情」の方向で記述するが、これは一方向性を主張するものではない。 実際の発達では:
- 子の気質が養育者の養育行動を引き出す (evocative gene-environment correlation; Scarr & McCartney, 1983)
- 双方向的な共同調整 (co-regulation; Sameroff, 2010)

が起きている。 我々のモデルは「環境からの影響」だけを切り取った見立てであり、現実の発達の半分しか描いていない。

### 7.3 個別差と文化差

- 引用研究の大半は WEIRD (Western, Educated, Industrialized, Rich, Democratic) 標本に依存する (Henrich et al., 2010)
- 集団主義文化では「支配度」と感情アウトカムの関係が異なる可能性 (Wang & Pomerantz, 2009)
- 性別・神経多様性 (e.g., autism spectrum) でも感受性プロファイルは異なる
- 本モデルは平均的傾向の近似であり、個別ユーザーの経験そのものではない

### 7.4 医療的判断との分離

本モデルは:
- 抑うつ・不安障害・PTSD・パーソナリティ障害などの**診断ツールではない**
- 出力スコアが極端に高くても、それは臨床的な重症度を意味しない
- 治療の代替にならない (アプリ内に明示の文言を置く §9)

### 7.5 倫理的注意

- 自己分析が痛みを引き起こす可能性: 誘導の言語を慎重に選ぶ。「あなたの不安は親のせいだ」と読まれない表現を心がける
- 因果帰属の罠: ユーザーが過去の他者を断罪する道具にしないよう、行動提案は「自分にできる介入」に絞る
- データ取り扱い: 自己分析の入力は機微情報。匿名性・保存期間を明確にする (アプリ実装側の責任)

---

## 8. 検証戦略

### 8.1 内部整合性

- ルールの単調性テスト: 環境を悪化させると対応する感情が悪化することをユニットテストで検証 (現状一部実装済み)
- 限界条件: 全極値入力で 0-100 にクランプされること (実装済み)
- 純粋性: 同じ入力で同じ出力 (実装済み)

### 8.2 概念妥当性

- 既存尺度との交差検証: ACE-Q、AAS (Adult Attachment Scale; Collins & Read, 1990)、PBI (Parental Bonding Instrument; Parker et al., 1979) を併用したユーザーで、本モデルの推定が対応する尺度と相関するか
- 同じコンセプト(例: 不安) を扱う他の自己評価尺度 (STAI 特性版) との収束的妥当性

### 8.3 予測妥当性 (将来課題)

- 縦断的データ: 同一ユーザーが時間を置いて再評価したとき、予測された感情プロファイルと実測値が対応するか
- 介入応答性: ルール R2 で提案された介入を実行したユーザーで、後続のスコアが予測通り動くか

### 8.4 ユーザー再現性

- test-retest 信頼性: 同じユーザーが2週間後に再入力したとき、出力プロファイルが安定しているか (記憶の安定性とモデルの安定性の合成)
- 望ましい安定性レンジ: 連続再入力で各層 ±10 程度の誤差は許容、それ以上動くなら入力ガイダンスを見直す

### 8.5 較正手順 (将来)

数値パラメータ ($\alpha_b$, 閾値, 効果量 $\omega_r$) を経験的に較正する手順:

1. 大規模ユーザーから入力 + 既存尺度の同時データを収集 (倫理審査前提)
2. 各ルールについて、当該感情の予測誤差を最小化する $\omega_r$ を探索 (Ridge / 階層モデル)
3. 解釈可能性のため、効果量は離散グリッド (例: 整数 ±1〜15) に丸める
4. 較正後の値で再リリース、Δの大きさを公開

---

## 9. 拡張方向

### 9.1 個別差の導入 (差異感受性)

- ユーザーごとの感受性スカラー $\sigma$ をオプションで導入
- HSP 簡略版 (Aron, 1996) などの尺度から推定、または自己評価
- 全ルール effect に $\sigma$ を乗じる

### 9.2 動的モデル (時系列拡張)

- 現状: 静的スナップショット
- 拡張: 同一セッションを月次で取り、推移を表示 (Phase 5+)
- 介入の累積効果を可視化

### 9.3 過去の意味づけ介入

- §6.2 の留保を実装に反映
- 「過去のあの経験を再評価する」ことで仮想的にスコアを動かすシミュレーション
- ナラティブ介入の理論的位置付け (Pennebaker; Adler, 2012 narrative identity)

### 9.4 自由記述からのスコア推定

- ユーザーが文章で書いたエピソード → 8項目スコアの自動推定 (LLM ベース)
- 推定の不確実性を明示
- 入力の摩擦を下げる代わりに、推定誤差を許容する設計

### 9.5 リファレンス比較

- 他ユーザーの匿名集計と比較する機能
- 「あなたの不安強度はユーザー平均より15ポイント高い」のような相対表示
- 倫理的配慮: 競争的・自己卑下的な比較にならないよう表現を慎重に

### 9.6 介入の累積モデル

- 提案された介入を実施した時、感情プロファイルがどう動くかの期待値を提示
- 介入効果サイズは介入研究のメタ分析 (例: Stathopoulou et al., 2006 で運動の効果) を引用
- ただし個人差の大きさを明示

---

## 10. 結語

本ノートで提案したモデルは、確立された発達心理学・感情制御研究の交差点に立ち、「自分の感情の出方は、自分が育った環境のどこから来ているか」を**説明可能な形で**俯瞰する道具を目指す。 数値パラメータの絶対値は経験的較正を待つ暫定値であるが、構造 (4区分・3層・カテゴリ別ルール・年齢勾配) は既存研究の傾向を反映している。

最重要なメッセージは、本モデルは**因果推論機ではなく、ユーザーの内省を支援する反射板である**という点である。 ユーザーがこのモデルを通じて自分の感情の由来について新しい仮説を持ち、それを行動に翻訳できれば、本ツールの目的は達成される。 過去への断罪や、自身の状態の医療化を促すならば、それは設計の失敗である。

実装はこの理論的枠組みに照らして、各ルールが「§ 何項のどの根拠」に対応するかをコメントで明示する。 これは将来のメンテナンス時、パラメータ変更が「理論的根拠を持つ調整」なのか「単なる手チューニング」なのかを区別可能にするための装置である。

---

## 付録 A: 実装マッピング

| 理論項目 | 実装ファイル | 実装記号 |
|---|---|---|
| §3.2 環境変数 $E$ | `src/engine/types.ts` | `EnvironmentInput`, `AgeBracketInput` |
| §3.3 感情プロファイル $P$ | `src/engine/types.ts` | `EmotionProfile`, `EmotionScore` |
| §3.4 表現スタイル $S$ | `src/engine/types.ts` | `ExpressionStyle` |
| §3.5 年齢係数 $\alpha_b$ | `src/engine/weights.ts` | `AGE_COEFFICIENTS` |
| §3.6 ベースライン | `src/engine/weights.ts` | `EMOTION_BASELINE`, `EXPRESSION_BASELINE` |
| §3.6 計算フロー | `src/engine/calculator.ts` | `calculate()` |
| §4 因果ルール $R_1$ | `src/engine/weights.ts` | `FACTOR_RULES` |
| §5 行動ルール $R_2$ | `src/engine/actionRules.ts` | `ACTION_RULES` |
| §5 推奨抽出 | `src/engine/recommender.ts` | `recommend()` |
| §6 逆算 | `src/engine/inverseCalculator.ts` | `inverseInterventions()` |
| §6.2 修正可能区分 | `src/engine/inverseCalculator.ts` | `InverseOptions.modifiableBrackets` |

## 付録 B: 用語集

| 用語 | 定義 |
|---|---|
| 強度 (intensity) | 感情のベース水準。慢性的気分傾向の代理 |
| 感度 (sensitivity) | 発火閾値の逆数。同じ刺激での反応のしやすさ |
| 持続 (duration) | 反応後の収まりにくさ。反芻・回復関数の傾き |
| 心理的統制 | 子の感情・思考・自己への侵入。罪悪感誘導・愛情撤回など |
| ACE | Adverse Childhood Experiences。Felitti ら 1998 |
| 内的作業モデル | Bowlby のアタッチメント理論で、養育者との相互作用から形成される自他関係表象 |
| 早期不適応スキーマ | Young のスキーマ療法で、満たされなかった中核的ニーズから形成される認知-情動パターン |
| broaden-and-build | Fredrickson のポジティブ感情理論。ポジティブ感情がリソースを構築する |
| affect labeling | 感情を言語化することによる情動調整効果 |
| 発火強度 $\psi$ | ルールが入力に対してどの程度効くかの 0-1 連続値 |

## 付録 C: パラメータ一覧 (第一版)

### 年齢係数

| 区分 | $\alpha_b$ | 根拠 |
|---|---|---|
| 0-5 | 1.5 | アタッチメント臨界期、神経可塑性最大 |
| 6-10 | 1.3 | 自己概念形成期 |
| 11-15 | 1.1 | 思春期前半。社会的脳発達 |
| 16-20 | 1.0 | 基準。アイデンティティ形成期 |

### 閾値 (THRESHOLDS)

| 名前 | 値 | 用途 |
|---|---|---|
| affectionLow | 50 | R1.1 |
| stabilityLow | 50 | R1.2, R1.5 |
| belongingLow | 50 | R1.6 |
| controlHigh | 50 | R1.7, R1.10 |
| socialSuccessHigh | 50 | R1.4 |
| stressEventsFull | 5 | R1.3 |
| (新規) successEventsFull | 5 | R1.9 |

### 効果量 (主要)

R1.1〜R1.7 は §4.2 の表参照。 新規 R1.8〜R1.10 は §4.3 参照。

### 行動ルール閾値

R2.1〜R2.10 の閾値は感情層のスコア値で 60〜70 (高側)、25〜30 (低側) を典型値とする。 §5.3 参照。

---

## 参考文献

1. Ainsworth, M. D. S., Blehar, M. C., Waters, E., & Wall, S. (1978). *Patterns of attachment*. Erlbaum.
2. Aron, E. N., & Aron, A. (1997). Sensory-processing sensitivity and its relation to introversion and emotionality. *Journal of Personality and Social Psychology, 73*(2), 345-368.
3. Bandura, A. (1997). *Self-efficacy: The exercise of control*. Freeman.
4. Barber, B. K. (1996). Parental psychological control: Revisiting a neglected construct. *Child Development, 67*(6), 3296-3319.
5. Barrett, L. F. (2017). *How emotions are made*. Houghton Mifflin Harcourt.
6. Baumrind, D. (1971). Current patterns of parental authority. *Developmental Psychology Monographs, 4*(1, Pt. 2).
7. Belsky, J. (1997). Variation in susceptibility to environmental influence: An evolutionary argument. *Psychological Inquiry, 8*(3), 182-186.
8. Belsky, J., & Pluess, M. (2009). Beyond diathesis stress: Differential susceptibility to environmental influences. *Psychological Bulletin, 135*(6), 885-908.
9. Bower, G. H. (1981). Mood and memory. *American Psychologist, 36*(2), 129-148.
10. Bowlby, J. (1969). *Attachment and loss, Vol. 1: Attachment*. Basic Books.
11. Carleton, R. N. (2016). Into the unknown: A review and synthesis of contemporary models involving uncertainty. *Journal of Anxiety Disorders, 39*, 30-43.
12. Davidson, R. J. (1998). Affective style and affective disorders. *Cognition & Emotion, 12*(3), 307-330.
13. Davis, K. L., & Panksepp, J. (2018). *The emotional foundations of personality*. Norton.
14. Ekman, P. (1992). Are there basic emotions? *Psychological Review, 99*(3), 550-553.
15. Erikson, E. H. (1968). *Identity: Youth and crisis*. Norton.
16. Felitti, V. J., et al. (1998). Relationship of childhood abuse and household dysfunction to many of the leading causes of death in adults: The Adverse Childhood Experiences (ACE) Study. *American Journal of Preventive Medicine, 14*(4), 245-258.
17. Fredrickson, B. L. (2001). The role of positive emotions in positive psychology: The broaden-and-build theory. *American Psychologist, 56*(3), 218-226.
18. Greenough, W. T., Black, J. E., & Wallace, C. S. (1987). Experience and brain development. *Child Development, 58*(3), 539-559.
19. Grolnick, W. S. (2003). *The psychology of parental control*. Erlbaum.
20. Gross, J. J. (1998). The emerging field of emotion regulation: An integrative review. *Review of General Psychology, 2*(3), 271-299.
21. Gross, J. J. (2015). Emotion regulation: Current status and future prospects. *Psychological Inquiry, 26*(1), 1-26.
22. Henrich, J., Heine, S. J., & Norenzayan, A. (2010). The weirdest people in the world? *Behavioral and Brain Sciences, 33*(2-3), 61-83.
23. Lanius, R. A., et al. (2010). Emotion modulation in PTSD. *American Journal of Psychiatry, 167*(6), 640-647.
24. Lewis, M. (1995). *Shame: The exposed self*. Free Press.
25. Lieberman, M. D., et al. (2007). Putting feelings into words: Affect labeling disrupts amygdala activity. *Psychological Science, 18*(5), 421-428.
26. Lyubomirsky, S., Sheldon, K. M., & Schkade, D. (2005). Pursuing happiness: The architecture of sustainable change. *Review of General Psychology, 9*(2), 111-131.
27. Martell, C. R., Dimidjian, S., & Herman-Dunn, R. (2010). *Behavioral activation for depression*. Guilford.
28. Murphy, J., Brewer, R., Catmur, C., & Bird, G. (2017). Interoception and psychopathology. *Developmental Cognitive Neuroscience, 23*, 45-56.
29. Neff, K. D. (2003). Self-compassion: An alternative conceptualization of a healthy attitude toward oneself. *Self and Identity, 2*(2), 85-101.
30. Nolen-Hoeksema, S. (1991). Responses to depression and their effects on the duration of depressive episodes. *Journal of Abnormal Psychology, 100*(4), 569-582.
31. Pennebaker, J. W. (1997). Writing about emotional experiences as a therapeutic process. *Psychological Science, 8*(3), 162-166.
32. Porges, S. W. (2011). *The polyvagal theory*. Norton.
33. Ratey, J. J. (2008). *Spark: The revolutionary new science of exercise and the brain*. Little, Brown.
34. Roisman, G. I., Padrón, E., Sroufe, L. A., & Egeland, B. (2002). Earned-secure attachment status in retrospect and prospect. *Child Development, 73*(4), 1204-1219.
35. Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist, 55*(1), 68-78.
36. Sameroff, A. (2010). A unified theory of development: A dialectic integration of nature and nurture. *Child Development, 81*(1), 6-22.
37. Schalinski, I., et al. (2016). Type and timing of adverse childhood experiences differentially affect severity of PTSD, dissociative and depressive symptoms in adult inpatients. *BMC Psychiatry, 16*, 295.
38. Seligman, M. E. P., Steen, T. A., Park, N., & Peterson, C. (2005). Positive psychology progress: Empirical validation of interventions. *American Psychologist, 60*(5), 410-421.
39. Shonkoff, J. P., et al. (2012). The lifelong effects of early childhood adversity and toxic stress. *Pediatrics, 129*(1), e232-e246.
40. Siegel, D. J. (2010). *The mindful therapist*. Norton.
41. Stathopoulou, G., Powers, M. B., Berry, A. C., Smits, J. A., & Otto, M. W. (2006). Exercise interventions for mental health: A quantitative and qualitative review. *Clinical Psychology: Science and Practice, 13*(2), 179-193.
42. Tangney, J. P., & Dearing, R. L. (2002). *Shame and guilt*. Guilford.
43. Wang, Q., & Pomerantz, E. M. (2009). The motivational landscape of early adolescence in the United States and China. *Child Development, 80*(4), 1272-1287.
44. Williams, K. D. (2007). Ostracism. *Annual Review of Psychology, 58*, 425-452.
45. Young, J. E., Klosko, J. S., & Weishaar, M. E. (2003). *Schema therapy: A practitioner's guide*. Guilford.
