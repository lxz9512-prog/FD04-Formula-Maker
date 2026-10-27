# 交接文档 · 智能调奶器交互演示（FD04）

> 最后更新：2026-10-27
> 适用仓库：`lxz9512-prog/FD04-Formula-Maker`
> 本文档面向**接手这个 Demo 的同学**：先看第 1、2 节搞清"这是什么、代码在哪"，再看第 4 节了解本轮改了什么，动手改前务必读第 5 节。

---

## 1. 30 秒速览

| 项目 | 内容 |
| --- | --- |
| 是什么 | 智能调奶器 App 的高保真交互原型，纯前端 + localStorage 模拟数据，用于方案演示 / 页面评审 / 交互流程验证 |
| 线上地址 | <https://lxz9512-prog.github.io/FD04-Formula-Maker/> |
| 源码在哪 | 仓库 `main` 分支 |
| 产物在哪 | 仓库 `gh-pages` 分支（**默认分支**，GitHub Pages 从这里构建） |
| 技术栈 | React 19 · TypeScript · Vite 7 · React Router(HashRouter) · Tailwind 4 · Framer Motion · lucide-react · ECharts |
| 页面数 | 36 条路由，全部在 `client/src/app.tsx` |
| 无后端 | 没有真实接口，所有状态存 localStorage，刷新页面数据仍在 |

**新接手请先做这一步**：打开线上地址，左侧「Demo 目录」就是全部页面清单，右侧「交互说明」是每个页面的设计规则。

---

## 2. 仓库拓扑（最容易搞错的地方）

```
GitHub: lxz9512-prog
├── FD04-Formula-Maker          ← 在用的仓库
│   ├── main       = 源码（React 工程）
│   └── gh-pages   = 构建产物（静态站，默认分支，Pages 源）
│
└── FD04-Formula-Maker_old      ← 已归档的旧版（React 全栈工程版），别再改
    └── main       = 旧工程源码，Pages 也还开着
```

三个必须知道的事实：

1. **`main` 里的包名、部分文案仍是 FD06**。这个仓库的 `main` 是从 `FD06-Formula-Maker` 克隆过来的，内容被改造成了 FD04 的产品演示。所以你会看到 `package.json` 里写着 FD06、`README.md` 标题是 "FD06 Formula Maker Demo"——这是历史遗留，**不影响运行**，除非要做品牌统一，否则不要动。
2. **`gh-pages` 不是自动生成的**。改完 `main` 必须手动构建 + 把产物推到 `gh-pages`，线上才更新（见第 6 节）。
3. **`_old` 仓库只是存档**。它唯一的用处是保留了旧版的产品图资源（`client/src/assets/fd06-device.png`，现已复制到新仓库作为 `fd04-device.png`）。

---

## 3. 目录与关键文件

| 路径 | 作用 | 改它的频率 |
| --- | --- | --- |
| `client/src/app.tsx` | 全部路由定义 | 加页面时改 |
| `client/src/components/Layout.tsx` | 桌面端三栏框架 + **左侧 Demo 目录结构**（`navItems`） | 加页面时改 |
| `client/src/components/IPhoneFrame/` | 手机外框、状态栏、右侧全局控制条（中/EN、ml/oz、Reset、连接线开关）、`overlay` 插槽 | 少改 |
| `client/src/i18n/LanguageContext.tsx` | **所有中英文文案字典**（一个巨型 `translations` 对象） | 每个需求都要改 |
| `client/src/contexts/VolumeUnitContext.tsx` | ml / oz 单位上下文与换算 | 少改 |
| `client/src/pages/BabyFormulaMaker/` | 设备控制页（最核心、最大的页面，约 1700 行）+ `control-page.css` | 高频 |
| `client/src/pages/Demo/FormulaRatio/` | 粉水配比：列表页、拍照/手动/编辑配比页、**数据模型 `formulaProfiles.ts`** | 高频 |
| `client/src/pages/Demo/FormulaRatioSync/` | 本轮新增的「配比同步异常」页 | — |
| `client/src/pages/DeviceCleaning/` | 管路清洁页（深度除垢 + 高温杀菌全流程） | 高频 |
| `client/src/pages/{WaterLowError,PowderError,...}/` | 一批"异常态"薄壳页，实现是 `<BabyFormulaMaker xxx />` 传一个 prop | 低频 |
| `scripts/fill-static-placeholders.mjs` | 构建后处理：填占位符 + 生成 404.html | 部署用 |
| `client/src/assets/` | 本地图片资源 | 低频 |

