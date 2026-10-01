/** Keep every instruction, including introductory guidance and final packing notes. */
export function cookingSteps(content: string): string[] {
  return content
    .trim()
    .split(/\n(?=\d+\.\s)|\n\s*\n/)
    .map((part) => part.trim().replace(/^\d+\.\s/, ''))
    .filter(Boolean);
}

export function ingredientRows(content: string) {
  const lines = content.trim().split('\n');
  // Unfamiliar formats keep their original Markdown instead of losing information.
  if (!lines.every((line) => line.startsWith('|') && line.endsWith('|'))) return null;
  const rows = lines
    .filter((line) => !/^\|[\s:|-]+$/.test(line))
    .slice(1)
    .map((line) =>
      line
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim()),
    );
  if (rows.some((row) => row.length !== 3)) return null;
  return rows.map(([name, amount, prep]) => ({ name: name!, amount: amount!, prep: prep! }));
}
