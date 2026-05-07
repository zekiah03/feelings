import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { ActionList } from '@/components/ActionList';
import { EmotionRadarChart } from '@/components/EmotionRadarChart';
import { EmotionScoreCard } from '@/components/EmotionScoreCard';
import { SimulatorV2 } from '@/components/Simulator_v2';
import { StyleBarChart } from '@/components/StyleBarChart';
import { TimelineChart } from '@/components/TimelineChart';
import { TwinContributor } from '@/components/TwinContributor';
import { ALL_EMOTIONS, CORE_EMOTIONS, EXTENDED_EMOTIONS, recommend, type EnvironmentInput } from '@/engine';
import { recordsToEnvironmentInput } from '@/repositories/interface';
import { ensureMigrated, getDb } from '@/lib/db';
import { getCurrentUserId } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';

export default async function ResultPage({ params }: { params: { id: string } }) {
  await ensureMigrated();
  const userId = getCurrentUserId();
  const { uow } = getDb();

  const session = await uow.repos.sessions.getSession(params.id);
  if (!session) notFound();
  if (session.userId !== userId) redirect('/');

  const result = await uow.repos.results.getLatestResult(params.id);
  if (!result) {
    // 分析がまだ実行されていない場合は入力ページへ戻す
    redirect(`/session/${params.id}/input`);
  }

  const inputsRows = await uow.repos.inputs.getInputsBySession(params.id);
  let environmentInput: EnvironmentInput | null = null;
  try {
    environmentInput = recordsToEnvironmentInput(inputsRows);
  } catch {
    environmentInput = null;
  }

  const { profile } = result;

  // このセッションに対して既に保存済みの提案 (同一 actionText で一致判定)
  const allActions = await uow.repos.actions.listByUser(userId);
  const savedForSession = allActions.filter((a) => a.sessionId === params.id);
  const recommendations = recommend(profile);
  const savedMap: Record<string, string> = {};
  for (const rec of recommendations) {
    const match = savedForSession.find((a) => a.actionText === rec.text);
    if (match) savedMap[rec.ruleId] = match.id;
  }

  return (
    <div className="space-y-14">
      <header className="space-y-3">
        <p className="text-xs tracking-widest text-ink-400 uppercase">結果</p>
        <h1 className="text-2xl sm:text-3xl font-semibold">{session.label}</h1>
        <p className="text-sm text-ink-400">
          計算日時: {new Date(result.calculatedAt).toLocaleString('ja-JP')}
        </p>
        <div className="pt-1">
          <Link
            href={`/session/${params.id}/input`}
            className="text-sm text-ink-300 underline-offset-4 hover:text-ink-100 hover:underline"
          >
            ← 入力を見直す
          </Link>
        </div>
      </header>

      {/* Section 1: Radar */}
      <Section
        title="感情プロファイル"
        description="コア感情6つの強度・感度・持続を重ねて表示。"
      >
        <EmotionRadarChart profile={profile} />
      </Section>

      {/* Section 2: ScoreCards */}
      <Section
        title="感情スコア一覧"
        description="各感情の3層スコアと主な影響要因トップ3。"
      >
        <div className="space-y-6">
          <div>
            <p className="text-[11px] tracking-widest text-ink-400 uppercase mb-3">
              コア感情
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CORE_EMOTIONS.map((e) => (
                <EmotionScoreCard key={e} emotion={e} score={profile.emotions[e]} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] tracking-widest text-ink-400 uppercase mb-3">
              拡張感情
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {EXTENDED_EMOTIONS.map((e) => (
                <EmotionScoreCard key={e} emotion={e} score={profile.emotions[e]} />
              ))}
            </div>
          </div>
        </div>
        {/* 全感情を TS から参照して tree-shake を防ぐ (未使用警告対策) */}
        <span hidden aria-hidden>
          {ALL_EMOTIONS.length}
        </span>
      </Section>

      {/* Section 3: Expression style */}
      <Section
        title="表現スタイル"
        description="どう感情が表に出るか (外側の振る舞い傾向)。"
      >
        <StyleBarChart expression={profile.expression} />
      </Section>

      {/* Section 4: Timeline */}
      {environmentInput && (
        <Section
          title="年齢区分別の寄与"
          description="各年齢区分だけを反映した場合の感情強度。時期ごとの影響の出方が見える。"
        >
          <TimelineChart input={environmentInput} />
        </Section>
      )}

      {/* Section 5: Recommendations */}
      <Section
        title="あなたへの提案"
        description="現在のスコアから自動抽出された行動案。気になるものだけ保存して /actions で管理できる。"
      >
        <ActionList
          sessionId={params.id}
          recommendations={recommendations}
          savedMap={savedMap}
        />
      </Section>

      {/* Section 6: Simulator v2 (順方向 + 逆算) */}
      {environmentInput && (
        <Section
          title="シミュレーター"
          description="順方向: 環境値を動かして結果を確認 / 逆算: 目標から最も効果的な介入を抽出。どちらも API は呼ばない。"
        >
          <SimulatorV2 baseline={environmentInput} baselineProfile={profile} />
        </Section>
      )}

      {/* Digital Twin contribution */}
      <TwinContributor
        appId="feelings"
        data={{ emotions: profile.emotions as unknown as Record<string, unknown> }}
      />
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-semibold text-ink-100">{title}</h2>
        {description && (
          <p className="text-xs sm:text-sm text-ink-400">{description}</p>
        )}
      </div>
      <div className="rounded-xl border border-ink-700 bg-ink-800/50 p-4 sm:p-6">
        {children}
      </div>
    </section>
  );
}
