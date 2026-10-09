# 视频裁剪（VideoTrimmer）

一个独立的小组件：用户上传视频后，拖动缩略图条两端的滑块选出想要的片段，直接在浏览器里裁出一个新文件。它不依赖编辑器、项目和时间线，也不会上传视频。

## 最小用法

组件只负责选区和裁剪，按钮、进度、读数、结果展示都由宿主自己渲染。

```tsx
import { useRef, useState } from "react";
import { VideoTrimmer, type VideoTrimmerHandle } from "@basic-video-editor/editor";

function Trim({ file }: { file: File }) {
  const trimmer = useRef<VideoTrimmerHandle>(null);
  const [status, setStatus] = useState({ ready: false, trimming: false, progress: 0 });

  return (
    <>
      <VideoTrimmer ref={trimmer} file={file} onStatusChange={setStatus} />
      <button disabled={!status.ready || status.trimming}
        onClick={() => trimmer.current?.trim().then(({ file }) => upload(file))}>
        {status.trimming ? `${Math.round(status.progress * 100)}%` : "Trim"}
      </button>
      {status.trimming && <button onClick={() => trimmer.current?.cancel()}>Cancel</button>}
    </>
  );
}
```

`trim()` 返回裁好的新文件（`<原名>-trimmed.mp4` 或 `.webm`）和选区起止秒数。示例页面 `examples/next/app/trim/page.tsx`（`/trim`）是宿主侧的完整演示：选择或拖入视频、深浅色切换、用 `onRangeChange` 渲染的开始 / 长度 / 结束读数、取消和裁剪按钮、裁剪结果预览和下载。这些都是页面自己写的，不属于组件。

## 组件包含什么

| 部分 | 说明 |
| --- | --- |
| 预览 | 视频画面、播放或暂停按钮（带当前时间）、声音开关 |
| 时间刻度 | 缩略图条上方，自动选择间隔 |
| 缩略图条 | 真实帧、选区外变暗、左右手柄（悬停显示时间气泡） |

组件不渲染按钮（取消、裁剪）、进度、选区读数、错误文字、标题、文件选择、结果预览和下载，这些由宿主自己决定。信息通过事件和 `ref` 给出。

## 属性

| 属性 | 说明 |
| --- | --- |
| `file` | 源视频 `File`，只在浏览器内读取 |
| `defaultRange` | 初始选区（秒），默认整段 |
| `onRangeChange(range, { duration })` | 选区变化：视频加载完成时先发出一次初始选区，之后拖动和键盘调整时持续发出。第二个参数带视频总时长，宿主可据此判断选区是否被改动。读数由宿主用它自己渲染 |
| `onStatusChange` | `{ ready, trimming, progress }`：是否可以裁剪、是否正在裁剪、进度（0 到 1）。用它控制自己的按钮 |
| `onError` | 视频读取或解码失败。此时组件不渲染任何内容，需要宿主自己显示提示 |
| `bare` | 去掉外层卡片（背景、边框、内边距），放进自己的弹窗或面板时使用 |
| `previewMaxHeight` | 视频预览最高多少像素，默认 352 |
| `minDuration` / `maxDuration` | 选区最短、最长秒数，默认最短 0.1 秒，最长不限制 |
| `theme` / `defaultTheme` / `appearance` / `density` | 与编辑器相同的主题接口，默认浅色、宽松密度 |
| `className` / `style` / `fallback` | 样式和加载占位 |

`ref`（`VideoTrimmerHandle`）：

| 方法 | 说明 |
| --- | --- |
| `trim()` | 用当前选区裁剪，resolve 为 `{ file, start, end, duration }`。被 `cancel()` 打断时 reject 为 `TrimCanceledError`（可从包里导入），裁剪失败时 reject 对应错误 |
| `cancel()` | 中止正在进行的裁剪 |
| `reset()` | 恢复成整段视频（受 `maxDuration` 限制），预览回到第一帧 |
| `getRange()` | 当前选区 `{ start, end }`，视频还没加载完时是 `null` |

只想要裁剪函数、不要界面：

```ts
import { trimVideo } from "@basic-video-editor/editor";
const { file } = await trimVideo({ file, start: 2.5, end: 8, onProgress, signal });
```

## 交互

- 拖动左右滑块调整起止；拖动选区中间整体平移。
- 缩略图条上方是时间刻度，主刻度间隔自动选择（0.1 秒到 2 小时的整齐间隔），保证整条约分成 5 到 6 段、标签间距不小于 56px，所以 5 秒和 5 分钟的视频看起来疏密一致，主刻度带时间标签，之间按 3 到 6 等分补小刻度（偶数等分时中间一格略高）。
- 预览不会自动播放：拖动时画面跟随手柄，松手后停在选区起点，需要手动点击预览或播放按钮才播放（在选区内循环）；右下角可静音。
- 键盘：聚焦滑块后，方向键微调 0.1 秒，Shift 加方向键 1 秒，Home / End 到两端。
- 缩略图条是均匀取自整段视频的真实帧，随容器宽度重新生成。

## 实现与限制

- 解码、取帧和裁剪都用 Mediabunny（WebCodecs），不需要 ffmpeg.wasm。
- 输出容器：源文件是 webm / mkv 时输出 webm，其余输出 mp4。
- 浏览器需要支持 WebCodecs；读不了或不能解码的视频会触发 `onError`，组件不显示任何提示。
- 裁剪在主线程调度，较长视频耗时与重编码相关；进度通过 `onStatusChange` 给出。
- 预览用 `<video>` 元素播放，能否播放取决于浏览器自身的编解码器支持。

源码：`packages/editor/src/trimmer/`（`trim-math.ts` 纯逻辑，有测试；`trim-file.ts` 读取、取帧、裁剪；`video-trimmer-view.tsx` 界面）。

## 导入时剪辑

编辑器里导入含视频的文件时（资产面板的 Import 和拖入、时间线上拖入文件、粘贴），先弹出剪辑弹窗，用的就是这个组件：

- 一次导入多个视频时，弹窗下方是缩略图列表，点击切换；每个视频各自保存选区，切走再切回来选区还在，被裁过的视频缩略图上显示保留的时长。
- **Reset** 把当前视频恢复成整段（没有改过时是灰的）。
- **Import all** 一次确认全部：改过选区的视频逐个裁剪（按钮显示 `Trimming 2/3 · 40%`），没改过的原样导入，图片和音频不经过弹窗，直接一起导入。
- **Cancel** 或关闭弹窗：这批文件一个都不导入。
- 裁出的文件名是 `<原名>-trimmed.<扩展名>`；浏览器解不了的视频会提示「无法预览，原样导入」。
- 不想要这个弹窗：`<VideoEditor trimOnImport={false} />` 或 `<ProjectEditor trimOnImport={false} />`。程序化的 `editor.importMedia(files)` 不会弹窗。

实现：`media/import-trim.ts`（请求与结果，导入的三个入口都先调用 `requestImportTrim`）、`components/editor/import-trim-dialog.tsx`（弹窗）。
