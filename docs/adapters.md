# 替换存储、字体和转录

所有适配器通过 `createEditor` 注入，不在编辑器内部绑定业务服务。

## 存储

编辑器需要的接口很小：`ProjectRepository` 提供 `read/save`；`AssetRepository` 提供 `list/read/save/delete`。完整签名见 `packages/editor/src/api/adapters.ts`。项目 JSON 使用 `SerializedProject`，素材保存 `{metadata,file}`；`metadata.id` 是稳定引用，临时 Blob URL 和 AudioBuffer 不持久化。

宿主的项目列表还需要「目录」能力，对应扩展接口：`ProjectStore`（再加 `list/delete`）和 `AssetStore`（再加 `deleteProject`）。**编辑器从不调用这些方法**，它们只供宿主自己的列表页使用；`createBrowserRepositories` 返回的就是完整的 `ProjectStore` / `AssetStore`。

默认 `createBrowserRepositories({namespace})` 使用 IndexedDB 存项目/素材元数据，OPFS 存二进制。默认 namespace 为 `basic-video-editor-v1`，偏好设置也使用命名空间。不同宿主请指定自己的 namespace。OPFS 要求安全上下文（HTTPS 或 localhost）；不可用时显示错误，没有静默退回易丢失存储。

```ts
// 列表页：直接用浏览器仓库
const { projects, assets } = createBrowserRepositories({ namespace: 'host-v1' });
// 剪辑页：<ProjectEditor projectId={id} storageNamespace="host-v1" />，默认就是同一份浏览器存储
// 底层 API 仍可注入自定义仓库：createEditor({ projects, assets, storageNamespace }) —— 不是当前支持和验证的路径
```

新建项目：`await createProjectRecord({ name })` 得到可直接保存的记录，不需要编辑器实例。

仓库 Promise 必须在写入真正提交后 resolve，失败时 reject；找不到记录时 read 返回 null。不要吞掉配额或权限错误。仓库应保证单条记录保存的原子性；跨工程/素材的业务事务（例如复制项目和它的素材）由宿主自行设计。本次不提供远程后端。

可运行的内存替代仓库及失败注入见 `tests/project-actions.test.ts`：它验证复制（先复制素材再提交记录、失败回滚）、删除（素材删除失败时保留记录）和重命名。

## 字体

默认系统字体加随包 Inter（400/700）。中文字符依赖系统字体回退；若需跨设备完全一致，应提供覆盖对应字符的本地字体。

```ts
const fonts: FontProvider = {
  async list() {
    return [{value:'Host Sans',label:'Host Sans',category:'custom',weights:[400]}];
  },
  async load(family) {
    if (family !== 'Host Sans') throw new Error('Unknown font');
    return [await new FontFace(family, 'url(/fonts/host-sans.woff2)').load()];
  },
};
```

返回的 FontFace 由编辑器注册并在销毁时移除。宿主负责资源地址、授权和离线可用性。缺失字体会通知并回退到 Inter，不请求 Google Fonts；默认实现没有在线字体目录。

## 转录

无 provider 时仍可导入 SRT/ASS，自动转录显示未配置。ASS 的不支持标签/事件效果保留解析警告；并非完整 ASS 排版引擎。

```ts
const transcription: TranscriptionProvider = {
  async transcribe({audioData,sampleRate,language,signal,onProgress}) {
    signal.throwIfAborted();
    onProgress?.({status:'transcribing',progress:0,message:'Preparing'});
    // 调用宿主自己的本地或远端实现，向下传递 signal。
    const segments = await myRecognizer({audioData,sampleRate,language,signal});
    signal.throwIfAborted();
    return {text:segments.map(s=>s.text).join(' '),segments,language:language ?? 'auto'};
  },
};
```

音频输入是单声道 Float32Array，当前字幕流程重采样为 16000 Hz；以收到的 sampleRate 为准。segment 的 start/end 单位是秒。提供方必须响应 AbortSignal 并停止资源/网络工作。编辑器在切换工程、卸载、销毁时取消，且不采用已经取消任务的结果。未包含 Transformers、Whisper Worker 或模型下载。
