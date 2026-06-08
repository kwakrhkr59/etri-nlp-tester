"use client";
import { useState, useCallback } from "react";

/* ── 타입 ─────────────────────────────────────────────── */
type ApiMode = "written" | "spoken";

interface ApiDef {
  code: string;
  label: string;
  desc: string;
  mode: ApiMode[];
  color: string;
  accent: string;
}

interface ResultState {
  status: number | null;
  data: Record<string, unknown> | null;
  error: string | null;
  elapsed: number | null;
}

/* ── API 정의 ──────────────────────────────────────────── */
const APIS: ApiDef[] = [
  {
    code: "morp",
    label: "형태소 분석",
    desc: "명사·동사·조사 등 형태소 단위로 분석",
    mode: ["written", "spoken"],
    color: "#4f8eff",
    accent: "rgba(79,142,255,0.12)",
  },
  {
    code: "ner",
    label: "개체명 인식",
    desc: "인명·지명·기관명 등 고유 개체를 태깅",
    mode: ["written", "spoken"],
    color: "#00d4aa",
    accent: "rgba(0,212,170,0.12)",
  },
  {
    code: "wsd",
    label: "동음이의어 분석",
    desc: "문맥으로 동음이의어 의미를 판별",
    mode: ["written"],
    color: "#a78bfa",
    accent: "rgba(167,139,250,0.12)",
  },
  {
    code: "wsd_poly",
    label: "다의어 분석",
    desc: "하나의 어휘가 갖는 다양한 의미를 분석",
    mode: ["written"],
    color: "#f97316",
    accent: "rgba(249,115,22,0.12)",
  },
  {
    code: "dparse",
    label: "의존 구문분석",
    desc: "어절 간 의존 관계·구문 구조 분석",
    mode: ["written"],
    color: "#ffd166",
    accent: "rgba(255,209,102,0.12)",
  },
  {
    code: "srl",
    label: "의미역 인식",
    desc: "서술어와 논항(행동주·피동주)의 관계 분석",
    mode: ["written"],
    color: "#ff6b6b",
    accent: "rgba(255,107,107,0.12)",
  },
];

const SAMPLE_TEXTS: Record<ApiMode, string> = {
  written:
    "윤동주는 일제강점기의 시인이다. 그는 1917년 12월 30일 중국 만저우에서 태어났으며, 연희전문학교를 졸업하고 일본 도시샤 대학에 유학하였다.",
  spoken: "네 안녕하세요 홍길동 교숩니다 오늘 서울에서 발표가 있어요",
};

