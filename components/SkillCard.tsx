import Link from 'next/link';
import type { SkillStatus, SubModule } from '@/lib/types';

const TIER_LABEL = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' } as const;

export function StatusBadge({ status }: { status: SkillStatus }) {
  const label =
    status === 'practiced'
      ? 'Practiced'
      : status === 'studied'
        ? 'Studied'
        : status === 'available'
          ? 'Available'
          : 'Locked';
  return <span className={`badge ${status}`}>{label}</span>;
}

export default function SkillCard({
  skill,
  status,
  hasLesson,
  blockedBy,
}: {
  skill: SubModule;
  status: SkillStatus;
  hasLesson: boolean;
  blockedBy?: string[];
}) {
  const inner = (
    <>
      <div className="meta">
        <StatusBadge status={status} />
        <span className="badge module">{skill.moduleTitle}</span>
        <span className="badge tier">{TIER_LABEL[skill.tier]}</span>
        {!hasLesson && <span className="badge draft">No lesson yet</span>}
      </div>
      <div className="title">{skill.title}</div>
      <div className="why">{skill.why}</div>
      {blockedBy && blockedBy.length > 0 && (
        <div className="mono" style={{ marginTop: 8 }}>
          needs: {blockedBy.join(', ')}
        </div>
      )}
    </>
  );

  // Sub-modules without a lesson still have a page — a stub you can mark
  // studied and log against — so every card links.
  return (
    <Link
      href={`/lesson/${skill.id}/`}
      className="card skill-card"
      style={hasLesson ? undefined : { opacity: 0.65 }}
    >
      {inner}
    </Link>
  );
}
