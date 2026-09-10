import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import type { SubModule } from '@/lib/types';
import { allSkills, getLesson, getSkill } from '@/lib/content';
import { ImageSlot, VideoEmbed } from '@/components/LessonMedia';
import {
  LessonCooks,
  LessonLockNotice,
  LessonStatusBadge,
  PracticeRecipes,
  StudyToggle,
} from '@/components/LessonProgress';

// Tables need a scroll container so the page body never scrolls sideways.
const mdxComponents = {
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="table-wrap">
      <table {...props} />
    </div>
  ),
};

// Every sub-module gets a page, lesson written or not — plenty of links point
// at skills that have no .mdx yet, and a stub reads better than a 404.
export function generateStaticParams() {
  return Array.from(allSkills().keys()).map((id) => ({ id }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const skill = getSkill(id);
  if (!skill) notFound();
  const lesson = getLesson(id);

  if (!lesson) return <LessonStub id={id} skill={skill} />;

  const fm = lesson.frontmatter;

  return (
    <>
      <div className="crumb">
        <Link href="/map">{skill.moduleTitle}</Link>
      </div>

      <div className="meta" style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <LessonStatusBadge id={id} />
        <span className="badge tier">
          {{ 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' }[fm.tier]}
        </span>
        {fm.estimated_read_minutes && (
          <span className="badge tier">{fm.estimated_read_minutes} min read</span>
        )}
        {!fm.reviewed && <span className="badge draft">Unreviewed draft</span>}
      </div>

      <h1>{fm.title}</h1>
      <p className="lede">{fm.summary}</p>

      <LessonLockNotice id={id} />

      {fm.objectives?.length > 0 && (
        <div className="card" style={{ marginTop: 22 }}>
          <div className="eyebrow">After this you should be able to</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
            {fm.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      {(fm.videos?.length ?? 0) > 0 && (
        <>
          <h2>Watch</h2>
          {fm.videos!.map((v, i) => (
            <VideoEmbed key={i} video={v} />
          ))}
        </>
      )}

      <hr className="rule" />

      <article className="prose">
        <MDXRemote
          source={lesson.body}
          components={mdxComponents}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        />
      </article>

      {(fm.images?.length ?? 0) > 0 && (
        <>
          <h2>Figures</h2>
          {fm.images!.map((img, i) => (
            <ImageSlot key={i} image={img} />
          ))}
        </>
      )}

      <hr className="rule" />

      <h2>Practice to graduate</h2>
      <div className="card" style={{ marginBottom: 14 }}>
        <p style={{ marginTop: 0 }}>{fm.practice.prompt}</p>
        <div className="eyebrow">Your journal entry should cover</div>
        <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
          {fm.practice.criteria.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      <PracticeRecipes id={id} />

      <div style={{ marginBottom: 14 }}>
        <StudyToggle id={id} />
      </div>

      <Link className="btn primary" href={`/journal/new/?skill=${id}`}>
        Log a cook for this
      </Link>

      <LessonCooks id={id} />

      {(fm.sources?.length ?? 0) > 0 && (
        <>
          <h2>Sources</h2>
          <ul className="mono" style={{ paddingLeft: 20 }}>
            {fm.sources!.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </>
      )}

      <p className="mono" style={{ marginTop: 28 }}>{lesson.filePath}</p>
    </>
  );
}

/** A sub-module in the curriculum that has no lesson written for it yet. */
function LessonStub({ id, skill }: { id: string; skill: SubModule }) {
  return (
    <>
      <div className="crumb">
        <Link href="/map">{skill.moduleTitle}</Link>
      </div>

      <div className="meta" style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <LessonStatusBadge id={id} />
        <span className="badge tier">
          {{ 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' }[skill.tier]}
        </span>
        <span className="badge draft">No lesson yet</span>
      </div>

      <h1>{skill.title}</h1>
      <p className="lede">{skill.why}</p>

      <LessonLockNotice id={id} />

      <div className="empty" style={{ marginTop: 22 }}>
        This sub-module is in the curriculum but the lesson has not been written.
        You can still mark it studied and log a cook against it.
      </div>

      <h2>Practice to graduate</h2>
      <div className="card" style={{ marginBottom: 14 }}>
        <p style={{ margin: 0 }}>{skill.practice}</p>
      </div>

      <PracticeRecipes id={id} />

      <div style={{ marginBottom: 14 }}>
        <StudyToggle id={id} />
      </div>

      <Link className="btn primary" href={`/journal/new/?skill=${id}`}>
        Log a cook for this
      </Link>

      <LessonCooks id={id} />
    </>
  );
}
