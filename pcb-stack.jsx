(function () {
  'use strict';

  const { useState, useMemo, useEffect, useRef } = React;
  const { CATS, SYSTEMS, ROW_Y, COL_X } = window.PCB;

  // ── Canvas geometry ──────────────────────────────────────────────────────────
  const W = 1500, H = 1080;
  const CHIP_CX = 750,  CHIP_CY    = 540;
  const CHIP_W  = 300,  CHIP_H     = 320;
  const CHIP_FRAME = 14;
  const CHIP_LEFT   = CHIP_CX - CHIP_W / 2;   // 600
  const CHIP_TOP    = CHIP_CY - CHIP_H / 2;   // 380
  const CHIP_RIGHT  = CHIP_CX + CHIP_W / 2;   // 900
  const CHIP_BOTTOM = CHIP_CY + CHIP_H / 2;   // 700
  const PILL_H = 64;
  const PIN_N  = 7;

  // ── Geometry helpers ─────────────────────────────────────────────────────────
  function pillWidth(name) {
    return Math.max(184, Math.min(308, 82 + name.length * 10.8));
  }

  function chipPin(row, col) {
    if (row === 0) {
      return { x: CHIP_LEFT + (col + 0.5) / 4 * CHIP_W, y: CHIP_TOP,    side: 'top' };
    }
    if (row === 3) {
      return { x: CHIP_LEFT + (col + 0.5) / 4 * CHIP_W, y: CHIP_BOTTOM, side: 'bottom' };
    }
    if (col <= 1) {
      const idx = (row - 1) * 2 + col;
      return { x: CHIP_LEFT,  y: CHIP_TOP + (idx + 0.5) / 4 * CHIP_H, side: 'left' };
    }
    const idx = (row - 1) * 2 + (col - 2);
    return { x: CHIP_RIGHT, y: CHIP_TOP + (idx + 0.5) / 4 * CHIP_H, side: 'right' };
  }

  function pillExit(cx, cy, pw, pin) {
    switch (pin.side) {
      case 'top':    return { x: cx,          y: cy + PILL_H / 2 };
      case 'bottom': return { x: cx,          y: cy - PILL_H / 2 };
      case 'left':   return { x: cx + pw / 2, y: cy };
      default:       return { x: cx - pw / 2, y: cy };
    }
  }

  function buildPath(exit, pin, col) {
    const { x: ex, y: ey } = exit;
    const { x: px, y: py, side } = pin;

    if (side === 'top') {
      const ry = ey + 36 + col * 14;
      return {
        d: `M ${ex} ${ey} L ${ex} ${ry} L ${px} ${ry} L ${px} ${py}`,
        bends: [{ x: ex, y: ry }, { x: px, y: ry }],
      };
    }
    if (side === 'bottom') {
      const ry = ey - 36 - col * 14;
      return {
        d: `M ${ex} ${ey} L ${ex} ${ry} L ${px} ${ry} L ${px} ${py}`,
        bends: [{ x: ex, y: ry }, { x: px, y: ry }],
      };
    }
    if (side === 'left') {
      const gap = Math.abs(ex - px);
      let rx = ex + Math.max(34, gap * 0.4) + col * 14;
      rx = Math.min(rx, CHIP_LEFT - 28);
      return {
        d: `M ${ex} ${ey} L ${rx} ${ey} L ${rx} ${py} L ${px} ${py}`,
        bends: [{ x: rx, y: ey }, { x: rx, y: py }],
      };
    }
    // right
    const gap = Math.abs(ex - px);
    let rx = ex - Math.max(34, gap * 0.4) - (col - 2) * 14;
    rx = Math.max(rx, CHIP_RIGHT + 28);
    return {
      d: `M ${ex} ${ey} L ${rx} ${ey} L ${rx} ${py} L ${px} ${py}`,
      bends: [{ x: rx, y: ey }, { x: rx, y: py }],
    };
  }

  // ── ChipPins ─────────────────────────────────────────────────────────────────
  function ChipPins() {
    const sides = ['top', 'bottom', 'left', 'right'];
    return (
      <>
        {sides.flatMap((side) =>
          Array.from({ length: PIN_N }, (_, i) => {
            const t = (i + 0.5) / PIN_N;
            const isVert = side === 'top' || side === 'bottom';
            const pw = isVert ? 6 : 14;
            const ph = isVert ? 14 : 6;
            let left, top;
            if (side === 'top') {
              left = CHIP_FRAME + t * (CHIP_W - 2 * CHIP_FRAME) - pw / 2;
              top  = 0;
            } else if (side === 'bottom') {
              left = CHIP_FRAME + t * (CHIP_W - 2 * CHIP_FRAME) - pw / 2;
              top  = CHIP_H - ph;
            } else if (side === 'left') {
              left = 0;
              top  = CHIP_FRAME + t * (CHIP_H - 2 * CHIP_FRAME) - ph / 2;
            } else {
              left = CHIP_W - pw;
              top  = CHIP_FRAME + t * (CHIP_H - 2 * CHIP_FRAME) - ph / 2;
            }
            return (
              <div
                key={`${side}-${i}`}
                style={{
                  position: 'absolute', left, top,
                  width: pw, height: ph,
                  background: 'rgba(180,210,255,0.55)',
                  borderRadius: 2,
                  boxShadow: '0 0 6px rgba(245,166,35,0.6)',
                }}
              />
            );
          })
        )}
      </>
    );
  }

  // ── Chip ──────────────────────────────────────────────────────────────────────
  function Chip() {
    return (
      <div style={{
        position: 'absolute',
        left: CHIP_LEFT, top: CHIP_TOP,
        width: CHIP_W,   height: CHIP_H,
      }}>
        <ChipPins />
        <div style={{
          position: 'absolute',
          top: CHIP_FRAME, left: CHIP_FRAME, right: CHIP_FRAME, bottom: CHIP_FRAME,
          borderRadius: 18,
          background: 'linear-gradient(160deg, #1f4790 0%, #15356d 55%, #0e2a5c 100%)',
          boxShadow: '0 0 0 1.5px rgba(245,166,35,0.85), 0 0 80px rgba(245,166,35,0.35), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -20px 40px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Grid decoration */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)',
            backgroundSize: '20px 20px',
          }} />

          {/* Notch */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 36, height: 6, background: '#F5A623', borderRadius: '0 0 6px 6px',
          }} />

          {/* Top-left dots */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F5A623', boxShadow: '0 0 6px #F5A623' }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
          </div>

          {/* Version */}
          <div style={{
            position: 'absolute', top: 10, right: 12,
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
            color: 'rgba(255,255,255,0.5)',
          }}>v.2026</div>

          {/* Center content */}
          <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
            <div style={{
              fontFamily: "'Inter','Montserrat',sans-serif", fontWeight: 800,
              fontSize: 72, color: '#fff',
              letterSpacing: '0.045em', lineHeight: 0.88,
              textShadow: '0 2px 14px rgba(0,0,0,0.5)',
            }}>CIAF</div>

            <div style={{
              marginTop: 16,
              fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
              color: '#F5A623', letterSpacing: '3.5px',
            }}>HUB · INTEGRACIÓN</div>

            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.14)',
              marginTop: 12, paddingTop: 12,
            }}>
              <div style={{
                fontFamily: "'Inter','Montserrat',sans-serif",
                fontWeight: 400, fontSize: 12,
                color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.5, maxWidth: 220, margin: '0 auto',
              }}>Un cerebro para<br/>toda tu operación</div>
            </div>
          </div>

          {/* Serial */}
          <div style={{
            position: 'absolute', bottom: 10,
            fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5,
            color: 'rgba(255,255,255,0.35)', letterSpacing: 1,
          }}>◆ CIAF-CORE / 16CH ◆</div>
        </div>
      </div>
    );
  }

  // ── Pill ──────────────────────────────────────────────────────────────────────
  function Pill({ pill, active, hovered, onMouseEnter, onMouseLeave }) {
    const { name, mark, sub, catData, cx, cy, pw } = pill;
    const oneChar = mark.length === 1;
    return (
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          position: 'absolute',
          left: cx - pw / 2, top: cy - PILL_H / 2,
          width: pw, height: PILL_H,
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '6px 12px 6px 6px',
          background: '#fbfcfe', borderRadius: 999,
          border: `1.5px solid ${catData.color}55`,
          boxShadow: hovered
            ? '0 10px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.1)'
            : '0 6px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)',
          opacity: active ? 1 : 0.35,
          filter: active ? 'none' : 'saturate(0.6)',
          transform: hovered ? 'translateY(-2px)' : 'none',
          transition: 'all 0.25s cubic-bezier(.22,.61,.36,1)',
          cursor: 'default', zIndex: hovered ? 10 : 1,
          boxSizing: 'border-box',
        }}
      >
        {/* Mark */}
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: catData.color, color: '#0a1628',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Inter','Montserrat',sans-serif", fontWeight: 800,
          fontSize: oneChar ? 17 : 14,
          boxShadow: `inset 0 0 0 1.5px rgba(0,0,0,0.08), 0 2px 6px ${catData.color}55`,
          transform: hovered ? 'scale(1.06) rotate(-3deg)' : 'none',
          transition: 'transform 0.25s cubic-bezier(.22,.61,.36,1)',
          userSelect: 'none',
        }}>{mark}</div>

        {/* Text */}
        <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: "'Inter','Montserrat',sans-serif", fontWeight: 700,
            fontSize: 13.5, color: '#0a1628',
            letterSpacing: 0.3, textTransform: 'uppercase',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            lineHeight: 1.2,
          }}>{name}</div>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5,
            textTransform: 'uppercase', color: catData.dim,
            letterSpacing: 1, marginTop: 3, lineHeight: 1.2,
          }}>{sub}</div>
        </div>
      </div>
    );
  }

  // ── Trace ─────────────────────────────────────────────────────────────────────
  function Trace({ pill, traceActive, colorMode, showVias, animateTraces, packetDelay, pulseDelay }) {
    const { pathD, bends, exit, pin, catData } = pill;
    const color = colorMode === 'category' ? catData.color : '#6B8FB8';

    return (
      <g>
        <path
          d={pathD}
          stroke={color}
          strokeWidth={traceActive ? 1.6 : 1.1}
          strokeOpacity={traceActive ? 0.9 : 0.32}
          strokeLinecap="round" strokeLinejoin="round" fill="none"
          style={!traceActive ? { animation: `pcb-pulse-trace 2.4s ${pulseDelay}s infinite` } : undefined}
        />

        {/* Exit via — hollow ring */}
        <circle cx={exit.x} cy={exit.y} r={3.5}
          fill="#07101f" stroke={color} strokeWidth={1.2} />

        {/* Pin via */}
        <circle cx={pin.x} cy={pin.y} r={3} fill={color} />

        {/* Bend vias */}
        {showVias && bends.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={1.5} fill={color} opacity={0.35} />
        ))}

        {/* Animated packet */}
        {animateTraces && (
          <circle r={3} fill={color}>
            <animateMotion
              dur="3.6s"
              begin={`${packetDelay}s`}
              repeatCount="indefinite"
              path={pathD}
              rotate="auto"
            />
            <animate
              attributeName="opacity"
              dur="3.6s"
              begin={`${packetDelay}s`}
              repeatCount="indefinite"
              values="0;0;1;1;0;0"
              keyTimes="0;0.05;0.1;0.9;0.95;1"
            />
          </circle>
        )}
      </g>
    );
  }

  // ── PCBGrid ───────────────────────────────────────────────────────────────────
  function PCBGrid() {
    return (
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
    );
  }

  // ── SectionHeader ─────────────────────────────────────────────────────────────
  function SectionHeader() {
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        flexWrap: 'wrap', gap: 24, marginBottom: 20,
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#1E4FB8', borderRadius: 999, padding: '6px 12px', marginBottom: 14,
          }}>
            <span style={{ display: 'inline-block', width: 14, height: 2, background: '#fff', borderRadius: 1 }} />
            <span style={{
              fontFamily: "'Inter','Montserrat',sans-serif", fontWeight: 700,
              fontSize: 11, color: '#fff', letterSpacing: '1.5px', textTransform: 'uppercase',
            }}>STACK / 16</span>
          </div>

          <h2 style={{
            fontFamily: "'Inter','Montserrat',sans-serif", fontWeight: 800,
            fontSize: 44, textTransform: 'uppercase',
            lineHeight: 0.95, letterSpacing: '-0.025em',
            color: '#e7ecf3', margin: '0 0 16px',
          }}>OPERAMOS<br />SOBRE TU STACK.</h2>

          <p style={{
            fontFamily: "'Inter','Open Sans',sans-serif", fontWeight: 400,
            fontSize: 13.5, color: '#8FA0B8', maxWidth: 520,
            margin: 0, lineHeight: 1.6,
          }}>
            Trabajamos directamente sobre los sistemas que ya usás, o te ayudamos a elegir e implementar el correcto.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 500,
            fontSize: 10.5, letterSpacing: '2px', color: '#5C7595',
            textTransform: 'uppercase', marginBottom: 6,
          }}>// INTEGRACIONES ACTIVAS</div>
          <div style={{
            fontFamily: "'Inter','Montserrat',sans-serif", fontWeight: 700,
            fontSize: 18, textTransform: 'uppercase', color: '#fff', marginBottom: 4,
          }}>16 SISTEMAS CONECTADOS</div>
          <div style={{
            fontFamily: "'Inter','Open Sans',sans-serif",
            fontWeight: 500, fontSize: 12, color: '#8FA0B8',
          }}>6 industrias · 1 capa de integración</div>
        </div>
      </div>
    );
  }

  // ── CategoryLegend ────────────────────────────────────────────────────────────
  function CategoryLegend({ hoveredCat, setHoveredCat }) {
    return (
      <div style={{
        borderTop: '1px dashed rgba(255,255,255,0.08)',
        paddingTop: 18, marginBottom: 24,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
          color: '#5C7595', letterSpacing: '2px', textTransform: 'uppercase',
          marginRight: 12, verticalAlign: 'middle',
        }}>// CATEGORÍAS</span>
        <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {Object.entries(CATS).map(([key, cat]) => (
            <button
              key={key}
              onMouseEnter={() => setHoveredCat(key)}
              onMouseLeave={() => setHoveredCat(null)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                borderRadius: 999, padding: '7px 14px',
                background: hoveredCat === key ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${hoveredCat === key ? cat.color + '66' : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer',
                fontFamily: "'Inter','Montserrat',sans-serif", fontWeight: 600,
                fontSize: 11, textTransform: 'uppercase', color: '#e7ecf3',
                letterSpacing: 0.5, transition: 'all 0.2s ease',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: cat.color, boxShadow: `0 0 10px ${cat.color}80`,
                flexShrink: 0, display: 'inline-block',
              }} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── StatusFooter ──────────────────────────────────────────────────────────────
  function StatusFooter() {
    return (
      <div style={{
        borderTop: '1px dashed rgba(255,255,255,0.08)',
        paddingTop: 18, marginTop: 20,
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 12,
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 11, letterSpacing: '1.4px', color: '#5C7595',
        textTransform: 'uppercase',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#5EE3A0', display: 'inline-block',
            animation: 'pcb-pulse-glow 1.6s infinite',
          }} />
          <span>UPLINK ONLINE</span>
          <span style={{ opacity: 0.6 }}>// 16 CANALES · DATA SYNC RT</span>
        </div>
        <div>CIAF.IO/STACK · 2026</div>
      </div>
    );
  }

  // ── PCBStack (main) ───────────────────────────────────────────────────────────
  function PCBStack() {
    const [hoveredCat,    setHoveredCat]    = useState(null);
    const [hoveredSystem, setHoveredSystem] = useState(null);

    const outerRef = useRef(null);
    const [scale,  setScale]  = useState(1);

    useEffect(() => {
      const el = outerRef.current;
      if (!el) return;
      const update = (w) => setScale(w / W);
      const ro = new ResizeObserver(entries => update(entries[0].contentRect.width));
      ro.observe(el);
      update(el.clientWidth);
      return () => ro.disconnect();
    }, []);

    const pills = useMemo(() => SYSTEMS.map(sys => {
      const catData = CATS[sys.cat];
      const cx  = COL_X[sys.col];
      const cy  = ROW_Y[sys.row];
      const pw  = pillWidth(sys.name);
      const pin = chipPin(sys.row, sys.col);
      const exit = pillExit(cx, cy, pw, pin);
      const { d: pathD, bends } = buildPath(exit, pin, sys.col);
      return { ...sys, catData, cx, cy, pw, pin, exit, pathD, bends };
    }), []);

    return (
      <div style={{ fontFamily: "'Inter',sans-serif" }}>
        <style>{`
          @keyframes pcb-pulse-trace {
            0%, 100% { stroke-opacity: 0.22; }
            50%      { stroke-opacity: 0.70; }
          }
          @keyframes pcb-pulse-glow {
            0%, 100% { opacity: 0.4; transform: scale(1);    }
            50%      { opacity: 0.9; transform: scale(1.15); }
          }
        `}</style>

        <SectionHeader />
        <CategoryLegend hoveredCat={hoveredCat} setHoveredCat={setHoveredCat} />

        {/* Responsive canvas wrapper — height adjusts to prevent ghost space */}
        <div ref={outerRef} style={{ width: '100%', position: 'relative', height: H * scale, overflow: 'hidden' }}>
          <div style={{
            width: W, height: H,
            position: 'absolute', top: 0, left: 0,
            transformOrigin: '0 0',
            transform: `scale(${scale})`,
            background: 'radial-gradient(ellipse at 50% 55%, #112849 0%, #07101f 65%)',
          }}>
            <PCBGrid />

            {/* SVG layer: chip glow + all traces */}
            <svg
              width={W} height={H}
              viewBox={`0 0 ${W} ${H}`}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            >
              <defs>
                <radialGradient id="pcbChipGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="rgba(245,166,35,0.45)" />
                  <stop offset="60%"  stopColor="rgba(245,166,35,0.08)" />
                  <stop offset="100%" stopColor="rgba(245,166,35,0)"    />
                </radialGradient>
              </defs>
              <ellipse cx={CHIP_CX} cy={CHIP_CY} rx={420} ry={360} fill="url(#pcbChipGlow)" />

              {pills.map((p) => {
                const traceActive =
                  hoveredSystem === p.name ||
                  (hoveredCat !== null && p.cat === hoveredCat);
                return (
                  <Trace
                    key={p.name}
                    pill={p}
                    traceActive={traceActive}
                    colorMode="category"
                    showVias={true}
                    animateTraces={true}
                    packetDelay={(p.row * 4 + p.col) * 0.45}
                    pulseDelay={(p.row + p.col) * 0.4}
                  />
                );
              })}
            </svg>

            <Chip />

            {pills.map((p) => (
              <Pill
                key={p.name}
                pill={p}
                active={hoveredCat === null || p.cat === hoveredCat}
                hovered={hoveredSystem === p.name}
                onMouseEnter={() => setHoveredSystem(p.name)}
                onMouseLeave={() => setHoveredSystem(null)}
              />
            ))}
          </div>
        </div>

        <StatusFooter />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('pcb-root')).render(<PCBStack />);
})();
