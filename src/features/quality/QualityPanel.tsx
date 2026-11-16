import { CircleCheck, CircleX, LoaderCircle, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { QualityLevel, QualityReport } from './types';

const LEVEL_UI: Record<QualityLevel, { title: string; icon: LucideIcon; text: string; dot: string }> = {
  good: { title: 'Good quality', icon: CircleCheck, text: 'text-emerald-400', dot: 'bg-emerald-400' },
  warn: { title: 'Acceptable, could be better', icon: TriangleAlert, text: 'text-amber-400', dot: 'bg-amber-400' },
  poor: { title: 'Low quality, consider retaking', icon: CircleX, text: 'text-red-400', dot: 'bg-red-400' },
};

interface QualityPanelProps {
  report: QualityReport | null;
}

export function QualityPanel({ report }: QualityPanelProps) {
  return (
    <section aria-label="Image quality" aria-live="polite" className="mx-4 rounded-2xl bg-white/5 p-3">
      {report ? <ReportBody report={report} /> : <Analyzing />}
    </section>
  );
}

function Analyzing() {
  return (
    <p className="flex items-center gap-2 text-sm text-neutral-400">
      <LoaderCircle className="size-4 animate-spin" aria-hidden /> Checking image quality…
    </p>
  );
}

function ReportBody({ report }: { report: QualityReport }) {
  const overall = LEVEL_UI[report.overall];
  const Icon = overall.icon;
  const tips = report.checks.filter((c) => c.tip);

  return (
    <>
      <h2 className={`flex items-center gap-2 font-semibold ${overall.text}`}>
        <Icon className="size-5" aria-hidden /> {overall.title}
      </h2>

      {/* 4 columns only on wide portrait screens; the landscape side column is narrow */}
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:portrait:grid-cols-4">
        {report.checks.map((check) => (
          <div key={check.id}>
            <dt className="text-xs text-neutral-400">{check.label}</dt>
            <dd className="flex items-center gap-1.5">
              <span className={`size-2 shrink-0 rounded-full ${LEVEL_UI[check.level].dot}`} aria-hidden />
              {check.value}
              <span className="sr-only">({check.level})</span>
            </dd>
          </div>
        ))}
      </dl>

      {tips.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-amber-200">
          {tips.map((check) => (
            <li key={check.id}>{check.tip}</li>
          ))}
        </ul>
      )}
    </>
  );
}
