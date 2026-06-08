"use client";
import { useState, useCallback } from "react";

type ApiMode = "written" | "spoken";

interface ApiDef {
  code: string;
  label: string;
  desc: string;
  mode: ApiMode[];
  color: string;
}

interface ResultState {
  status: number | null;
  data: Record<string, unknown> | null;
  error: string | null;
  elapsed: number | null;
}

const APIS: ApiDef[] = [
  { code: "morp",     label: "형태소 분석",    desc: "명사·동사·조사 등 형태소 단위로 분석합니다.",              mode: ["written", "spoken"], color: "#2563eb" },
  { code: "ner",      label: "개체명 인식",    desc: "인명·지명·기관명 등 고유 개체를 인식하고 태깅합니다.",      mode: ["written", "spoken"], color: "#059669" },
  { code: "wsd",      label: "동음이의어 분석", desc: "문맥을 이용해 동음이의어의 의미를 판별합니다.",            mode: ["written"],           color: "#7c3aed" },
  { code: "wsd_poly", label: "다의어 분석",    desc: "하나의 어휘가 갖는 다양한 의미를 분석합니다.",             mode: ["written"],           color: "#ea580c" },
  { code: "dparse",   label: "의존 구문분석",  desc: "어절 간 의존 관계와 구문 구조를 분석합니다.",              mode: ["written"],           color: "#b45309" },
  { code: "srl",      label: "의미역 인식",    desc: "서술어와 논항(행동주·피동주)의 의미 관계를 분석합니다.",    mode: ["written"],           color: "#dc2626" },
];

const SAMPLE_TEXTS: Record<ApiMode, string> = {
  written: "윤동주는 일제강점기의 시인이다. 그는 1917년 12월 30일 중국 만저우에서 태어났으며, 연희전문학교를 졸업하고 일본 도시샤 대학에 유학하였다.",
  spoken:  "네 안녕하세요 홍길동 교숩니다 오늘 서울에서 발표가 있어요",
};

