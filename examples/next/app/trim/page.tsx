"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { VideoTrimmer, type TrimResult, type VideoTrimmerHandle, type VideoTrimmerStatus } from "@basic-video-editor/editor";
import { Button, cx } from "../components/ui";

function formatSize(bytes: number) {
  return bytes > 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatTime(seconds: number) {
  const tenths = Math.floor(seconds * 10 + 1e-6);
  const whole = Math.floor(tenths / 10);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}.${tenths % 10}`;
}

/** Upload a video, pick the part you want, get a trimmed file back. */
export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<TrimResult | null>(null);
  const [range, setRange] = useState<{ start: number; end: number } | null>(null);
  const trimmer = useRef<VideoTrimmerHandle>(null);
  const [status, setStatus] = useState<VideoTrimmerStatus>({ ready: false, trimming: false, progress: 0 });
  const [dark, setDark] = useState(false);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!result) return setResultUrl(null);
    const url = URL.createObjectURL(result.file);
    setResultUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  const pick = (next: File | undefined) => {
    if (!next || !next.type.startsWith("video/")) return;
    setResult(null);
    setFile(next);
  };

  return (
    <main className={cx("min-h-screen px-6 py-10", dark ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900")}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-zinc-500 hover:underline">
              ← Projects
            </Link>
            <h1 className="mt-1 text-xl font-semibold">Trim a video</h1>
          </div>
          <Button variant="outline" onClick={() => setDark((value) => !value)}>
            {dark ? "Light" : "Dark"}
          </Button>
        </header>

        {file ? (
          <VideoTrimmer
            ref={trimmer}
            file={file}
            theme={dark ? "dark" : "light"}
            onRangeChange={setRange}
            onStatusChange={setStatus}
            onError={(error) => console.error(error)}
          />
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setOver(false);
              pick(event.dataTransfer.files[0]);
            }}
            className={cx(
              "flex h-64 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm transition-colors",
              over ? "border-zinc-500 bg-zinc-500/10" : "border-zinc-300 text-zinc-500 hover:border-zinc-500",
            )}
          >
            <span className="text-base font-medium text-inherit">Choose a video</span>
            <span>or drop it here. Nothing is uploaded.</span>
          </button>
        )}
        {file && range && (
          <dl className="flex gap-8 text-sm tabular-nums">
            {[
              ["Start", formatTime(range.start)],
              ["Length", `${(range.end - range.start).toFixed(1)}s`],
              ["End", formatTime(range.end)],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <dt className="text-xs text-zinc-500">{label}</dt>
                <dd className="m-0 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {file && (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (status.trimming) trimmer.current?.cancel();
                else {
                  setFile(null);
                  setResult(null);
                  setRange(null);
                }
              }}
            >
              Cancel
            </Button>
            <Button
              className="min-w-32"
              disabled={!status.ready || status.trimming}
              onClick={() => trimmer.current?.trim().then(setResult, () => {})}
            >
              {status.trimming ? `${Math.round(status.progress * 100)}%` : "Trim video"}
            </Button>
          </div>
        )}
        <input
          ref={input}
          type="file"
          accept="video/*"
          hidden
          onChange={(event) => {
            pick(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {result && resultUrl && (
          <section className="flex flex-col gap-3 rounded-xl border border-zinc-200/60 p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span>
                <b className="font-medium">{result.file.name}</b>
                <span className="ml-2 text-zinc-500">
                  {result.duration.toFixed(1)}s · {formatSize(result.file.size)}
                </span>
              </span>
              <a href={resultUrl} download={result.file.name}>
                <Button variant="outline">Download</Button>
              </a>
            </div>
            <video src={resultUrl} controls className="w-full rounded-lg bg-black" />
          </section>
        )}
      </div>
    </main>
  );
}