**薄壳页模式**说明：像「水量不足异常」这种页面，自己没有 UI，只是 `<BabyFormulaMaker waterLow />`，靠 prop 打开控制页内的某个告警浮层。新增同类异常态时照这个模式写一个 6 行的文件即可。

---

## 4. 本轮改动记录（2026-10-27）

对应提交：`main` → `b8f7af2`（源码）、`gh-pages` → `3acc18e`（产物）

### 4.1 设备控制页：删指标 + 水量改成纯颜色档位

**需求**：删掉控制页的奶粉余量、水质状态、混合仓使用次数，只留水箱；水量不显示数值、不显示"低/中/高"文字，改用颜色表达，点开后再做说明。

**结果**：
- `.control-resources` 只保留水箱一项，套 `control-resources--single` 居中
- 三色段式指示条：低 `#D2382A` / 中 `#C47910` / 高 `#1F63AC`；非当前档 38% 透明度、5px 高，当前档 100% 透明度、7px 高
- 档位阈值：`waterAmount / waterCapacity` → `<0.3` 低、`<0.7` 中、其余 高
- 点击后的气泡：水滴图标（与标题行垂直居中，图标中心 y 与文字中心 y 对齐）+ 标题「水箱水量：高」+ 三色图例；**不再有**状态描述句和"颜色由左到右递增"的说明

**涉及文件**：`pages/BabyFormulaMaker/BabyFormulaMaker.tsx`、`pages/BabyFormulaMaker/control-page.css`

**坑**：这个气泡走的是 `showSimpleResourceTip` 分支，**不是** `resourcePopup === 'water'` 的 legacy 详情面板（legacy 面板被 `SHOW_LEGACY_*` 常量关掉了）。改错分支会看不到任何变化。

### 4.2 产品图换成 FD04 的机器

`FD04-Formula-Maker_old` 里的唯一产品图（白色立式机型）复制为 `client/src/assets/fd04-device.png`，并把 4 处 import 全部指向它：`BabyFormulaMaker`、`DeviceList`、`DeviceDetail`、`DeviceSettings`。

> 遗留：`assets/fd06-device.png`、`assets/fd06-control-device.png`、`fd06-descaling-side.png`（管路清洁的侧视图）已无引用或仍为 FD06 素材，文件保留未删。**管路清洁页的侧视图没有 FD04 版本可换。**

### 4.3 新增页面：「配比同步异常」

**需求**：机器端被手动改了粉水配比，App 要提示用户并允许把这个配比同步到某条已有配比里。

**入口**：路由 `/formula-ratio-sync`，Demo 目录 → 设备控制 → **配比同步异常**（`AlertTriangle` 图标，子菜单最后一项）

**交互**：
1. 进页面即弹窗：标题「机器端配比已变更」，正文带高亮的机器端配比 `9.5 g : 3 oz`（`DEVICE_RATIO` 常量），再问「是否同步到 App 的粉水配比中？」
2. 两个按钮：
   - **选择配比同步**（主）→ 关闭弹窗，底部抽屉上滑，列出 6 条配比（含「当前使用」标记），单选打勾后点「确认同步」
   - **忽略**（次）→ 只关弹窗，直接回控制页，不改任何数据
3. 抽屉底部还有 **新增** → 跳 `/formula-edit?mode=manual`（已有的手动填写配比页）
4. 同步成功后屏幕中央 toast：「已同步到当前配比」或「已同步到 {品牌}」
5. 背景就是**设备控制页**，弹窗关闭时背景可以正常交互（点水量±、开始调奶都行）
6. 手机框右侧的 🔔 按钮可以重放弹窗，方便反复演示

**涉及文件**：`pages/Demo/FormulaRatioSync/FormulaRatioSync.tsx`（新增）、`app.tsx`、`Layout.tsx`、`i18n/LanguageContext.tsx`

**实现要点**（这段很有参考价值，新页面可复用）：
- 页面不自己包 `IPhoneFrame`，而是渲染 `<BabyFormulaMaker />`（它自带外框），再叠一层**坐标对齐屏幕**的浮层：
  ```tsx
  <div className="relative w-[393px]" style={{ height: 852 }}>
    <BabyFormulaMaker />
    <div className="pointer-events-none absolute overflow-hidden rounded-[46px]"
         style={{ left: 8, top: 8, width: 377, height: 836, zIndex: 40 }}>
      {/* 弹窗 / 抽屉 / toast 放这里，各自加 pointer-events-auto */}
    </div>
  </div>
  ```
