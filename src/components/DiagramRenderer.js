import React from 'react';

// ── Venn Diagram ──────────────────────────────────────────────────────────────
const VennSVG = ({ diagram }) => {
  const { sets = [], regions = {} } = diagram;
  const W = 280, H = 180, r = 65;
  const cy = 115;
  const cx1 = W / 2 - 32; // 108
  const cx2 = W / 2 + 32; // 172
  // Midpoints of A-only, intersection, B-only x-regions
  const xA = W / 2 - r;   // 75
  const xM = W / 2;        // 140
  const xB = W / 2 + r;   // 205

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W }}>
      <circle cx={cx1} cy={cy} r={r} fill="rgba(59,130,246,0.18)" stroke="rgb(59,130,246)" strokeWidth="2" />
      <circle cx={cx2} cy={cy} r={r} fill="rgba(239,68,68,0.18)" stroke="rgb(239,68,68)" strokeWidth="2" />
      {sets[0] && (
        <text x={cx1} y={cy - r - 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="rgb(29,78,216)">
          {sets[0]}
        </text>
      )}
      {sets[1] && (
        <text x={cx2} y={cy - r - 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="rgb(185,28,28)">
          {sets[1]}
        </text>
      )}
      {regions.A_only != null && (
        <text x={xA} y={cy + 7} textAnchor="middle" fontSize="22" fontWeight="700" fill="rgb(29,78,216)">
          {regions.A_only}
        </text>
      )}
      {regions.intersection != null && (
        <text x={xM} y={cy + 7} textAnchor="middle" fontSize="22" fontWeight="700" fill="rgb(55,65,81)">
          {regions.intersection}
        </text>
      )}
      {regions.B_only != null && (
        <text x={xB} y={cy + 7} textAnchor="middle" fontSize="22" fontWeight="700" fill="rgb(185,28,28)">
          {regions.B_only}
        </text>
      )}
    </svg>
  );
};

