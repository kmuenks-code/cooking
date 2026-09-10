import type { LessonImage, LessonVideo } from '@/lib/types';

const isTodo = (v: string | undefined) =>
  !v || v.trim().toUpperCase() === 'TODO';

export function VideoEmbed({ video }: { video: LessonVideo }) {
  if (isTodo(video.youtube_id)) {
    return (
      <div className="video">
        <div className="placeholder">
          <span className="k">Video slot — not yet filled</span>
          {video.note ?? 'No source selected for this lesson yet.'}
        </div>
      </div>
    );
  }

  // youtube-nocookie avoids setting tracking cookies until playback starts.
  const start = video.start_seconds ? `?start=${video.start_seconds}` : '';
  const src = `https://www.youtube-nocookie.com/embed/${video.youtube_id}${start}`;

  return (
    <div className="video">
      <div className="frame">
        <iframe
          src={src}
          title={video.title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="cap">
        <span className="t">{video.title}</span>
        {!isTodo(video.channel) && <> — {video.channel}</>}
        {video.note && <div style={{ marginTop: 3 }}>{video.note}</div>}
      </div>
    </div>
  );
}

export function ImageSlot({ image }: { image: LessonImage }) {
  if (isTodo(image.src)) {
    return (
      <figure style={{ margin: '0 0 20px' }}>
        <div className="placeholder">
          <span className="k">Image slot — not yet shot</span>
          <div style={{ color: 'var(--text-dim)' }}>{image.alt}</div>
          {image.caption && (
            <div style={{ marginTop: 6, fontStyle: 'italic' }}>
              Caption: {image.caption}
            </div>
          )}
          <div className="mono" style={{ marginTop: 6 }}>
            credit: {image.credit}
          </div>
        </div>
      </figure>
    );
  }
  return (
    <figure style={{ margin: '0 0 20px' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.alt}
        style={{
          width: '100%',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}
      />
      <figcaption className="cap" style={{ marginTop: 7 }}>
        {image.caption}{' '}
        <span className="mono">({image.credit})</span>
      </figcaption>
    </figure>
  );
}