- **不要用 shadcn 的 Dialog / Sheet**：它们 portal 到 `document.body`，会跑到手机外框外面。要么像上面这样自绘，要么用 `IPhoneFrame` 的 `overlay` 插槽。
- 控制页里 `isPrimaryControlPage = location.pathname === '/device'`，在新路由下为 false，所以即使 localStorage 没配过配比也会直接显示完整控制台（不会掉进"首次配置"引导），正好适合当背景。

### 4.4 管路清洁：三处流程补全

**涉及文件**：`pages/DeviceCleaning/DeviceCleaning.tsx`、`i18n/LanguageContext.tsx`

| # | 需求 | 实现 |
| --- | --- | --- |
| 1 | 点「深度除垢模式」先二次确认 | 不再直接进准备页，先弹「开始深度除垢？／深度清洁大约需要 15 分钟。开始后不能中止清洁，但仍可以使用 App 的其他功能。」按钮 **继续 / 取消** |
| 2 | 高温杀菌开始后左上角缺返回 | 原本 `currentStep !== 'running'` 把返回箭头整个藏掉了；现在只对"高温杀菌进行中"放开，点击弹「退出清洁？／退出后将返回设备设置页面，当前清洁进度不会保留。」→ **退出** 清计时器并跳 `/device-settings`，**取消** 留在页面且倒计时继续 |
| 3 | 除垢进行中底部加「返回首页」 | `renderDescalingRunning` 里加白底描边按钮（`mt-auto` 吸底），阶段 1 / 阶段 2 都有，跳 `/`（设备列表）；完成态不显示（那里保持原有「返回设置」） |

**实现要点**：两个弹窗共用一个状态 `dialog: 'startDescaling' | 'exitSterilization' | null` + 一个 `renderDialog()`，通过 `IPhoneFrame` 的 `overlay` 插槽渲染（该插槽在屏幕层、不会被内容滚动裁剪）。

---

## 5. 改代码前必读的约定

### 5.1 新增一个页面要改 3 个地方

1. `client/src/pages/...` 新建组件（用 `IPhoneFrame` 包一层，参考 `pages/NightWaterLow/`）
2. `client/src/app.tsx` 加 `<Route path="xxx" element={<Xxx />} />`
3. `client/src/components/Layout.tsx` 的 `navItems` 里加目录项（顶格项写 `path/label`，子菜单项塞进对应 `children`）
4. 文案同时补 `i18n/LanguageContext.tsx` 的 zh / en 两份

### 5.2 手机框 `IPhoneFrame`

```tsx
<IPhoneFrame background="#F7F7F7" overlay={<某浮层 />}>
  {页面内容}   {/* 内容区自带 overflow-y-auto、底部留了 34px */}
</IPhoneFrame>
```

- 固定 393 × 852，屏幕区 `inset: 8` → 实际内容区 377 × 836，圆角 46px
- `overlay` 是唯一正确的"模态层"位置：在屏幕层、不被滚动裁剪、层级高于内容
- 外框右侧自动带全局控制条（中/EN、ml/oz、Reset、连接线开关），不要再自己实现一份

### 5.3 文案一律走 `t()`

```tsx
const { t, language } = useTranslation();
t('cleaning.exitTitle')                       // 静态
t('demo.formulaRatio.scoopInfo', { scoopGrams, water })  // 带参数，模板里写 {scoopGrams}
```

字典是扁平 key 的对象，缺 key 时 `t()` 会直接返回 key 本身（页面上就会看到一串英文 key，属于明显信号）。新增页面统一加前缀，例如 `demo.formulaRatioSync.*`。

### 5.4 单位 ml / oz

不要自己写死单位。用：

```tsx
const { unit } = useVolumeUnit();
formatVolumeFromOz(value, unit)   // 内部按 oz 存储，按当前单位显示
formatVolumeFromMl(value, unit)
```

历史数据里：**水量一律按 oz 存**，毫升只是显示层换算（`ML_PER_OZ = 29.5735`）。

### 5.5 配比数据模型（`pages/Demo/FormulaRatio/formulaProfiles.ts`）

```ts
FormulaProfileListItem = { id, brand, productLine, ageRange, powderPerScoop, waterPerScoop, addedAt }
```

