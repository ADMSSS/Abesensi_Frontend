const N = 25;

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function inFinder(x: number, y: number) {
  const zones = [
    [0, 0],
    [N - 7, 0],
    [0, N - 7],
  ];
  return zones.some(([zx, zy]) => x >= zx - 1 && x <= zx + 7 && y >= zy - 1 && y <= zy + 7);
}

function finderOn(x: number, y: number) {
  const zones = [
    [0, 0],
    [N - 7, 0],
    [0, N - 7],
  ];
  for (const [zx, zy] of zones) {
    const dx = x - zx;
    const dy = y - zy;
    if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) {
      const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
      return ring !== 2;
    }
  }
  return false;
}

export function QrCode({ value, size = 220 }: { value: string; size?: number }) {
  const rand = rng(hash(value));
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (inFinder(x, y)) {
        if (finderOn(x, y)) cells.push({ x, y });
      } else if (rand() > 0.52) {
        cells.push({ x, y });
      }
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`-2 -2 ${N + 4} ${N + 4}`}
      role="img"
      aria-label="Kode QR absensi HadirIn"
      shapeRendering="crispEdges"
      className="bg-white"
    >
      {cells.map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill="#111611" />
      ))}
    </svg>
  );
}
