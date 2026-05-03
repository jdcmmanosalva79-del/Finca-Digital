export default function MiniChart({ data = [], color = '#2a7d6f', type = 'line' }) {
  const width = 80;
  const height = 32;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;

  if (type === 'bar') {
    const barWidth = (width / data.length) * 0.6;
    const gap = (width / data.length) * 0.4;
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ overflow: 'visible' }}>
        {data.map((v, i) => {
          const barH = ((v - min) / range) * (height - 4) + 4;
          const x = i * (barWidth + gap);
          return (
            <rect
              key={i}
              x={x}
              y={height - barH}
              width={barWidth}
              height={barH}
              rx="2"
              fill={color}
              opacity={0.8}
            />
          );
        })}
      </svg>
    );
  }

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const areaPoints = [
    `0,${height}`,
    ...points,
    `${width},${height}`,
  ].join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#grad-${color.replace('#', '')})`}
      />
      {/* Drop shadow trick for the line */}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(0, 2)"
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