- 列表是**固定 6 条默认配比**（kabrita / aptamil / nan / similac / enfamil / hipp），`readFormulaProfiles()` 永远基于 `DEFAULT_FORMULA_PROFILES` 与 localStorage 里的值做合并
- `readSelectedFormulaId()` 读当前使用的那条
- `setActiveFormulaProfile(profile)` 切换"当前使用"
- `updateFormulaProfile(id, data)` 改某一条；如果改的正好是当前使用的那条，会顺带刷新 `formula_profile` 并派发 `formulaProfileUpdated` 事件（控制页监听这个事件实时刷新）
- ⚠️ **没有 `addFormulaProfile`**：这个数据模型目前不支持"新增第 7 条"，详见第 8 节

### 5.6 视觉规范

暖白/浅米色背景、棕色主色 `#8B4A1B`、白色大圆角卡片（16–26px）、柔和阴影。状态色见 `client/src/tailwind-theme.css`。字体、圆角、阴影都靠 Tailwind 4 的 arbitrary value 直接写在组件里，没有独立 design token 层。

---

## 6. 本地开发与部署

### 6.1 环境

```
Node.js >= 22
npm >= 10
```

### 6.2 起本地开发

```bash
npm install
npm run dev:client
```

⚠️ 两个注意点：
- **项目根目录没有 index.html**，真正的入口是 `client/index.html`。所以地址通常是 `http://127.0.0.1:<port>/client/`，具体端口看终端输出。
- 如果只想看构建产物效果，可以直接把 `gh-pages` 分支克隆下来用任意静态服务器起，但必须挂在 `/FD04-Formula-Maker/` 子路径下（产物里的资源路径是绝对子路径），否则会 404。

### 6.3 构建 + 部署到线上（四步）

```bash
# ① 构建（注意 base 和 outDir，必须和线上子路径一致）
NODE_ENV=production npx vite build --config vite.config.ts \
  --base=/FD04-Formula-Maker/ --outDir dist-gh

# ② 填占位符 + 生成 404.html（构建产物里有 {{appName}} 之类的平台占位符，不填会直接显示花括号）
node scripts/fill-static-placeholders.mjs dist-gh /FD04-Formula-Maker/

# ③ 把产物同步到 gh-pages 工作目录（另开一个 clone / worktree，检出 gh-pages）
rm -rf ../fd04-pages/assets ../fd04-pages/index.html ../fd04-pages/404.html
cp -R dist-gh/. ../fd04-pages/

# ④ 提交并推送
cd ../fd04-pages
git add -A && git commit -m "Deploy build: <一句话说明>"
git push origin gh-pages
```

推送后 GitHub Pages 会自动构建，通常 **2–4 分钟**。查状态：

```bash
gh api repos/lxz9512-prog/FD04-Formula-Maker/pages/builds --jq '.[0] | {status, commit: .commit[0:7], duration, error: .error.message}'
# status: building → built
```

### 6.4 构建相关已知坑

- **`tsconfig.node.json` 必须存在**（`main` 里已有）。缺了会报 `ENOENT tsconfig.node.json` 直接构建失败。
- **每次构建前先 `rm -rf dist-gh`**。`--outDir` 不会自动清空，旧 hash 的 css/js 会残留，越堆越多。
- 构建完 `index.html` 在 `dist-gh/index.html`（插件会把 `client/index.html` 搬上来），不需要手动移动。
- 产物 `index.html` 里**必然带 mustache 占位符**（`{{appName}}`、`{{{appAvatar}}}`、`{{csrfToken}}` 等），必须跑第 ② 步。
- 单包 2.8MB（gzip ~930KB），构建会报 chunk size 警告，属正常，没做代码分割。

---

## 7. 数据与 localStorage

Demo 没有后端，全部状态在浏览器本地：

| key | 内容 | 写入方 |
| --- | --- | --- |
| `app_language` | `zh` / `en` | 语言切换 |
| `demo_volume_unit` | `ml` / `oz` | 单位切换 |
| `show_interaction_lines` | 交互说明连接线开关 | 全局控制条 |
| `formula_profiles` | 6 条配比的可变字段 | `updateFormulaProfile` |
| `selected_formula_id` | 当前使用的配比 id | `setActiveFormulaProfile` |
| `formula_profile` | 当前生效配比的完整数据（控制页读这个） | `setActiveFormulaProfile` / 手动填写页 |
| `formula_profile_configured` | 是否已完成首次配比配置 | 同上 |
| `feeding_history` | 喂养记录数组 | 新增喂养记录 |
| `mixing_chamber_count` | 混合仓使用次数 | 控制页调奶完成后自增 |

