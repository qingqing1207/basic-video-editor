"use client";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  editorTokenDefinitions,
  editorTokenGroups,
  type EditorAppearance,
  type EditorDensity,
  type EditorThemeMode,
  type EditorTokenName,
} from "@basic-video-editor/editor";

type Kind = (typeof editorTokenDefinitions)[EditorTokenName]["kind"];

const names = Object.keys(editorTokenDefinitions) as EditorTokenName[];

const tiers = [
  {
    id: "ref",
    title: "Ref · 原始色板",
    hint: "只被 sys 引用的原始色值，不随明暗模式变化；宿主一般不直接覆盖",
  },
  {
    id: "sys",
    title: "Sys · 语义角色",
    hint: "宿主定制主题时覆盖这一层，组件只使用 sys / cmp",
  },
  {
    id: "cmp",
    title: "Cmp · 组件 token",
    hint: "时间线、预览、控件部件，通过 var() 引用 sys",
  },
] as const;

const tokenTiers = tiers.map((tier) => ({
  ...tier,
  groups: Object.entries(editorTokenGroups)
    .filter(([, group]) => group.tier === tier.id)
    .map(([id, group]) => ({
      id,
      ...group,
      tokens: names.filter((name) => editorTokenDefinitions[name].group === id),
    })),
}));

export function appearanceStyle(
  appearance: EditorAppearance | undefined,
  mode: EditorThemeMode,
) {
  const tokens = { ...appearance?.base, ...appearance?.[mode] };
  return Object.fromEntries(
    Object.entries(tokens).map(([name, value]) => [`--bve-${name}`, value]),
  ) as Record<string, string>;
}

function resolve(probe: HTMLElement, name: string, kind: Kind) {
  const declared = getComputedStyle(probe)
    .getPropertyValue(`--bve-${name}`)
    .trim();
  let resolved = declared;
  if (kind === "color") {
    probe.style.backgroundColor = `var(--bve-${name})`;
    resolved = getComputedStyle(probe).backgroundColor;
  } else if (kind === "length") {
    probe.style.width = `var(--bve-${name})`;
    resolved = getComputedStyle(probe).width;
  }
  probe.style.backgroundColor = "";
  probe.style.width = "";
  return { declared, resolved };
}

function Preview({ name, kind }: { name: EditorTokenName; kind: Kind }) {
  const v = `var(--bve-${name})`;
  if (kind === "color")
    return (
      <span className="ti-swatch">
        <i style={{ background: v }} />
      </span>
    );
  if (kind === "font")
    return (
      <span className="ti-glyph" style={{ fontFamily: v }}>
        Aa
      </span>
    );
  if (kind === "shadow")
    return <span className="ti-shadow" style={{ boxShadow: v }} />;
  if (kind === "length") {
    if (name.startsWith("radius"))
      return <span className="ti-radius" style={{ borderRadius: v }} />;
    if (name.startsWith("text-") || name === "font-size")
      return (
        <span className="ti-glyph" style={{ fontSize: v }}>
          Ag
        </span>
      );
    if (name === "line-height") return <span className="ti-none" />;
    return <span className="ti-bar" style={{ width: v }} />;
  }
  return <span className="ti-none" />;
}

function Row({
  name,
  overridden,
  version,
}: {
  name: EditorTokenName;
  overridden: boolean;
  version: string;
}) {
  const definition = editorTokenDefinitions[name];
  const probe = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState({ declared: "", resolved: "" });
  useLayoutEffect(() => {
    if (probe.current) setValue(resolve(probe.current, name, definition.kind));
  }, [name, definition.kind, version]);
  const alias = value.declared !== value.resolved;
  return (
    <tr>
      <td>
        <code>--bve-{name}</code>
        {overridden && <span className="ti-badge">已覆盖</span>}
      </td>
      <td>
        <Preview name={name} kind={definition.kind} />
        <span ref={probe} className="ti-probe" />
      </td>
      <td className="ti-kind">{definition.kind}</td>
      <td>
        <span>{value.resolved}</span>
        {alias && <span className="ti-declared">{value.declared}</span>}
      </td>
    </tr>
  );
}

export default function TokenInspector({
  theme,
  density,
  appearance,
}: {
  theme: EditorThemeMode;
  density: EditorDensity;
  appearance?: EditorAppearance;
}) {
  const [query, setQuery] = useState("");
  const style = useMemo(
    () => appearanceStyle(appearance, theme),
    [appearance, theme],
  );
  const overridden = useMemo(
    () => new Set(Object.keys(style).map((key) => key.slice(6))),
    [style],
  );
  const version = `${theme}|${density}|${JSON.stringify(style)}`;
  const q = query.trim().toLowerCase();
  return (
    <div className="ti">
      <div className="ti-toolbar">
        <input
          aria-label="Filter tokens"
          placeholder={`筛选 ${names.length} 个 token，例如 track、radius、primary`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span>
          当前：{theme} · {density}
          {overridden.size > 0 && ` · ${overridden.size} 项被 appearance 覆盖`}
        </span>
      </div>
      <div
        className={`bve-scope ti-scope ${theme}`}
        style={style}
        data-density={density}
        data-token-inspector=""
      >
        {tokenTiers.map((tier) => {
          const groups = tier.groups
            .map((group) => ({
              ...group,
              tokens: group.tokens.filter((name) => name.includes(q)),
            }))
            .filter((group) => group.tokens.length);
          if (!groups.length) return null;
          return (
            <div key={tier.id} className="ti-tier">
              <header>
                <span className={`ti-tag ti-tag-${tier.id}`}>{tier.id}</span>
                <h2>{tier.title}</h2>
                <p>{tier.hint}</p>
              </header>
              {groups.map((group) => (
                <section key={group.id} className="ti-group">
                  <header>
                    <h3>{group.title}</h3>
                    <p>{group.hint}</p>
                  </header>
                  <table>
                    <thead>
                      <tr>
                        <th>变量</th>
                        <th>预览</th>
                        <th>类型</th>
                        <th>当前值</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.tokens.map((name) => (
                        <Row
                          key={name}
                          name={name}
                          overridden={overridden.has(name)}
                          version={version}
                        />
                      ))}
                    </tbody>
                  </table>
                </section>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
