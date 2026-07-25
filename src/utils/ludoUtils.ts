export function getGlobalCircuitPos(color: 'red' | 'green' | 'yellow' | 'blue', localPos: number): number | null {
  if (localPos < 1 || localPos > 52) return null;
  const offsets: Record<string, number> = { red: 0, green: 13, yellow: 26, blue: 39 };
  const offset = offsets[color] ?? 0;
  return ((localPos - 1 + offset) % 52) + 1;
}
