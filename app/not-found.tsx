import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <div className="eyebrow">404</div>
      <h1>Nothing here</h1>
      <p className="lede">
        That page is not part of the curriculum — or the link is older than the
        content it pointed at.
      </p>
      <p className="chips" style={{ marginTop: 20 }}>
        <Link className="btn primary" href="/">
          Today
        </Link>
        <Link className="btn" href="/map">
          The map
        </Link>
        <Link className="btn" href="/recipes">
          Recipes
        </Link>
      </p>
    </>
  );
}
