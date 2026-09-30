export function Progress({ done, total }: { done: number; total: number }) {
  return (
    <span className="prog" aria-label={`${done} of ${total} done`}>
      {done}/{total}
    </span>
  );
}
