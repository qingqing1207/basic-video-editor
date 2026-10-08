"use client";
import LiveEditor from "./live-editor";
import TokenInspector from "./token-inspector";
import { useState, useRef, type ReactNode } from "react";
import { EditorThemePreview } from "@basic-video-editor/editor/theme-preview";
import type {
  EditorAppearance,
  EditorDensity,
  EditorThemeMode,
} from "@basic-video-editor/editor";
import "@basic-video-editor/editor/style.css";
import { themePresets } from "./theme-presets";


type Tab = "tokens" | "components" | "live";
const tabs: { id: Tab; label: string; hint: string }[] = [
  { id: "tokens", label: "Token 清单", hint: "每个 --bve-* 变量的当前取值" },
  { id: "components", label: "组件样例", hint: "按钮、表单、弹层、时间线色" },
  { id: "live", label: "真实编辑器", hint: "完整编辑器（单个演示工程）" },
];

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="lab-seg">
      {options.map((option) => (
        <button
          key={option.value}
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Control({
  title,
  note,
  children,
}: {
  title: string;
  note: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="lab-control">
      <h2>{title}</h2>
      {children}
      <p>{note}</p>
    </section>
  );
}

export default function ThemeLab() {
  const [theme, setTheme] = useState<EditorThemeMode>("light");
  const [density, setDensity] = useState<EditorDensity>("compact");
  const [presetId, setPresetId] = useState("default");
  const [mount, setMount] = useState<"editor" | "host">("editor");
  const [tab, setTab] = useState<Tab>("tokens");
  const hostDialog = useRef<HTMLDialogElement>(null);
  const [dialogPortal, setDialogPortal] = useState<HTMLDivElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const preset = themePresets.find((p) => p.id === presetId) ?? themePresets[0]!;
  const appearance = preset.appearance;
  const snippet = [
    "<VideoEditor",
    "  editor={editor}",
    `  theme="${theme}"`,
    `  density="${density}"`,
    ...(appearance
      ? [
          `  appearance={${JSON.stringify(appearance, null, 2).replace(/\n/g, "\n  ")}}`,
        ]
      : []),
    "/>",
  ].join("\n");
  return (
    <div className="lab">
      <style>{css}</style>
      <aside className="lab-side">
        <header>
          <h1>Theme Lab</h1>
          <p>
            调整外观入参，实时观察编辑器的 token、组件和真实页面如何响应。
            这里只是开发验收页，宿主应用不需要它。
          </p>
        </header>
        <Control
          title="主题模式 theme"
          note={
            <>
              切换 <code>.bve-scope.dark</code>，只改变颜色 token。
            </>
          }
        >
          <Segmented<EditorThemeMode>
            label="Theme mode"
            value={theme}
            onChange={setTheme}
            options={[
              { value: "light", label: "浅色" },
              { value: "dark", label: "深色" },
            ]}
          />
        </Control>
        <Control
          title="密度 density"
          note="comfortable 只放大控件高度与内边距，时间线几何保持不变。"
        >
          <Segmented<EditorDensity>
            label="Density"
            value={density}
            onChange={setDensity}
            options={[
              { value: "compact", label: "Compact" },
              { value: "comfortable", label: "Comfortable" },
            ]}
          />
        </Control>
        <Control
          title="宿主外观 appearance"
          note={preset.note}
        >
          <Segmented<string>
            label="Appearance"
            value={presetId}
            onChange={setPresetId}
            options={themePresets.map((p) => ({ value: p.id, label: p.label }))}
          />
        </Control>
        <Control
          title="弹层挂载 portalContainer"
          note="菜单、对话框、气泡默认挂在编辑器内部；也可挂到宿主容器，token 仍应生效。"
        >
          <Segmented<"editor" | "host">
            label="Portal mount"
            value={mount}
            onChange={setMount}
            options={[
              { value: "editor", label: "编辑器内" },
              { value: "host", label: "宿主容器" },
            ]}
          />
          <button
            className="lab-btn"
            onClick={() => {
              setDialogOpen(true);
              hostDialog.current?.showModal();
            }}
          >
            在宿主 &lt;dialog&gt; 中打开
          </button>
        </Control>
        <Control
          title="宿主样式隔离"
          note="下面是宿主页面自己的控件，样式不应受编辑器 CSS 影响。"
        >
          <div className="lab-host-row">
            <button className="lab-btn">宿主按钮</button>
            <input aria-label="Host input" placeholder="宿主输入框" />
          </div>
        </Control>
        <details className="lab-code">
          <summary>对应的接入代码</summary>
          <pre>{snippet}</pre>
        </details>
      </aside>
      <main className="lab-main">
        <nav className="lab-tabs" role="tablist" aria-label="Views">
          {tabs.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              <strong>{item.label}</strong>
              <span>{item.hint}</span>
            </button>
          ))}
        </nav>
        <div className={`lab-stage lab-stage-${tab}`}>
          {tab === "tokens" && (
            <TokenInspector
              theme={theme}
              density={density}
              appearance={appearance}
            />
          )}
          {tab === "components" && (
            <EditorThemePreview
              theme={theme}
              density={density}
              appearance={appearance}
              portalContainer={mount === "host" ? portal : undefined}
            />
          )}
          {tab === "live" && (
            <LiveEditor
              theme={theme}
              onThemeChange={setTheme}
              density={density}
              appearance={appearance}
              height="calc(100dvh - 96px)"
            />
          )}
        </div>
        <div ref={setPortal} data-host-portal="" />
      </main>
      <dialog
        ref={hostDialog}
        className="lab-dialog"
        onClose={() => setDialogOpen(false)}
      >
        <header>
          <strong>宿主 &lt;dialog&gt;（top layer）</strong>
          <button
            className="lab-btn"
            onClick={() => hostDialog.current?.close()}
          >
            关闭
          </button>
        </header>
        {dialogOpen && (
          <EditorThemePreview
            theme={theme}
            density={density}
            appearance={appearance}
            portalContainer={dialogPortal}
          />
        )}
        <div ref={setDialogPortal} />
      </dialog>
    </div>
  );
}

const css = `
.lab{--l-bg:#f4f5f7;--l-card:#fff;--l-line:#e1e3e8;--l-text:#1c1e24;--l-sub:#666b78;--l-accent:#2b59ff;
  display:grid;grid-template-columns:300px minmax(0,1fr);min-height:100vh;background:var(--l-bg);color:var(--l-text);
  font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
.lab *{box-sizing:border-box}
.lab code{font:12px ui-monospace,SFMono-Regular,Menlo,monospace;background:#eceef2;padding:1px 5px;border-radius:4px}
.lab-side{position:sticky;top:0;align-self:start;height:100vh;overflow:auto;padding:20px 18px;background:var(--l-card);border-right:1px solid var(--l-line);display:flex;flex-direction:column;gap:18px}
.lab-side h1{margin:0 0 6px;font-size:18px}
.lab-side header p{margin:0;color:var(--l-sub);font-size:13px}
.lab-control h2{margin:0 0 8px;font-size:12px;font-weight:600;color:var(--l-sub);letter-spacing:.02em}
.lab-control p{margin:8px 0 0;font-size:12px;color:var(--l-sub)}
.lab-seg{display:flex;flex-wrap:wrap;padding:3px;gap:2px;background:#eceef2;border-radius:8px}
.lab-seg button{flex:1 1 auto;border:0;background:transparent;padding:6px 8px;border-radius:6px;font:inherit;font-size:13px;color:var(--l-sub);cursor:pointer}
.lab-seg button[aria-checked=true]{background:var(--l-card);color:var(--l-text);box-shadow:0 1px 2px rgb(0 0 0/.12);font-weight:600}
.lab-btn{margin-top:8px;padding:6px 10px;border:1px solid var(--l-line);background:var(--l-card);border-radius:6px;font:inherit;font-size:13px;cursor:pointer}
.lab-btn:hover{background:#f0f1f4}
.lab-host-row{display:flex;gap:8px}
.lab-host-row .lab-btn{margin:0;white-space:nowrap}
.lab-host-row input{min-width:0;flex:1;padding:6px 8px;border:1px solid var(--l-line);border-radius:6px;font:inherit;font-size:13px}
.lab-code summary{cursor:pointer;font-size:12px;font-weight:600;color:var(--l-sub)}
.lab-code pre{margin:8px 0 0;padding:10px;max-height:320px;overflow:auto;background:#14161b;color:#d7dae2;border-radius:8px;font:11px/1.5 ui-monospace,Menlo,monospace}
.lab-main{min-width:0;padding:16px 20px 24px;display:flex;flex-direction:column;gap:12px}
.lab-tabs{display:flex;gap:8px}
.lab-tabs button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:8px 14px;border:1px solid var(--l-line);background:var(--l-card);border-radius:8px;font:inherit;cursor:pointer;text-align:left}
.lab-tabs button span{font-size:12px;color:var(--l-sub)}
.lab-tabs button[aria-selected=true]{border-color:var(--l-accent);box-shadow:0 0 0 1px var(--l-accent)}
.lab-stage{min-width:0;border:1px solid var(--l-line);border-radius:10px;overflow:hidden;background:var(--l-card)}
.lab-stage-live{height:calc(100dvh - 96px)}
.lab-dialog{width:min(1100px,92vw);max-height:90vh;padding:16px;border:1px solid var(--l-line);border-radius:12px}
.lab-dialog>header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.lab-dialog>header .lab-btn{margin:0}
.ti-scope{color:var(--l-text);background:var(--l-card)}
.ti-scope.dark{--l-card:#15171c;--l-line:#2c2f37;--l-text:#e6e8ee;--l-sub:#9aa0ad;--l-accent:#6d8dff}
.ti-scope code{background:rgb(128 128 128/.2)}
.ti-toolbar{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--l-card);border-bottom:1px solid var(--l-line);font-size:12px;color:var(--l-sub)}
.ti-toolbar input{flex:1;max-width:420px;padding:6px 10px;border:1px solid var(--l-line);border-radius:6px;font:inherit;font-size:13px}
.ti-tier{padding-top:6px}
.ti-tier>header{display:flex;align-items:baseline;gap:10px;padding:14px 14px 4px;border-top:1px solid var(--l-line)}
.ti-tier>header h2{margin:0;font-size:15px}
.ti-tier>header p{margin:0;font-size:12px;color:var(--l-sub)}
.ti-tag{padding:1px 8px;border-radius:4px;font:600 11px ui-monospace,Menlo,monospace;background:rgb(128 128 128/.2);color:var(--l-text)}
.ti-tag-sys{background:var(--l-accent);color:#fff}
.ti-group{padding:14px 14px 4px}
.ti-group header{display:flex;align-items:baseline;gap:10px;margin-bottom:6px}
.ti-group h3{margin:0;font-size:14px}
.ti-group header p{margin:0;font-size:12px;color:var(--l-sub)}
.ti table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px}
.ti th{padding:4px 8px;text-align:left;font-weight:500;color:var(--l-sub);border-bottom:1px solid var(--l-line)}
.ti th:nth-child(1){width:34%}.ti th:nth-child(2){width:15%}.ti th:nth-child(3){width:9%}
.ti td{padding:5px 8px;border-bottom:1px solid rgb(128 128 128/.15);vertical-align:middle;overflow:hidden;text-overflow:ellipsis}
.ti-kind{color:var(--l-sub)}
.ti-badge{margin-left:6px;padding:0 6px;border-radius:999px;background:#e8edff;color:var(--l-accent);font-size:11px}
.ti-declared{display:block;color:var(--l-sub);font:11px ui-monospace,Menlo,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ti-swatch{display:inline-block;width:56px;height:22px;border-radius:5px;border:1px solid rgb(128 128 128/.35);
  background-image:linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%);background-size:8px 8px;background-position:0 0,4px 4px}
.ti-swatch i{display:block;width:100%;height:100%;border-radius:inherit}
.ti-glyph{font-size:16px;color:var(--l-text)}
.ti-shadow{display:inline-block;width:44px;height:22px;border-radius:4px;background:var(--l-card)}
.ti-radius{display:inline-block;width:32px;height:22px;border:2px solid var(--l-accent);border-right:0;border-bottom:0}
.ti-bar{display:inline-block;max-width:100%;height:6px;border-radius:3px;background:var(--l-accent)}
.ti-none{display:inline-block;width:12px;height:1px;background:var(--l-line)}
.ti-probe{position:absolute;visibility:hidden;pointer-events:none;height:0}
@media(max-width:900px){.lab{grid-template-columns:1fr}.lab-side{position:static;height:auto}}
`;
