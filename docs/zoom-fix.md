# 时间轴鼠标缩放故障（2026-09-30）

## 原因

Base UI 1.7.0的Slider.Control按values.length > 1判断范围滑块，单滑块的鼠标路径发送number；此前包装器照搬原数组接口，把value设为[number]且直接转交回调。调用处values[0]得到undefined，指数缩放得到NaN，之后加减按钮和滚轮继续运算也无法恢复。

故障页面实际DOM显示缩放输入aria-valuenow="NaN"、标尺aria-valuemax="NaN"；Thumb退化成隐藏的1px元素，刻度不再生成。隔离Next工程点击滑轨中点可稳定复现。相同操作在原版得到0.5。前次键盘Home/End验证没有覆盖鼠标返回值不同的路径，不能代表鼠标缩放可用。

## 修复

- Slider包装器对单滑块明确向Base UI传number，并把onValueChange / onValueCommitted统一转换回编辑器使用的数组接口，鼠标与键盘保持一致。
- ZoomController拒绝非有限数更新，初始异常值回退到有效最小缩放，防止一次错误导致整个时间轴进入不可恢复状态。正常指数缩放、锚点和滚动算法保持原实现。
- 为缩放滑块、放大和缩小按钮添加明确无障碍名称，方便定位与验收。
- 已重新构建编辑器、Vite/Next示例并重启5201/5202；重新打包供集成的tgz。

## 实际浏览器回归

| 路径 | 结果 |
| --- | --- |
| 用户当前27秒工程刷新恢复 | 滑块从NaN恢复0，Thumb恢复16×16，刻度出现，素材/轨道保留 |
| Vite鼠标点击中点 | 0→0.5，标尺/片段显示宽度改变 |
| Next生产鼠标点击中点 | 0→0.5，与原版一致 |
| 鼠标拖动Thumb | Vite 0.5→0.75；Next 0.5→0.25 |
| 加减按钮 | Vite 0.75→0.661374838→0.75；Next 0.25→0.368715008→0.25 |
| 键盘与鼠标交替 | Vite鼠标0.35，ArrowRight→0.355，ArrowLeft→0.35 |
| Home/End | Next达到0和1，保持有效标尺 |
| Ctrl+滚轮 | Next 0→0.022372538，刻度与内容宽度更新 |
| 保存/刷新恢复 | Vite保留0.35；Next自动保存后保留0.5，未再次产生NaN |

原始观察数据：evidence/zoom-failure.json、evidence/zoom-controls-results.json。修复后截图：evidence/zoom-fixed.png。当前Next页面无console error。

新增3项控制器回归测试覆盖无效输入不污染正常缩放、异常保存值恢复；全套88项测试通过，类型检查与两个示例构建通过。真实鼠标回归与这些单元测试分开记录，不以单元测试代替UI验证。独立npm消费者再次构建成功，484个安装产物文件与本地产物逐个一致。

本次同时核查了Checkbox/Switch、Select、RadioGroup、Tabs等包装器的回调接口；未发现本次number/number[]混用在其它保留控件中的重复调用。NumberField仍使用原专用数值拖动算法。此结论是接口检查，不把它扩大为所有控件组合的完整交互验收。
