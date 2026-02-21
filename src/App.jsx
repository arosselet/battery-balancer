import { useState, useMemo, useCallback } from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────
const DEMO_S = 4;
const DEMO_P = 5;
const DEMO_DATA =
    '2501, 2480, 2550, 2390, 2410, 2455, 2510, 2495, 2420, 2580, 2370, 2440, 2525, 2460, 2395, 2505, 2475, 2430, 2540, 2400';
const NOMINAL_V = 3.7;

// ─── Algorithm ───────────────────────────────────────────────────────────────
function balanceCells(cells, seriesCount) {
    const sorted = [...cells].sort((a, b) => b - a);
    const buckets = Array.from({ length: seriesCount }, (_, i) => ({
        group: i + 1,
        cells: [],
        total: 0,
    }));

    for (const cap of sorted) {
        // Find bucket with lowest total
        let min = buckets[0];
        for (let i = 1; i < buckets.length; i++) {
            if (buckets[i].total < min.total) min = buckets[i];
        }
        min.cells.push(cap);
        min.total += cap;
    }

    const totals = buckets.map((b) => b.total);
    const maxCap = Math.max(...totals);
    const minCap = Math.min(...totals);

    return {
        groups: buckets,
        delta: maxCap - minCap,
        packCapacity: minCap,
        packVoltage: (seriesCount * NOMINAL_V).toFixed(1),
        maxGroupCap: maxCap,
        minGroupCap: minCap,
    };
}