// ── Bar Chart ─────────────────────────────────────────────────────────────────
const BarChartSVG = ({ diagram }) => {
  const { x_labels = [], values = [], title, y_label, x_label } = diagram;
  if (!values.length) return null;

  const W = 320, H = 220;
  const padT = title ? 30 : 15;
  const padB = x_label ? 52 : 38;
  const padL = y_label ? 46 : 36;
  const padR = 15;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const maxVal = Math.max(...values, 1);
  const n = values.length;
  const barW = Math.min(44, (cW / n) * 0.55);
  const step = cW / n;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W }}>
      {title && (
        <text x={W / 2} y={18} textAnchor="middle" fontSize="12" fontWeight="600" fill="#374151">{title}</text>
      )}
      {/* Axes */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + cH} stroke="#9CA3AF" strokeWidth="1.5" />
      <line x1={padL} y1={padT + cH} x2={padL + cW} y2={padT + cH} stroke="#9CA3AF" strokeWidth="1.5" />
      {/* Axis tick labels */}
      <text x={padL - 4} y={padT + cH + 1} textAnchor="end" fontSize="9" fill="#9CA3AF">0</text>
      <text x={padL - 4} y={padT + 6} textAnchor="end" fontSize="9" fill="#9CA3AF">{maxVal}</text>
      {/* Y-axis label */}
      {y_label && (
        <text transform={`translate(12, ${padT + cH / 2}) rotate(-90)`} textAnchor="middle" fontSize="10" fill="#6B7280">
          {y_label}
        </text>
      )}
      {/* X-axis label */}
      {x_label && (
        <text x={padL + cW / 2} y={H - 5} textAnchor="middle" fontSize="10" fill="#6B7280">{x_label}</text>
      )}
      {/* Bars */}
      {values.map((val, i) => {
        const barH = Math.max(2, (val / maxVal) * cH);
        const x = padL + i * step + (step - barW) / 2;
        const y = padT + cH - barH;
        const lx = x + barW / 2;
        const ly = padT + cH + (n > 5 ? 12 : 16);
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill="rgb(59,130,246)" rx="2" />
            <text x={lx} y={Math.max(y - 3, padT + 10)} textAnchor="middle" fontSize="10" fill="#374151">{val}</text>
            {n > 6 ? (
              <text x={lx} y={ly} textAnchor="end" fontSize="9" fill="#6B7280" transform={`rotate(-38, ${lx}, ${ly})`}>
                {x_labels[i] ?? ''}
              </text>
            ) : (
              <text x={lx} y={ly} textAnchor="middle" fontSize="9" fill="#6B7280">{x_labels[i] ?? ''}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ── Line Graph ────────────────────────────────────────────────────────────────
const LineGraphSVG = ({ diagram }) => {
  const { series = [], title, x_label, y_label } = diagram;
  const allPts = series.flatMap(s => s.points || []);
  if (!allPts.length) return null;

  const W = 320, H = 220;
  const padT = title ? 30 : 15;
  const padB = x_label ? 50 : 36;
  const padL = y_label ? 46 : 36;
  const padR = 15;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  const xs = allPts.map(p => Number(p.x));
  const ys = allPts.map(p => Number(p.y));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rX = maxX - minX || 1, rY = maxY - minY || 1;
  const sx = x => padL + ((x - minX) / rX) * cW;
  const sy = y => padT + cH - ((y - minY) / rY) * cH;
  const COLORS = ['rgb(59,130,246)', 'rgb(239,68,68)', 'rgb(16,185,129)', 'rgb(245,158,11)'];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W }}>
      {title && (
        <text x={W / 2} y={18} textAnchor="middle" fontSize="12" fontWeight="600" fill="#374151">{title}</text>
      )}
      {/* Axes */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + cH} stroke="#9CA3AF" strokeWidth="1.5" />
      <line x1={padL} y1={padT + cH} x2={padL + cW} y2={padT + cH} stroke="#9CA3AF" strokeWidth="1.5" />
      {/* Tick labels */}
      <text x={padL - 4} y={padT + cH + 4} textAnchor="end" fontSize="9" fill="#9CA3AF">{minX}</text>
      <text x={padL + cW} y={padT + cH + 10} textAnchor="middle" fontSize="9" fill="#9CA3AF">{maxX}</text>
      <text x={padL - 4} y={padT + cH} textAnchor="end" fontSize="9" fill="#9CA3AF">{minY}</text>
      <text x={padL - 4} y={padT + 6} textAnchor="end" fontSize="9" fill="#9CA3AF">{maxY}</text>
      {/* Axis labels */}
      {y_label && (
        <text transform={`translate(12, ${padT + cH / 2}) rotate(-90)`} textAnchor="middle" fontSize="10" fill="#6B7280">
          {y_label}
        </text>
      )}
      {x_label && (
        <text x={padL + cW / 2} y={H - 5} textAnchor="middle" fontSize="10" fill="#6B7280">{x_label}</text>
      )}
      {/* Series lines and dots */}
      {series.map((s, si) => {
        const pts = (s.points || []).slice().sort((a, b) => Number(a.x) - Number(b.x));
        if (!pts.length) return null;
        const color = COLORS[si % COLORS.length];
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`).join(' ');
        return (
          <g key={si}>
            <path d={d} fill="none" stroke={color} strokeWidth="2" />
            {pts.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="3.5" fill={color} />)}
          </g>
        );
      })}
      {/* Series legend */}
      {series.length > 1 && series.map((s, si) => (
        <g key={`leg${si}`}>
          <rect x={padL + si * 80} y={padT + cH + 20} width="10" height="10" fill={COLORS[si % COLORS.length]} rx="2" />
          <text x={padL + si * 80 + 14} y={padT + cH + 29} fontSize="9" fill="#374151">{s.label}</text>
        </g>
      ))}
    </svg>
  );
};

// ── Geometry ──────────────────────────────────────────────────────────────────
const GeometrySVG = ({ diagram }) => {
  const { points = [], lines = [], measurements = [], description } = diagram;
  if (!points.length) return null;

  const W = 240, H = 210, pad = 38;
  const xs = points.map(p => Number(p.x));
  const ys = points.map(p => Number(p.y));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rX = maxX - minX || 1, rY = maxY - minY || 1;
  const scale = Math.min((W - 2 * pad) / rX, (H - 2 * pad) / rY);
  const svgX = x => pad + (x - minX) * scale;
  const svgY = y => H - pad - (y - minY) * scale;
  const ptMap = Object.fromEntries(points.map(p => [p.label, p]));

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W }}>
      {description && (
        <text x={W / 2} y={13} textAnchor="middle" fontSize="10" fill="#6B7280">{description}</text>
      )}
      {/* Lines */}
      {lines.map((ln, i) => {
        const a = ptMap[ln[0]], b = ptMap[ln[1]];
        if (!a || !b) return null;
        return (
          <line key={i}
            x1={svgX(a.x)} y1={svgY(a.y)}
            x2={svgX(b.x)} y2={svgY(b.y)}
            stroke="#1F2937" strokeWidth="2"
          />
        );
      })}
      {/* Measurement labels on line midpoints */}
      {measurements.map((m, i) => {
        const seg = Array.isArray(m.segment) ? m.segment : [];
        const a = ptMap[seg[0]], b = ptMap[seg[1]];
        if (!a || !b) return null;
        const mx = (svgX(a.x) + svgX(b.x)) / 2;
        const my = (svgY(a.y) + svgY(b.y)) / 2;
        return <text key={i} x={mx + 5} y={my - 3} fontSize="10" fill="#6B7280">{m.value}</text>;
      })}
      {/* Points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={svgX(p.x)} cy={svgY(p.y)} r="3.5" fill="#374151" />
          <text x={svgX(p.x) + 7} y={svgY(p.y) - 5} fontSize="12" fontWeight="700" fill="#111827">{p.label}</text>
        </g>
      ))}
    </svg>
  );
};

// ── Number Line ───────────────────────────────────────────────────────────────
const NumberLineSVG = ({ diagram }) => {
  const { min = 0, max = 10, marked_values = [], intervals } = diagram;
  const W = 300, H = 72, padX = 28, lineY = 38;
  const lineW = W - 2 * padX;
  const range = max - min || 1;
  const toX = v => padX + ((v - min) / range) * lineW;

  const ticks = [];
  if (intervals && intervals > 0) {
    for (let v = min; v <= max + intervals * 0.01; v += intervals) {
      ticks.push(Math.round(v * 1000) / 1000);
    }
  } else {
    ticks.push(min, (min + max) / 2, max);
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W }}>
      <line x1={padX} y1={lineY} x2={padX + lineW} y2={lineY} stroke="#374151" strokeWidth="2.5" />
      {/* Arrowhead */}
      <polygon
        points={`${padX + lineW},${lineY} ${padX + lineW - 9},${lineY - 4} ${padX + lineW - 9},${lineY + 4}`}
        fill="#374151"
      />
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={toX(v)} y1={lineY - 6} x2={toX(v)} y2={lineY + 6} stroke="#374151" strokeWidth="1.5" />
          <text x={toX(v)} y={lineY + 20} textAnchor="middle" fontSize="11" fill="#374151">{v}</text>
        </g>
      ))}
      {marked_values.map((v, i) => (
        <g key={`m${i}`}>
          <circle cx={toX(v)} cy={lineY} r="6" fill="rgb(239,68,68)" />
          <text x={toX(v)} y={lineY - 12} textAnchor="middle" fontSize="11" fontWeight="700" fill="rgb(185,28,28)">{v}</text>
        </g>
      ))}
    </svg>
  );
};

// ── Table ─────────────────────────────────────────────────────────────────────
const TableDisplay = ({ diagram }) => (
  <div className="overflow-x-auto">
    {diagram.caption && <p className="text-xs text-gray-500 mb-1 italic">{diagram.caption}</p>}
    <table className="border-collapse border border-gray-400 text-sm">
      {diagram.headers && diagram.headers.length > 0 && (
        <thead>
          <tr>
            {diagram.headers.map((h, i) => (
              <th key={i} className="border border-gray-400 bg-gray-100 px-3 py-1 font-medium text-left">{h}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {(diagram.rows || []).map((row, i) => (
          <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
            {row.map((cell, j) => (
              <td key={j} className="border border-gray-400 px-3 py-1">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── Main Renderer ─────────────────────────────────────────────────────────────
const DiagramRenderer = ({ diagram, className = '' }) => {
  const [imgError, setImgError] = React.useState(false);
  if (!diagram) return null;

  const { type } = diagram;

  const wrap = (children) => (
    <div className={`my-3 ${className}`}>
      {type !== 'table' && diagram.caption && (
        <p className="text-xs text-gray-500 mb-1 italic">{diagram.caption}</p>
      )}
      {children}
    </div>
  );

  switch (type) {
    case 'image':
      return wrap(
        imgError ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-center text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>{diagram.caption || 'Image could not be loaded'}</p>
          </div>
        ) : (
          <img
            src={diagram.content}
            alt={diagram.caption || 'Diagram'}
            loading="lazy"
            className="max-w-full border rounded shadow-sm"
            style={{ height: 'auto', maxHeight: '480px', objectFit: 'contain', display: 'block' }}
            onError={() => setImgError(true)}
          />
        )
      );
    case 'venn_diagram':
      return wrap(<VennSVG diagram={diagram} />);
    case 'bar_chart':
      return wrap(<BarChartSVG diagram={diagram} />);
    case 'line_graph':
      return wrap(<LineGraphSVG diagram={diagram} />);
    case 'geometry':
      if (diagram.points && diagram.points.length > 0) {
        return wrap(<GeometrySVG diagram={diagram} />);
      }
      // No coordinate data — show description and measurements as text
      return wrap(
        <div className="bg-gray-50 border rounded-lg p-3 text-sm">
          <p className="font-medium text-gray-700 mb-1">Geometry</p>
          {diagram.description && <p className="text-gray-600 mb-1">{diagram.description}</p>}
          {(diagram.measurements || []).map((m, i) => (
            <p key={i} className="text-xs text-gray-500">
              {Array.isArray(m.segment) ? m.segment.join('') : m.segment}: {m.value}
            </p>
          ))}
          {(diagram.angles || []).map((a, i) => (
            <p key={i} className="text-xs text-gray-500">
              Angle at {a.at}: {a.degrees != null ? `${a.degrees}°` : 'unknown'}
            </p>
          ))}
        </div>
      );
    case 'table':
      return wrap(<TableDisplay diagram={diagram} />);
    case 'number_line':
      return wrap(<NumberLineSVG diagram={diagram} />);
    default:
      return wrap(
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          <p className="font-medium text-yellow-800">Diagram ({type})</p>
          <p className="text-yellow-700 text-xs mt-1">Diagram data captured — visual rendering not yet supported for this type.</p>
        </div>
      );
  }
};

export default DiagramRenderer;
