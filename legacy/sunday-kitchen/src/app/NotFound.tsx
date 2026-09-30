import { Link } from 'react-router';

export function NotFound() {
  return (
    <div className="card">
      <h2>Page not found</h2>
      <p className="muted" style={{ marginTop: 8 }}>
        <Link className="linkbtn" to="/">
          Go to today
        </Link>
      </p>
    </div>
  );
}
