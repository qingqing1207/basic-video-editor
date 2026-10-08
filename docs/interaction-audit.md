> 2026-09-30 更新：下文多场景相关记录属于删除前的历史验收。当前已移除全部多场景功能，改为单时间线工程；本次结果见 [single-timeline.md](single-timeline.md)。

# 素材拖放故障与整体复查（2026-09-30）

本次复查由“素材无法从素材区拖到轨道”触发。它是迁移引入的真实缺陷。此前仅把失败列为自动化未覆盖，没有继续追查，不足以证明交互保留正确。

## 已确认并修复的问题

| 问题 | 原因 / 修复 | 实测证据 |
| --- | --- | --- |
| 素材原生拖放立即中断 | DraggableItem沿用原版document.body portal，但抽离版CSS已限定.bve-scope；拖动预览失去fixed、pointer-events:none等规则。改为EditorUIContext提供的自有portalContainer，保留原拖放控制器和算法 | 修复前dragstart后约3ms出现dragend，无drop；修复后视频、图片、音频均实际鼠标拖入Vite和Next，网格/列表均覆盖。drag-native-events.json、drag-preview-fixed.png |
| 音量拖动提示脱离样式作用域 | 同样的body portal遗漏，改用自有容器 | 音量线拖动0→15dB，提示fixed、pointer-events:none，一次撤销回0 |
| 中断素材拖动后残留状态 | 素材组件卸载、视图卸载、项目切换时没有统一结束dragSource | 补齐清理；20轮生命周期新增active DataTransfer拖动后卸载断言，drag-repair-lifecycle.txt |
| Next刷新每次新建工程 | 示例启动直接newProject | 按当前命名空间updatedAt打开最近工程；生产页面刷新恢复3素材、4轨道、6片段、6秒工程 |
| Vite恢复工程不确定 | 直接打开IDB列表第一项 | 启动按updatedAt降序；补充初始化取消检查，避免卸载后的异步挂载 |
| 首次重开时播放头归零 | 缺失工程缩略图时，加载阶段补图保存捕获尚未恢复的当前播放头0 | 该元数据保存保留已存视图状态；20轮回归断言保存120000tick后，重开补图仍保留120000tick |
| Dialog关闭按钮残留Radix状态样式 | data-[state=open]不是当前Base UI状态属性 | 改为data-open；扫描保留UI未再发现同类旧属性 |

所有自定义React portal入口已检查；Base UI浮层继续使用编辑器自有容器。新增产物审计规则拒绝自定义portal直接挂到body/documentElement，防止这类作用域脱离再次发生。没有重写拖放、裁剪、吸附、坐标换算或时间计算算法。

## 源码完整性检查

固定原版提交cf5e79e919144200294fb9fed22a222592a0aeea，原仓库仍干净。对保留目录逐一比较文件清单，包含animation、commands、timeline、preview、media、masks、params、speed、retime、selection、clipboard、subtitles、text、guides、canvas、background、components/editor、core、services/renderer。

这些目录中缺失的原文件全部属于计划删除的特效/图形/贴纸分支，或移动端门禁、首次引导；没有发现整块保留功能文件漏拷贝。清单见evidence/retained-directory-inventory.txt。移动端门禁和首次引导属于本地桌面基础项目的有意删减。

归一化源码快照有291份相同文件、162份有差异文件、21份新文件；差异数量不等于缺陷数量，也不代表逐行都已经完成运行时验收。本轮进一步检查动画、命令、参数、ripple、拖放/裁剪/seek控制器、时间线hooks和元素构造器的格式归一化diff：保留算法一致，主要差异是删除指定类型、依赖替换、存储及生命周期处理。证据为retained-algorithm-review.diff；选择、画布坐标、颜色/时间输入等另见migration-risk-diffs.txt。

## 保留功能检查范围

