import type { ReactNode } from 'react';

// The imported library uses headings, lists and tables. Raw HTML is never rendered.
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, index) => {
    if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link)
      return /^https?:\/\//.test(link[2]!) ? (
        <a key={index} href={link[2]} target="_blank" rel="noreferrer">
          {link[1]}
        </a>
      ) : (
        <span key={index}>{link[1]}</span>
      );
    return part;
  });
}
export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).filter(Boolean);
  return (
    <div className="prose">
      {blocks.map((block, index) => {
        const lines = block.trim().split('\n');
        if (lines[0]?.startsWith('|')) {
          const rows = lines
            .filter((line) => line.startsWith('|') && !/^\|[\s:|-]+$/.test(line))
            .map((line) =>
              line
                .slice(1, -1)
                .split('|')
                .map((cell) => cell.trim()),
            );
          return (
            <div className="table-scroll" key={index}>
              <table>
                <thead>
                  <tr>
                    {rows[0]?.map((cell, i) => (
                      <th key={i}>{inline(cell)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(1).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{inline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (/^\d+\. /.test(lines[0] ?? ''))
          return (
            <ol key={index}>
              {block.split(/\n(?=\d+\. )/).map((line, i) => (
                <li key={i}>{inline(line.replace(/^\d+\. /, ''))}</li>
              ))}
            </ol>
          );
        if (lines[0]?.startsWith('- '))
          return (
            <ul key={index}>
              {block.split(/\n(?=- )/).map((line, i) => (
                <li key={i}>{inline(line.replace(/^- /, ''))}</li>
              ))}
            </ul>
          );
        return <p key={index}>{inline(block.replace(/^###? /, ''))}</p>;
      })}
    </div>
  );
}
