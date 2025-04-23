# 程序使用说明

1 使用TetrisAI-Web.zip包解压缩后右击index.html选择OpenwithLiveServer实现查看程序网页
程序难度在index.html中调整

2 用cmd打开项目文件夹 cd "绝对路径" 后输入命令node index.js（需要安装Node）
程序难度和相关参数在index.js中调整

# 关于GA遗传算法的参数

可以直接修改index.js里的参数来控制算法迭代速度

```js
tuner.tune({
  population: 100,  // 种群大小
  rounds: 5,     // 每个候选解的回合数
  moves: 200     // 每回合的最大步数
});
```



感觉后面的这些大抵不会有人看了我也不更新了...

# ai.js

AI 生成过程
    ↓
构造函数 `AI(weights)`
    ├── 保存权重：heightWeight, linesWeight, holesWeight, bumpinessWeight
    └── 用于后续决策评分

递归决策：_best(grid, workingPieces, workingPieceIndex)
    ↓
1. 遍历所有旋转：最多 4 个方向
    ├── 旋转当前方块
    └── 模拟每个方向的合法位置

2. 判断每个合法位置
    ↓
    计算每个位置的“得分”：加权评分（高度、消行、空洞、不平整度）
    ↓
    如果当前不是最后一个方块（workingPieceIndex != 2）
    → 递归，计算下一方块放置的得分（提前预测）

3. 选择最佳得分位置
    ↓
    返回“最优的放置方块” (piece) 和 该位置的得分 (score)

对外接口：`best(grid, workingPieces)`
    ↓
    直接调用 `_best(grid, workingPieces, 0)`，返回最优方块（`piece`）

# game_manager.js

GameManager()
├── 初始化 DOM 元素 & canvas context
├── 初始化对象（grid, rpg, ai, timer, score）
├── 监听键盘事件 onKeyDown()

游戏流程入口：
startTurn()
├── workingPieces 队列向前推进
├── workingPiece ← workingPieces[0]
├── redrawGridCanvas()
├── redrawNextCanvas()
├── if AI 模式:
│   ├── isKeyEnabled = false
│   ├── workingPiece ← ai.best(...)
│   └── startWorkingPieceDropAnimation(callback)
│       ├── 动画播放中持续调用 redrawGridCanvas(offset)
│       └── 动画结束后：
│           ├── workingPiece.moveDown() 到底
│           ├── if !endTurn() → Game Over
│           └── startTurn() （进入下一轮）
└── else 玩家控制模式：
    ├── isKeyEnabled = true
    └── gravityTimer.resetForward(500)

onKeyDown(event)
├── 判断 isKeyEnabled
├── switch(event.which)
│   ├── 空格 → startWorkingPieceDropAnimation(...)
│   ├── ↓ → gravityTimer.resetForward(500)
│   ├── ←/→ → 移动 & redraw
│   └── ↑ → 旋转 & redraw

onGravityTimerTick()
├── if canMoveDown → moveDown() + redraw
├── else：
│   ├── gravityTimer.stop()
│   ├── if !endTurn() → Game Over
│   └── startTurn()

endTurn()
├── grid.addPiece(workingPiece)
├── score += grid.clearLines()
├── redrawGridCanvas()
├── updateScoreContainer()
└── return !grid.exceeded()

辅助功能：
redrawGridCanvas(offset=0)
├── 清空画布
├── 绘制 grid 中所有砖块
└── 绘制 workingPiece（带偏移）

redrawNextCanvas()
├── 清空 next-canvas
└── 绘制 workingPieces[1]（预览）

updateScoreContainer()
└── scoreContainer.innerHTML = score

startWorkingPieceDropAnimation(callback)
├── 计算 animationHeight
└── 使用 Stopwatch 播放平滑掉落动画

cancelWorkingPieceDropAnimation()
└── 如果有动画在播，stop + 清除引用

按钮控制：
aiButton.onclick()
├── 切换 AI 模式
├── 如果切到 AI → 播放动画 → endTurn() → startTurn()
└── 改变按钮颜色

resetButton.onclick()
├── stop gravity + 动画
├── 重置 grid / rpg / workingPieces / score
└── startTurn()