/* ── 결과 파서 ─────────────────────────────────────────── */
function MorphResult({ sentences }: { sentences: unknown[] }) {
  return (
    <div className="space-y-4">
      {(sentences as Record<string,unknown>[]).map((sent, si) => (
        <div key={si}>
          <p className="text-xs mono" style={{ color: "var(--text-muted)" }}>
            문장 {si + 1}: {String(sent.text)}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {((sent.morp ?? []) as Record<string,unknown>[]).map((m, i) => (
              <span
                key={i}
                className="tag"
                style={{ background: "var(--surface3)", color: "var(--text)", border: "1px solid var(--border)" }}
              >
                <span style={{ color: "#4f8eff" }}>{String(m.lemma)}</span>
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
    PS: "#4f8eff", LC: "#00d4aa", OG: "#a78bfa",
    DT: "#ffd166", TI: "#ff9f43", QT: "#ff6b6b",
    EV: "#f97316", CV: "#06d6a0", AM: "#48cae4",
    PT: "#90e0ef", FD: "#caf0f8", TR: "#c77dff",
    MT: "#e0aaff", TM: "#b5e48c",
  };
  return (
    <div className="space-y-4">
      {(sentences as Record<string,unknown>[]).map((sent, si) => {
        const nes = (sent.NE ?? []) as Record<string,unknown>[];
        return (
          <div key={si}>
            <p className="text-xs mono mb-2" style={{ color: "var(--text-muted)" }}>
              문장 {si + 1}: {String(sent.text)}
            </p>
            {nes.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>인식된 개체명 없음</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {nes.map((ne, i) => {
                  const prefix = String(ne.type).split("_")[0];
                  const c = NE_COLORS[prefix] || "#7a8db0";
                  return (
                    <span
                      key={i}
                      className="tag"
                      style={{ background: c + "22", color: c, border: `1px solid ${c}55` }}
                    >
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
    <div className="space-y-4">
      {(sentences as Record<string,unknown>[]).map((sent, si) => {
        const wsds = ((sent.WSD ?? []) as Record<string,unknown>[]).filter(
          (w) => (w.sense_id as number) !== 0
        );
        return (
          <div key={si}>
            <p className="text-xs mono mb-2" style={{ color: "var(--text-muted)" }}>
              문장 {si + 1}: {String(sent.text)}
            </p>
            {wsds.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>동음이의어/다의어 해당 없음</p>
            ) : (
              <table className="w-full text-sm mono" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["어휘", "sense_id", "type", "sense"].map((h) => (
                      <th key={h} className="text-left py-1 px-2 text-xs" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wsds.map((w, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--surface3)" }}>
                      <td className="py-1 px-2" style={{ color: "#a78bfa" }}>{String(w.text)}</td>
                      <td className="py-1 px-2">{String(w.sense_id)}</td>
                      <td className="py-1 px-2" style={{ color: "var(--text-muted)" }}>{String(w.type ?? "-")}</td>
                      <td className="py-1 px-2" style={{ color: "var(--text-muted)", fontSize: 11 }}>{String(w.sense ?? "-")}</td>
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
    <div className="space-y-4">
      {(sentences as Record<string,unknown>[]).map((sent, si) => {
        const deps = (sent.dependency ?? []) as Record<string,unknown>[];
        return (
          <div key={si}>
            <p className="text-xs mono mb-2" style={{ color: "var(--text-muted)" }}>
              문장 {si + 1}: {String(sent.text)}
            </p>
            <div className="space-y-1">
              {deps.map((dep, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm mono py-1 px-2 rounded"
                  style={{ background: "var(--surface3)" }}
                >
                  <span style={{ color: "#ffd166", minWidth: 80 }}>{String(dep.text)}</span>
                  <span style={{ color: "var(--text-dim)" }}>→</span>
                  <span style={{ color: "var(--text-muted)", minWidth: 60, fontSize: 11 }}>
                    head={String(dep.head)}
                  </span>
                  <span
                    className="tag"
                    style={{ background: "rgba(255,209,102,0.15)", color: "#ffd166", border: "1px solid rgba(255,209,102,0.3)" }}
                  >
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
    <div className="space-y-4">
      {(sentences as Record<string,unknown>[]).map((sent, si) => {
        const srls = (sent.SRL ?? []) as Record<string,unknown>[];
        return (
          <div key={si}>
            <p className="text-xs mono mb-2" style={{ color: "var(--text-muted)" }}>
              문장 {si + 1}: {String(sent.text)}
            </p>
            {srls.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>인식된 의미역 없음</p>
            ) : (
              <div className="space-y-3">
                {srls.map((srl, i) => (
                  <div key={i} className="rounded p-3" style={{ background: "var(--surface3)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>서술어</span>
                      <span
                        className="tag"
                        style={{ background: "rgba(255,107,107,0.15)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.3)" }}
                      >
                        {String(srl.verb)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {((srl.argument ?? []) as Record<string,unknown>[]).map((arg, j) => (
                        <span
                          key={j}
                          className="tag"
                          style={{ background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" }}
                        >
                          <span style={{ color: "#ff6b6b" }}>{String(arg.type)}</span>
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

function ResultView({ api, result }: { api: ApiDef; result: ResultState }) {
  const [tab, setTab] = useState<"parsed" | "raw">("parsed");

  if (result.error) {
    return (
      <div
        className="rounded-lg p-4 text-sm mono animate-slide-up"
        style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.3)", color: "#ff6b6b" }}
      >
        ✕ {result.error}
      </div>
    );
  }

  const sentences =
    (result.data?.data as Record<string,unknown>)?.return_object
      ? ((result.data?.data as Record<string,unknown>).return_object as Record<string,unknown>)?.sentence as unknown[]
      : null;

  return (
    <div className="rounded-lg overflow-hidden animate-slide-up" style={{ border: `1px solid ${api.color}33` }}>
      {/* header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: api.accent, borderBottom: `1px solid ${api.color}33` }}
      >
        <div className="flex gap-3">
          {(["parsed", "raw"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="text-xs mono px-2 py-0.5 rounded transition-all"
              style={{
                background: tab === t ? api.color + "33" : "transparent",
                color: tab === t ? api.color : "var(--text-muted)",
                border: `1px solid ${tab === t ? api.color + "66" : "transparent"}`,
              }}
            >
              {t === "parsed" ? "분석 결과" : "RAW JSON"}
            </button>
          ))}
        </div>
        <span className="text-xs mono" style={{ color: "var(--text-dim)" }}>
          {result.elapsed}ms · HTTP {result.status}
        </span>
      </div>

      {/* body */}
      <div className="p-4" style={{ background: "var(--surface)" }}>
        {tab === "raw" ? (
          <pre
            className="text-xs mono overflow-auto max-h-96"
            style={{ color: "var(--text-muted)", lineHeight: 1.6 }}
          >
            {JSON.stringify(result.data, null, 2)}
          </pre>
        ) : sentences ? (
          api.code === "morp" ? <MorphResult sentences={sentences} /> :
          api.code === "ner" ? <NerResult sentences={sentences} /> :
          api.code === "wsd" || api.code === "wsd_poly" ? <WsdResult sentences={sentences} /> :
          api.code === "dparse" ? <DparseResult sentences={sentences} /> :
          api.code === "srl" ? <SrlResult sentences={sentences} /> :
          <pre className="text-xs mono" style={{ color: "var(--text-muted)" }}>
            {JSON.stringify(sentences, null, 2)}
          </pre>
        ) : (
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>파싱 가능한 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

/* ── API 카드 ────────────────────────────────────────────── */
function ApiCard({
  api,
  accessKey,
  text,
  mode,
}: {
  api: ApiDef;
  accessKey: string;
  text: string;
  mode: ApiMode;
}) {
  const [result, setResult] = useState<ResultState | null>(null);
  const [loading, setLoading] = useState(false);
  const available = api.mode.includes(mode);

  const run = useCallback(async () => {
    if (!accessKey.trim()) return alert("API 키를 입력하세요.");
    if (!text.trim()) return alert("분석할 텍스트를 입력하세요.");
    setLoading(true);
    setResult(null);
    const t0 = Date.now();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey, analysisCode: api.code, text, mode }),
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
  }, [accessKey, text, mode, api.code]);

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4 transition-all duration-300"
      style={{
        background: "var(--surface)",
        border: `1px solid ${available ? api.color + "40" : "var(--border)"}`,
        opacity: available ? 1 : 0.45,
      }}
    >
      {/* card header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: api.color, boxShadow: `0 0 6px ${api.color}` }}
            />
            <h3 className="font-medium text-sm" style={{ color: api.color }}>
              {api.label}
            </h3>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{api.desc}</p>
        </div>
        <span
          className="tag shrink-0"
          style={{ background: "var(--surface3)", color: "var(--text-dim)", border: "1px solid var(--border)" }}
        >
          {api.code}
        </span>
      </div>

      {/* mode badges */}
      <div className="flex gap-1">
        {(["written", "spoken"] as ApiMode[]).map((m) => (
          <span
            key={m}
            className="tag"
            style={{
              background: api.mode.includes(m) ? api.color + "22" : "transparent",
              color: api.mode.includes(m) ? api.color : "var(--text-dim)",
              border: `1px solid ${api.mode.includes(m) ? api.color + "55" : "var(--border)"}`,
            }}
          >
            {m === "written" ? "문어" : "구어"}
          </span>
        ))}
      </div>

      {/* run button */}
      <button
        onClick={run}
        disabled={loading || !available}
        className="w-full py-2.5 rounded-lg text-sm font-medium mono transition-all duration-200 flex items-center justify-center gap-2"
        style={{
          background: available ? api.color + "22" : "var(--surface2)",
          color: available ? api.color : "var(--text-dim)",
          border: `1px solid ${available ? api.color + "55" : "var(--border)"}`,
          cursor: available ? "pointer" : "not-allowed",
        }}
      >
        {loading ? (
          <>
            <span
              className="inline-block w-3 h-3 rounded-full border-2 animate-spin-slow"
              style={{ borderColor: `${api.color}33`, borderTopColor: api.color }}
            />
            분석 중...
          </>
        ) : available ? (
          "▶  실행"
        ) : (
          `${mode === "spoken" ? "문어" : "구어"}체 전용`
        )}
      </button>

      {/* result */}
      {result && <ResultView api={api} result={result} />}
    </div>
  );
}

/* ── 메인 페이지 ────────────────────────────────────────── */
export default function Home() {
  const [accessKey, setAccessKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [mode, setMode] = useState<ApiMode>("written");
  const [text, setText] = useState(SAMPLE_TEXTS.written);

  const handleModeChange = (m: ApiMode) => {
    setMode(m);
    setText(SAMPLE_TEXTS[m]);
  };

  return (
    <div className="min-h-screen grid-bg">
      {/* top glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(79,142,255,0.08) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-10">
        {/* header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mono"
              style={{ background: "rgba(79,142,255,0.15)", border: "1px solid rgba(79,142,255,0.4)", color: "#4f8eff" }}
            >
              E
            </div>
            <span className="text-xs mono" style={{ color: "var(--text-dim)" }}>
              ETRI / 언어지능연구실
            </span>
          </div>
          <h1 className="text-2xl font-medium mb-1" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
            언어 분석 기술 API 테스터
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            형태소 분석 · 개체명 인식 · 동음이의어 · 다의어 · 의존 구문분석 · 의미역 인식
          </p>
        </header>

        {/* control panel */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Key */}
            <div>
              <label className="block text-xs mono mb-2" style={{ color: "var(--text-muted)" }}>
                API KEY
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="ETRI에서 발급받은 API 키 입력"
                  className="w-full px-3 py-2.5 rounded-lg text-sm mono pr-12 outline-none transition-all"
                  style={{
                    background: "var(--surface2)",
                    border: `1px solid ${accessKey ? "var(--accent)" : "var(--border)"}`,
                    color: "var(--text)",
                  }}
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs mono transition-colors"
                  style={{ color: "var(--text-dim)" }}
                >
                  {showKey ? "숨김" : "표시"}
                </button>
              </div>
              <p className="text-xs mt-1.5" style={{ color: "var(--text-dim)" }}>
                <a
                  href="https://epretx.etri.re.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80"
                  style={{ color: "#4f8eff" }}
                >
                  epretx.etri.re.kr
                </a>
                {" "}에서 회원가입 후 발급
              </p>
            </div>

            {/* Mode */}
            <div>
              <label className="block text-xs mono mb-2" style={{ color: "var(--text-muted)" }}>
                분석 모드
              </label>
              <div className="flex gap-2">
                {([["written", "문어체", "소설·기사·논문 등"], ["spoken", "구어체", "대화·음성 등"]] as const).map(
                  ([m, label, sub]) => (
                    <button
                      key={m}
                      onClick={() => handleModeChange(m)}
                      className="flex-1 py-2.5 px-4 rounded-lg text-left transition-all duration-200"
                      style={{
                        background: mode === m ? "rgba(79,142,255,0.15)" : "var(--surface2)",
                        border: `1px solid ${mode === m ? "rgba(79,142,255,0.5)" : "var(--border)"}`,
                      }}
                    >
                      <div className="text-sm font-medium" style={{ color: mode === m ? "#4f8eff" : "var(--text)" }}>
                        {label}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{sub}</div>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Text input */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs mono" style={{ color: "var(--text-muted)" }}>
                분석 텍스트
              </label>
              <span className="text-xs mono" style={{ color: "var(--text-dim)" }}>
                {text.length} / 10,000 글자
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg text-sm resize-y outline-none transition-all"
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontFamily: "'Noto Sans KR', sans-serif",
                lineHeight: 1.7,
              }}
              placeholder="분석할 한국어 문장을 입력하세요..."
            />
          </div>
        </div>

        {/* API cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {APIS.map((api) => (
            <ApiCard
              key={api.code}
              api={api}
              accessKey={accessKey}
              text={text}
              mode={mode}
            />
          ))}
        </div>

        {/* footer */}
        <footer className="mt-12 pt-6 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs mono" style={{ color: "var(--text-dim)" }}>
            ETRI 언어분석 API · 1일 5,000건 무료
          </p>
          <a
            href="https://epretx.etri.re.kr/apiDetail?id=2"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs mono hover:opacity-80 transition-opacity"
            style={{ color: "#4f8eff" }}
          >
            API 문서 →
          </a>
        </footer>
      </div>
    </div>
  );
}