| 功能组 | 当前证据 |
| --- | --- |
| 导入、网格/列表、排序、素材拖放、图片粘贴 | 原版/抽离版真实素材；本次新增三类型实际鼠标拖放、列表拖放，宿主原生dialog中图片与文字预设拖放 |
| 裁剪/延长、分割、移动、跨轨、多选、框选、吸附、缩放、边缘滚动 | 原版对照见interaction-baseline.md；本次Next再测1秒分割与撤销/重做、5秒图片裁到4秒并撤销 |
| 复制粘贴、波纹删除、撤销分组、播放头 | 原版对照与命令测试；本轮增加初次打开补图时的播放头持久化回归 |
| 画布移动/旋转/缩放、预览缩放平移 | 原版相同位移、缩放和旋转数值、撤销结果对照 |
| 音量/静音/音频分离/速度/保调 | -6dB、2x、分离后导出音视频对照；本次另测音量线上拖动与一次撤销 |
| 字幕/文字/字体 | SRT/ASS及解析警告、缺失字体提示、宿主字体；本次Next本地SRT，字体选择器搜索Inter，dialog中Default text拖入新轨 |
| 关键帧/曲线/蒙版 | X关键帧Ease out半秒值84；Ellipse羽化10完整导出逐帧对照；本次Next添加/删除Text蒙版。未穷举所有蒙版形状 |
| 背景颜色/渐变/模糊 | 原版自定义色与渐变选择、正方形Medium blur导出对照 |
| 多场景/书签/设置/面板尺寸 | 原版UI对照；场景创建/重命名/撤销/切换通过原命令API检查 |
| 保存恢复/失败/取消/卸载 | 最新20轮真实媒体；替代仓库、配额失败、缺失素材、转录/导出取消、字体释放、残留监听和Blob URL计数 |
| Base UI及宿主集成 | 焦点恢复、Esc、右键、快捷键边界、原生dialog、自定义portalContainer、明暗主题、宿主样式隔离 |
| MP4/WebM/离线 | 此前四组原版对照各180帧一致；音频PCM对照；离线VP9 WebM。本次Next拖放工程真实导出H264/AAC、180帧、容器时长6.083628秒 |

本次Next验收使用/verification及独立存储空间，没有修改正常Next示例中用户导入的工程。产物包括drag-repair-next.mp4、probe JSON、恢复后的AX状态和截图。修复后的宿主弹窗截图见drag-repair-host-dialog.png。

## 仍未覆盖的边界

- 操作系统文件管理器直接拖入浏览器；不与已验证的“素材面板→轨道”混为一项。
- 真实OS输入法候选框、选词、组合取消；之前只验证浏览器组合事件。
- 原生HTML素材拖动中的Escape：自动化发送按键在原版与抽离版均没有取消原生拖动会话，未标记通过；内部片段拖动Esc已通过。
- 所有蒙版形状、曲线手柄组合、画布辅助线及快捷键组合尚未穷举。
- Safari只完成能力检测和生命周期，Firefox首次协议尚未确认；不声称所有浏览器功能通过。

因此结论是：已修复本次明确故障，并补齐同类浮层、工程恢复及拖动生命周期遗漏；不能宣称所有可能操作组合都无缺陷。原版当前版本本就没有素材搜索框、创建场景UI；替换素材当时为原版禁用入口，后续已按用户要求删除菜单和相关拖放占位链路；这些并非漏拷贝。更完整的原版实现边界见features.md。

## 构建验证

最终编辑器类型检查、85项单元测试、Vite/Next生产构建、依赖/产物/portal归属审计通过。重新打包tgz并安装到独立npm消费者，类型检查与生产构建通过，安装后的484个产物文件与本地逐个比较，内容全部相同（package-consumer-content.json）。保留原版目录不进入运行或构建依赖。Vite仍提示大chunk体积，该提示不是交互通过的证据，也未在本次将其称为已优化。


## 2026-09-30：删除替换素材预留功能

删除片段菜单中的替换素材入口和专用图标引用；删除素材拖动数据的 targetElementTypes、DropTarget 的目标片段字段、命中判断、执行空分支，以及目标片段高亮／透明度和隐藏插入线的逻辑。蒙版和 Reveal media 保留。原版只读仓库未修改。

拖到已有片段区域现在统一走原 resolveTrackPlacement 插入算法，不修改原片段。新增 3 个回归案例覆盖视频、图片拖到占用区域及空主轨插入，全部 96 个测试通过。类型、编辑器包、Vite／Next 生产构建和包审计通过；源代码、声明、source map 和示例前端产物扫描无相关入口及字段残留，editor tgz 已重打包。

实际 Chromium 验证：Vite 中右键视频片段，只显示 Reveal media；Next verification 将 timecode.mp4 从素材库拖到已有视频片段区域，显示插入线，松手生成新轨道，原两个视频片段保留；Ctrl+Z 后恢复原四轨工程、6 秒时长和缩放值，未捕获运行错误。截图 evidence/replace-media-removed.png。