跨组件通信靠 `window.dispatchEvent`：`formulaProfileUpdated`、`interactionLinesVisibilityChange`、`resetMixingChamber`。

> 接手时如果发现"改了没生效"，九成是 localStorage 里存着旧值。点手机框右侧的 **Reset** 按钮（或清 localStorage）再试。

---

## 8. 已知限制与建议待办

按优先级排：

1. **「新增」配比不会真的新增一条**
   `FormulaEdit` 在 `mode=manual` 且非首次使用时，只把数值写进"当前生效配比"（`formula_profile`）然后跳 `/formula-ratio`；不往 `formula_profiles` 追加条目。
   要修：给 `formulaProfiles.ts` 加 `addFormulaProfile(data)`（生成新 id + 追加 + 写 `addedAt`），并让 `FormulaEdit` 在带来源参数（如 `?source=ratio-sync`）时走追加分支。**只影响从"新增"进来的路径，不动扫码/首次使用那两条。**
   另外该页 manual 模式的返回按钮走 `/scan-formula`（因为它是扫码流程的一环），从配比同步页跳过去后按返回不会回到原页面。

2. **管路清洁页的侧视图仍是 FD06 素材**（`assets/fd06-descaling-side.png`），没有 FD04 版本可替换。

3. **`package.json` / `README.md` 仍写 FD06**，品牌不统一；`fd06-device.png`、`fd06-control-device.png` 已成无引用文件可清理。

4. **管路清洁的模拟时长是"演示压缩版"**：深度除垢阶段 1 实际跑 7 秒（文案写"约 5 分钟"），阶段 2 约 5 秒；高温杀菌每轮倒计时从 180 开始、每 100ms 减 1（约 18 秒/轮，共 3 轮）。改文案或提速时注意代码与文案两处不同步。

5. 大量文案是硬编码中文写在组件里的（`language === 'zh' ? ... : ...`），没有全部走 i18n 字典。要做多语言统一需要一轮清理。

---

## 9. 踩坑清单（能省你半天）

| 现象 | 原因 / 解法 |
| --- | --- |
| 改动后页面没变化 | localStorage 存着旧值，点 Reset；或看到的是 `gh-pages` 的线上版本而不是本地 dev |
| 弹窗跑到手机框外面 | 用了 shadcn `Dialog`/`Sheet`（portal 到 body）。改用 `IPhoneFrame` 的 `overlay` 插槽或自绘浮层 |
| 构建报 `ENOENT tsconfig.node.json` | 缺文件，从 `_old` 仓库拿一份 |
| 线上页面白屏 | 产物里资源前缀不是 `/FD04-Formula-Maker/`，或忘了填占位符 |
| 线上还是旧版本 | `gh-pages` 没推 / Pages 还在 building（2–4 分钟）/ 浏览器缓存 |
| `git push` 报沙箱 Keychain 写入失败（exit 137） | 本机沙箱会拦 `/Users/*/Library/Keychains` 写操作，但**推送其实已成功**。用 `git ls-remote origin <branch>` 或 `gh api` 复核，别直接重推 |
| `page.goto()` 跳同一 hash URL 不刷新 | SPA 的 hash 导航不会重载，要重置页面状态用 `page.reload()` |
| 无头浏览器打不开 `github.io` | 本机访问 GitHub Pages 不稳定（`net::ERR_TIMED_OUT`），但 `curl` 正常。验证线上用 curl 拉 index.html 比对资源指纹，截图验证用本地静态服务器按同样子路径起 |
| 用 `grep` 搜 `*.tsx` 偶发搜不到 | 本机环境的 grep 对部分 UTF-8 文件异常，改用 Grep 工具（ripgrep）或 `sed -n` |

---

## 10. 一分钟自查：改完一个需求要做什么

- [ ] 页面能打开、文案中英文都对（切到 EN 看一眼，别只测中文）
- [ ] ml / oz 两种单位都试一下
- [ ] 深链接能直达：`/#/<path>`（HashRouter）
- [ ] 新页面已进 Demo 目录，并能在目录里点进去
- [ ] `npx tsc --noEmit --project tsconfig.app.json` 无报错
- [ ] 构建 + 填占位符 + 推 `gh-pages`，等 Pages `built`，用 curl 核对线上资源指纹