// ─── Clipboard Export ────────────────────────────────────────────────────────
function buildExportText(result, s, p) {
    const lines = [
        `CELL BALANCER — PACK LAYOUT`,
        `Config: ${s}S${p}P  |  Voltage: ${result.packVoltage}V  |  Capacity: ${result.packCapacity} mAh  |  Δ: ${result.delta} mAh`,
        '─'.repeat(60),
    ];
    for (const g of result.groups) {
        lines.push(
            `Group ${g.group}:  [${g.cells.join(', ')}]  →  ${g.total} mAh`
        );
    }
    lines.push('─'.repeat(60));
    return lines.join('\n');
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Stat({ label, value, unit, variant = 'green' }) {
    const colorClass =
        variant === 'amber' ? 'readout-amber' : 'readout';
    return (
        <div className="panel-inset px-4 py-3">
            <div className="label-dim mb-1">{label}</div>
            <div className={`${colorClass} text-xl font-bold`}>
                {value}
                {unit && <span className="text-sm ml-1 opacity-60">{unit}</span>}
            </div>
        </div>
    );
}

function ResultsPanel({ result, s, p }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(buildExportText(result, s, p)).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [result, s, p]);

    return (
        <div className="mt-8 space-y-6">
            {/* ── Summary Dashboard ── */}
            <div>
                <h2 className="label-dim mb-3">Pack Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat label="Configuration" value={`${s}S${p}P`} />
                    <Stat label="Pack Voltage" value={result.packVoltage} unit="V" />
                    <Stat label="Pack Capacity" value={result.packCapacity} unit="mAh" />
                    <Stat
                        label="Max Δ"
                        value={result.delta}
                        unit="mAh"
                        variant={result.delta > 100 ? 'amber' : 'green'}
                    />
                </div>
            </div>

            {/* ── Group Grid ── */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="label-dim">Group Breakdown</h2>
                    <button onClick={handleCopy} className="btn-secondary text-xs">
                        {copied ? '✓ Copied' : '⎘ Copy Layout to Clipboard'}
                    </button>
                </div>
                <div className="panel-inset overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-panel-500 text-gray-500 uppercase text-xs tracking-wider">
                                <th className="text-left px-4 py-2.5 font-medium">Group</th>
                                <th className="text-left px-4 py-2.5 font-medium">Cells (mAh)</th>
                                <th className="text-right px-4 py-2.5 font-medium">Total</th>
                                <th className="text-right px-4 py-2.5 font-medium w-20">Δ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.groups.map((g, i) => {
                                const isMin = g.total === result.minGroupCap;
                                const isMax = g.total === result.maxGroupCap;
                                return (
                                    <tr
                                        key={g.group}
                                        className={`border-b border-panel-700/50 ${i % 2 === 0 ? 'bg-panel-800/50' : 'bg-panel-900/30'
                                            }`}
                                    >
                                        <td className="px-4 py-2.5 font-mono text-gray-400">
                                            S{g.group}
                                        </td>
                                        <td className="px-4 py-2.5 font-mono text-readout-green/80 text-xs">
                                            {g.cells.join('  ·  ')}
                                        </td>
                                        <td
                                            className={`px-4 py-2.5 font-mono text-right font-bold ${isMin
                                                    ? 'text-readout-amber'
                                                    : isMax
                                                        ? 'text-readout-green'
                                                        : 'text-gray-300'
                                                }`}
                                        >
                                            {g.total}
                                        </td>
                                        <td className="px-4 py-2.5 font-mono text-right text-gray-500 text-xs">
                                            {g.total === result.minGroupCap
                                                ? '▼ min'
                                                : g.total === result.maxGroupCap
                                                    ? '▲ max'
                                                    : `+${g.total - result.minGroupCap}`}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function AboutView() {
    return (
        <div className="max-w-3xl space-y-6 text-gray-400 leading-relaxed">
            <section>
                <h2 className="text-readout-amber font-mono text-sm font-bold uppercase tracking-widest mb-3">
                    The Problem
                </h2>
                <p>
                    When building packs from salvaged cells, mismatched parallel group
                    capacities cause the Battery Management System (BMS) to work
                    continuously to bleed off high groups. Worse, during deep discharge,
                    the lowest capacity group (C<sub>min</sub>) will hit the low-voltage
                    cutoff first, artificially limiting the entire pack's usable capacity
                    and accelerating cell degradation in that specific group.
                </p>
            </section>

            <section>
                <h2 className="text-readout-amber font-mono text-sm font-bold uppercase tracking-widest mb-3">
                    The Math
                </h2>
                <p>
                    Distributing mixed-capacity cells perfectly is a variation of the{' '}
                    <span className="text-gray-200 font-medium">
                        Multi-Way Number Partitioning
                    </span>{' '}
                    problem, which is NP-hard. Doing this via envelope math or
                    trial-and-error on the workbench is inefficient.
                </p>
            </section>

            <section>
                <h2 className="text-readout-amber font-mono text-sm font-bold uppercase tracking-widest mb-3">
                    The Solution
                </h2>
                <p className="mb-4">
                    This tool utilizes a{' '}
                    <span className="text-gray-200 font-medium">
                        greedy heuristic algorithm
                    </span>{' '}
                    to find a highly optimized distribution.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-300 font-mono text-sm pl-2">
                    <li>
                        It sorts all measured cell capacities in descending order.
                    </li>
                    <li>
                        It initializes <span className="text-readout-green">S</span> empty
                        groups.
                    </li>
                    <li>
                        It iterates through the sorted list, continually assigning the next
                        largest available cell to the group with the current lowest total
                        capacity.
                    </li>
                </ol>
                <p className="mt-4">
                    This ensures the tightest possible tolerance (
                    <span className="text-readout-green font-mono">Δ</span>) across all
                    series groups, maximizing pack lifespan and usable energy.
                </p>
            </section>
        </div>
    );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
    const [view, setView] = useState('tool'); // 'tool' | 'about'
    const [s, setS] = useState('');
    const [p, setP] = useState('');
    const [cellText, setCellText] = useState('');
    const [result, setResult] = useState(null);

    const sNum = parseInt(s, 10) || 0;
    const pNum = parseInt(p, 10) || 0;
    const required = sNum * pNum;

    const cells = useMemo(() => {
        if (!cellText.trim()) return [];
        return cellText
            .split(/[\s,]+/)
            .map((v) => parseFloat(v.trim()))
            .filter((v) => !isNaN(v) && v > 0);
    }, [cellText]);

    const provided = cells.length;
    const ready = provided === required && required > 0;

    const handleLoadDemo = () => {
        setS(String(DEMO_S));
        setP(String(DEMO_P));
        setCellText(DEMO_DATA);
        setResult(null);
    };

    const handleCalculate = () => {
        if (!ready) return;
        setResult(balanceCells(cells, sNum));
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* ── Header ── */}
            <header className="border-b border-panel-600 bg-panel-800/80">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-readout-green shadow-glow" />
                        <h1 className="font-mono text-sm font-bold text-gray-200 tracking-wide">
                            CELL BALANCER
                        </h1>
                    </div>
                    <nav className="flex rounded overflow-hidden border border-panel-500">
                        <button
                            onClick={() => setView('tool')}
                            className={`px-4 py-1.5 text-xs font-mono font-medium transition-colors ${view === 'tool'
                                    ? 'bg-readout-green/15 text-readout-green border-r border-panel-500'
                                    : 'bg-panel-700 text-gray-500 hover:text-gray-300 border-r border-panel-500'
                                }`}
                        >
                            Balancer Tool
                        </button>
                        <button
                            onClick={() => setView('about')}
                            className={`px-4 py-1.5 text-xs font-mono font-medium transition-colors ${view === 'about'
                                    ? 'bg-readout-green/15 text-readout-green'
                                    : 'bg-panel-700 text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            About / Algorithm
                        </button>
                    </nav>
                </div>
            </header>

            {/* ── Content ── */}
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
                {view === 'about' ? (
                    <AboutView />
                ) : (
                    <>
                        {/* ── Inputs ── */}
                        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
                            {/* Left column: S/P + Actions */}
                            <div className="space-y-4 md:w-64">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="series" className="label-dim block mb-1.5">
                                            Series (S)
                                        </label>
                                        <input
                                            id="series"
                                            type="number"
                                            min="1"
                                            value={s}
                                            onChange={(e) => {
                                                setS(e.target.value);
                                                setResult(null);
                                            }}
                                            placeholder="4"
                                            className="w-full panel-inset px-3 py-2 font-mono text-readout-green bg-panel-900 focus:outline-none focus:border-readout-green/50 text-lg"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="parallel" className="label-dim block mb-1.5">
                                            Parallel (P)
                                        </label>
                                        <input
                                            id="parallel"
                                            type="number"
                                            min="1"
                                            value={p}
                                            onChange={(e) => {
                                                setP(e.target.value);
                                                setResult(null);
                                            }}
                                            placeholder="5"
                                            className="w-full panel-inset px-3 py-2 font-mono text-readout-green bg-panel-900 focus:outline-none focus:border-readout-green/50 text-lg"
                                        />
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="panel-inset px-3 py-2 flex items-center justify-between">
                                    <span className="label-dim">Cells</span>
                                    <span
                                        className={`font-mono text-sm font-bold ${ready
                                                ? 'text-readout-green'
                                                : provided > required && required > 0
                                                    ? 'text-readout-red'
                                                    : 'text-readout-amber'
                                            }`}
                                    >
                                        {provided} / {required || '—'}
                                    </span>
                                </div>

                                {/* Actions */}
                                <button onClick={handleLoadDemo} className="btn-secondary w-full">
                                    ▸ Load Demo Data (4S5P)
                                </button>
                                <button
                                    onClick={handleCalculate}
                                    disabled={!ready}
                                    className="btn-primary w-full"
                                >
                                    Calculate Optimal Pack
                                </button>
                            </div>

                            {/* Right column: Textarea */}
                            <div>
                                <label htmlFor="cells" className="label-dim block mb-1.5">
                                    Cell Capacities (mAh)
                                </label>
                                <textarea
                                    id="cells"
                                    value={cellText}
                                    onChange={(e) => {
                                        setCellText(e.target.value);
                                        setResult(null);
                                    }}
                                    placeholder="Paste comma or newline separated values…&#10;e.g. 2501, 2480, 2550, 2390"
                                    className="w-full h-44 panel-inset px-3 py-2 font-mono text-sm text-readout-green bg-panel-900 resize-none focus:outline-none focus:border-readout-green/50 leading-relaxed"
                                />
                            </div>
                        </div>

                        {/* ── Results ── */}
                        {result && <ResultsPanel result={result} s={sNum} p={pNum} />}
                    </>
                )}
            </main>

            {/* ── Footer ── */}
            <footer className="border-t border-panel-700 py-3 text-center">
                <span className="text-xs text-gray-600 font-mono">
                    Greedy partition heuristic · No data leaves your browser
                </span>
            </footer>
        </div>
    );
}