/* ── 결과 파서 ─────────────────────────────────────────────── */
function MorphResult({ sentences }: { sentences: unknown[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {(sentences as Record<string, unknown>[]).map((sent, si) => (
        <div key={si}>
          <p className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
            문장 {si + 1}: {String(sent.text)}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {((sent.morp ?? []) as Record<string, unknown>[]).map((m, i) => (
              <span key={i} className="tag" style={{ background: "var(--surface3)", border: "1px solid var(--border)", color: "var(--text)" }}>
                <span style={{ color: "#2563eb" }}>{String(m.lemma)}</span>
                <span style={{ color: "var(--text-dim)", marginLeft: 3 }}>/{String(m.type)}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NerResult({ sentences }: { sentences: unknown[] }) {
  const NE_COLORS: Record<string, string> = {
    PS: "#2563eb", LC: "#059669", OG: "#7c3aed",
    DT: "#b45309", TI: "#ea580c", QT: "#dc2626",
    EV: "#0891b2", CV: "#0d9488", AM: "#4f46e5",
    PT: "#0284c7", FD: "#7c3aed", TR: "#be185d",
    MT: "#9333ea", TM: "#16a34a",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {(sentences as Record<string, unknown>[]).map((sent, si) => {
        const nes = (sent.NE ?? []) as Record<string, unknown>[];
        return (
          <div key={si}>
            <p className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
              문장 {si + 1}: {String(sent.text)}
            </p>
            {nes.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--text-dim)" }}>인식된 개체명 없음</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {nes.map((ne, i) => {
                  const prefix = String(ne.type).split("_")[0];
                  const c = NE_COLORS[prefix] || "#6b7280";
                  return (
                    <span key={i} className="tag" style={{ background: c + "12", color: c, border: `1px solid ${c}40` }}>
                      [{String(ne.type)}] {String(ne.text)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WsdResult({ sentences }: { sentences: unknown[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {(sentences as Record<string, unknown>[]).map((sent, si) => {
        const wsds = ((sent.WSD ?? []) as Record<string, unknown>[]).filter(
          (w) => (w.sense_id as number) !== 0
        );
        return (
          <div key={si}>
            <p className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
              문장 {si + 1}: {String(sent.text)}
            </p>
            {wsds.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--text-dim)" }}>동음이의어/다의어 해당 없음</p>
            ) : (
              <table className="mono" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["어휘", "sense_id", "type", "sense"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "4px 8px", fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wsds.map((w, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--surface3)" }}>
                      <td style={{ padding: "4px 8px", color: "#7c3aed" }}>{String(w.text)}</td>
                      <td style={{ padding: "4px 8px", color: "var(--text)" }}>{String(w.sense_id)}</td>
                      <td style={{ padding: "4px 8px", color: "var(--text-muted)" }}>{String(w.type ?? "-")}</td>
                      <td style={{ padding: "4px 8px", color: "var(--text-muted)", fontSize: 11 }}>{String(w.sense ?? "-")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DparseResult({ sentences }: { sentences: unknown[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {(sentences as Record<string, unknown>[]).map((sent, si) => {
        const deps = (sent.dependency ?? []) as Record<string, unknown>[];
        return (
          <div key={si}>
            <p className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
              문장 {si + 1}: {String(sent.text)}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {deps.map((dep, i) => (
                <div key={i} className="mono" style={{
                  display: "flex", alignItems: "center", gap: 8, fontSize: 13,
                  padding: "5px 10px", borderRadius: 6, background: "var(--surface2)",
                }}>
                  <span style={{ color: "#b45309", minWidth: 80 }}>{String(dep.text)}</span>
                  <span style={{ color: "var(--text-dim)" }}>→</span>
                  <span style={{ color: "var(--text-muted)", minWidth: 60, fontSize: 11 }}>head={String(dep.head)}</span>
                  <span className="tag" style={{ background: "rgba(180,83,9,0.08)", color: "#b45309", border: "1px solid rgba(180,83,9,0.25)" }}>
                    {String(dep.label)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SrlResult({ sentences }: { sentences: unknown[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {(sentences as Record<string, unknown>[]).map((sent, si) => {
        const srls = (sent.SRL ?? []) as Record<string, unknown>[];
        return (
          <div key={si}>
            <p className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
              문장 {si + 1}: {String(sent.text)}
            </p>
            {srls.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--text-dim)" }}>인식된 의미역 없음</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {srls.map((srl, i) => (
                  <div key={i} style={{ borderRadius: 8, padding: 12, background: "var(--surface2)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>서술어</span>
                      <span className="tag" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.25)" }}>
                        {String(srl.verb)}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {((srl.argument ?? []) as Record<string, unknown>[]).map((arg, j) => (
                        <span key={j} className="tag" style={{ background: "var(--surface3)", color: "var(--text)", border: "1px solid var(--border)" }}>
                          <span style={{ color: "#dc2626" }}>{String(arg.type)}</span>
                          <span style={{ marginLeft: 4 }}>{String(arg.text)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RawJson({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(data, null, 2);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [text]);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={copy}
        className="mono"
        style={{
          position: "absolute", top: 10, right: 10,
          fontSize: 11, padding: "3px 10px", borderRadius: 5,
          border: "1px solid var(--border)",
          background: copied ? "#16a34a" : "var(--bg)",
          color: copied ? "#fff" : "var(--text-muted)",
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        {copied ? "✓ 복사됨" : "복사"}
      </button>
      <pre
        className="mono"
        style={{
          fontSize: 12, lineHeight: 1.65, overflowX: "auto", maxHeight: 420,
          padding: "14px 16px", paddingTop: 40,
          borderRadius: 8, background: "#f6f8fa",
          border: "1px solid var(--border)",
          color: "#24292e",
        }}
      >
        {text}
      </pre>
    </div>
  );
}

function ResultView({ api, result }: { api: ApiDef; result: ResultState }) {
  const [isOpen, setIsOpen] = useState(true);
  const [tab, setTab] = useState<"parsed" | "raw">("parsed");

  const statusColor =
    result.status === 200 ? "#16a34a" :
    result.status && result.status >= 400 ? "#dc2626" :
    "var(--text-dim)";

  if (result.error) {
    return (
      <div className="animate-slide-up" style={{
        borderRadius: 10, padding: 14, fontSize: 13,
        background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.2)", color: "#dc2626",
      }}>
        ✕ {result.error}
      </div>
    );
  }

  const sentences =
    (result.data?.data as Record<string, unknown>)?.return_object
      ? ((result.data?.data as Record<string, unknown>).return_object as Record<string, unknown>)?.sentence as unknown[]
      : null;

  return (
    <div className="animate-slide-up" style={{ borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
      {/* 아코디언 헤더 */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", background: "var(--surface)", border: "none", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: api.color, display: "inline-block" }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{api.label} 결과</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="mono"
            style={{
              fontSize: 11, padding: "2px 7px", borderRadius: 4,
              background: statusColor + "15",
              color: statusColor,
              border: `1px solid ${statusColor}30`,
            }}
          >
            {result.status}
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>{result.elapsed}ms</span>
          <span style={{
            fontSize: 11, color: "var(--text-dim)", display: "inline-block",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}>▾</span>
        </div>
      </button>

      {/* 펼쳐지는 콘텐츠 */}
      {isOpen && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {/* 탭 바 */}
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "8px 14px", background: "var(--surface2)", borderBottom: "1px solid var(--border)",
          }}>
            {(["parsed", "raw"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="mono"
                style={{
                  fontSize: 12, padding: "3px 10px", borderRadius: 5, border: "none", cursor: "pointer",
                  background: tab === t ? api.color : "transparent",
                  color: tab === t ? "#fff" : "var(--text-muted)",
                  fontWeight: tab === t ? 500 : 400,
                  transition: "all 0.15s",
                }}
              >
                {t === "parsed" ? "분석 결과" : "API 응답"}
              </button>
            ))}
          </div>

          {/* 콘텐츠 */}
          <div style={{ padding: 16, background: "var(--bg)" }}>
            {tab === "raw" ? (
              <RawJson data={result.data} />
            ) : sentences ? (
              api.code === "morp"                           ? <MorphResult  sentences={sentences} /> :
              api.code === "ner"                            ? <NerResult    sentences={sentences} /> :
              api.code === "wsd" || api.code === "wsd_poly" ? <WsdResult    sentences={sentences} /> :
              api.code === "dparse"                         ? <DparseResult sentences={sentences} /> :
              api.code === "srl"                            ? <SrlResult    sentences={sentences} /> :
              <RawJson data={sentences} />
            ) : (
              <p style={{ fontSize: 12, color: "var(--text-dim)" }}>파싱 가능한 결과가 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 메인 페이지 ────────────────────────────────────────────── */
export default function Home() {
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [mode, setMode] = useState<ApiMode>("written");
  const [text, setText] = useState(SAMPLE_TEXTS.written);
  const [result, setResult] = useState<ResultState | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedApi = APIS.find((a) => a.code === selectedCode) ?? null;
  const available = selectedApi ? selectedApi.mode.includes(mode) : false;
  const canRun = !!selectedApi && available && text.trim().length > 0;

  const handleModeChange = (m: ApiMode) => {
    setMode(m);
    setText(SAMPLE_TEXTS[m]);
    setResult(null);
  };

  const run = useCallback(async () => {
    if (!selectedApi || !canRun) return;
    setLoading(true);
    setResult(null);
    const t0 = Date.now();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisCode: selectedApi.code, text, mode }),
      });
      const json = await res.json();
      setResult({
        status: json.status ?? res.status,
        data: json,
        error: json.error ?? null,
        elapsed: Date.now() - t0,
      });
    } catch (e) {
      setResult({ status: null, data: null, error: String(e), elapsed: Date.now() - t0 });
    } finally {
      setLoading(false);
    }
  }, [selectedApi, text, mode, canRun]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "52px 24px 80px" }}>

        {/* 헤더 */}
        <header style={{ marginBottom: 40 }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 10, letterSpacing: "0.05em" }}>
            ETRI · 언어지능연구실
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            언어 분석 API 테스터
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            형태소 분석 · 개체명 인식 · 동음이의어 · 다의어 · 의존 구문분석 · 의미역 인식
          </p>
        </header>

        {/* 컨트롤 패널 */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
        }}>

          {/* API 선택 + 모드 토글 */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <select
                value={selectedCode}
                onChange={(e) => { setSelectedCode(e.target.value); setResult(null); }}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: selectedCode ? "var(--text)" : "var(--text-dim)",
                  fontSize: 14,
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  paddingRight: 32,
                }}
              >
                <option value="">API 선택...</option>
                {APIS.map((api) => (
                  <option key={api.code} value={api.code}>{api.label}</option>
                ))}
              </select>
            </div>

            {/* 모드 토글 */}
            <div style={{
              display: "flex", gap: 3,
              background: "var(--surface2)",
              borderRadius: 8, padding: 3,
              border: "1px solid var(--border)",
            }}>
              {(["written", "spoken"] as ApiMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  style={{
                    padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                    background: mode === m ? "var(--bg)" : "transparent",
                    color: mode === m ? "var(--text)" : "var(--text-muted)",
                    fontSize: 13,
                    fontWeight: mode === m ? 500 : 400,
                    boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m === "written" ? "문어체" : "구어체"}
                </button>
              ))}
            </div>
          </div>

          {/* API 설명 (선택 시 표시) */}
          {selectedApi && (
            <div style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: `${selectedApi.color}08`,
              border: `1px solid ${selectedApi.color}20`,
              marginBottom: 16,
              fontSize: 13,
              color: "var(--text-muted)",
              lineHeight: 1.6,
            }}>
              <span style={{ fontWeight: 600, color: selectedApi.color }}>{selectedApi.label}</span>
              <span style={{ margin: "0 6px", color: "var(--border-bright)" }}>·</span>
              {selectedApi.desc}
              {!available && (
                <span style={{ marginLeft: 10, color: "#dc2626", fontSize: 12 }}>
                  ※ 이 API는 {mode === "spoken" ? "문어체" : "구어체"} 전용입니다.
                </span>
              )}
            </div>
          )}

          {/* 텍스트 입력 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)" }}>분석 텍스트</label>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>{text.length} 자</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: 14,
                lineHeight: 1.75,
                resize: "vertical",
                outline: "none",
                fontFamily: "'Noto Sans KR', sans-serif",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              placeholder="분석할 한국어 문장을 입력하세요..."
            />
          </div>

          {/* 실행 버튼 */}
          <button
            onClick={run}
            disabled={loading || !canRun}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 8,
              border: "none",
              background: canRun ? (selectedApi?.color ?? "var(--accent)") : "var(--surface3)",
              color: canRun ? "#fff" : "var(--text-dim)",
              fontSize: 14,
              fontWeight: 500,
              cursor: canRun ? "pointer" : "not-allowed",
              transition: "opacity 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? (
              <>
                <span
                  className="animate-spin-slow"
                  style={{
                    display: "inline-block", width: 13, height: 13,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                  }}
                />
                분석 중...
              </>
            ) : "실행"}
          </button>
        </div>

        {/* 결과 */}
        {result && selectedApi && (
          <ResultView api={selectedApi} result={result} />
        )}

        {/* 푸터 */}
        <footer style={{
          marginTop: 56, paddingTop: 20,
          borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
            ETRI 언어분석 API · 1일 5,000건 무료
          </span>
          <a
            href="https://epretx.etri.re.kr/apiDetail?id=2"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}
          >
            API 문서 →
          </a>
        </footer>
      </div>
    </div>
  );
}
