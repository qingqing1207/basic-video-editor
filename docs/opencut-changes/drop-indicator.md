# 拖动插入指示线与落点对齐

日期：2026-10-05。用户反馈：换轨后的结果正确，但向上拖动时蓝色指示线仍在下面。

## 复现与原因

时间线落点计算使用轨道内容坐标，包含 scrollTop；DragLine 却放在滚动容器外，用累计行高＋表头高度直接定位，没有跟随 scrollTop。滚动越多，蓝线与实际插入边界偏离越多。

本轮在专用测试工程复现：纵向 scrollTop 为 107px，指示线页面 Y 为 833.164，而目标边界 Y 为 726.164，差 107px。另有原先未计入的 2px 内容顶部留白。原始记录见 [修复前坐标](../evidence/drop-indicator-before.json)。

此外，原先命中与指示线均只累计基础行高，关键帧展开后的附加高度没有传入。这会在展开轨道后再次引起偏差。

## 修复

- 将素材拖入和片段移动两条指示线都放入轨道内容的同一个定位／滚动父容器。浏览器直接负责纵向滚动和边界裁切，无需监听 scroll 后再异步纠正位置。
- 行位置与插入线复用 getCumulativeHeightBefore，加上同一份内容顶部留白及关键帧展开高度。
- 片段移动、素材拖入和文件落点的命中计算同样接收展开高度，鼠标坐标扣除内容顶部留白。
- 指示线只在新轨插入时显示；放入已有轨道不显示误导性插入线。
- 没有修改轨道插入策略、碰撞回退、吸附、片段时间计算或此前源空轨原子清理规则。

## 源码

- [时间线布局](../../packages/editor/src/timeline/components/index.tsx)
- [DragLine](../../packages/editor/src/timeline/components/drag-line.tsx)
- [命中及线位置](../../packages/editor/src/timeline/components/drop-target.ts)
- 两个拖动 controller 及 React hook 将 getTrackExpansionHeight 传到同一几何计算中。
- [自动化回归](../../tests/drop-indicator-layout.test.ts)

## 验证

- Chromium/Vite 5201 使用专用测试工程，未操作用户工程。
- 纵向滚动 107px 后，同一目标插入线从错误的 Y=833.164 修正为 Y=726.164，准确贴合文本轨上沿；片段落下后在音轨与文本轨之间。
- 向上拖动：蓝线 Y=599.164，松手后新视频轨顶部同为 Y=599.164，轨道总数不增加。
- 创建位置 X 关键帧并展开后，附加行高 20px；向下插入的蓝线与文本轨顶部同为 Y=746.164。Esc 取消后没有移动或新增轨道。
- 素材面板原生图片拖入：关键帧展开且已滚动时，蓝线 Y=690.164；实际新图片轨顶部同为 Y=690.164。随后撤销测试插入及关键帧。
- 未滚动时首行顶部指示线 Y=493.164，与首轨顶部一致；Esc 取消不改变结果。
- 独立 npm 消费者安装最新 tgz 后，TypeScript 及生产构建通过。
- 新增 10 项几何回归，全套 127 项通过；TypeScript、编辑器构建、Vite/Next 生产构建和包审计通过，editor tgz 已重新生成。
- Next 本轮验证生产构建，不冒充上述浏览器实测；没有重复全部导出和其他浏览器验收。

证据：[滚动后指示线](../evidence/drop-indicator-scrolled.png)、[向上拖动指示线](../evidence/drop-indicator-upward.png)。
