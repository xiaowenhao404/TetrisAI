function GameManager(sequence, level = 1){
    var gridCanvas = document.getElementById('grid-canvas');//获取 HTML 页面中用来画主游戏区的 <canvas> 元素
    var nextCanvas = document.getElementById('next-canvas');//获取右边用于显示“下一个方块”的画布
    var scoreContainer = document.getElementById("score-container");//获取右侧“当前得分”显示区域的 DOM 元素，用于更新分数文本
    var resetButton = document.getElementById('reset-button');//获取reset按钮
    var aiButton = document.getElementById('ai-button');//获取runai按钮
    var gridContext = gridCanvas.getContext('2d');//获取主游戏区画布的绘图环境（2D）
    var nextContext = nextCanvas.getContext('2d');//这是为“下一块方块”的预览画布准备画图环境
    document.addEventListener('keydown', onKeyDown);//监听整个网页的键盘事件

    var grid = new Grid(22, 10);//显示为18行 第0、1、2、3行用于检测超出失败
    var rpg = new RandomPieceGenerator(sequence);//随机方块生成器(我增加了是否启用随机参数)
    var ai = new AI({//调用ai.js中的AI传参
        heightWeight: 0.510066,
        linesWeight: 0.760666,
        holesWeight: 0.35663,
        bumpinessWeight: 0.184483
    });
    var workingPieces = [null, rpg.nextPiece()];//正在排队要下的方块数组
    //可以改成看到当前方块及预览下4个方块 无需改动startTurn() 可以改动redrawNextCanvas()
    var workingPiece = null;//当前正在操作的方块
    var isAiActive = true;//默认启用AI控制
    var isKeyEnabled = false;//不允许按键操作
    var gravityTimer = new Timer(onGravityTimerTick, 500);//重力定时器 设定下落速度1格/500ms
    var score = 0;

    // Process start of turn
    const startTurn = () =>  {
        skipflag=0;
        // Shift working pieces·更新方块队列
        for (var i = 0; i < workingPieces.length - 1; i++) {
            workingPieces[i] = workingPieces[i + 1];
        }
        workingPieces[workingPieces.length - 1] = rpg.nextPiece();
        workingPiece = workingPieces[0];

        switch (level) {
            case 1:
                // 正常生成方块
                break;
            case 2:
                if(!isRandomHeightAdded)
                this.addRandomHeight(5);  // 在 level 2，添加随机层
                break;
            case 3:
                this.addRandomHeightEveryXSteps(20);  // 每若干步叠加一层
                break;
            case 4:
                this.randomControlPiece(15);  // 随机控制方块的下落位置
                break;
            case 5:
                if(!isRandomHeightAdded)
                this.addRandomHeight(5);
                this.addRandomHeightEveryXSteps(20);
                this.randomControlPiece(20);
                break;
            default:
                // 正常生成方块
                break;
        }

        // Refresh Graphics
        redrawGridCanvas();
        redrawNextCanvas();

        if (isAiActive) {//如果启用AI模式
            isKeyEnabled = false;//禁止键盘操作
            
            if(!skipflag)
            workingPiece = ai.best(grid, workingPieces);//让AI决策
            else{
                // 将方块的颜色全部设置为黑色
            for (let r = 0; r < workingPiece.cells.length; r++) {
                for (let c = 0; c < workingPiece.cells[r].length; c++) {
                    if (workingPiece.cells[r][c] !== 0) {
                        workingPiece.cells[r][c] = 0x444444; // 设置为黑色
                    }
                }
            }
            }
            startWorkingPieceDropAnimation(function () {
                while (workingPiece.moveDown(grid)); // Drop working piece
                if (!endTurn()) {
                    alert('Game Over!');
                    return;
                }
                startTurn();
            })
        } else {
            isKeyEnabled = true;//开启键盘控制
            gravityTimer.resetForward(500);//重置重力下落定时器
        }
        step++;
    }

    // 随机叠加层（level 2）
    this.addRandomHeight = function (randomHeight) {
        for (let i = 0; i < randomHeight; i++) {
            let row = grid.rows - 1 - i;  // 从底部往上开始
            for (let col = 0; col < grid.columns; col++) {
                if (Math.random() < 0.5) {  // 50%的概率生成方块
                    // 将生成的方块设置为灰色或特定颜色来表示随机生成
                    grid.cells[row][col] = 0x808080;
                }
            }
        }
        isRandomHeightAdded = true; // 设置标记，表示已执行过
    };

    // 每 x 步叠加随机层（level 3）
    this.addRandomHeightEveryXSteps = function (stepInterval) {
        if (step % stepInterval === 0) {  // 每过 `x` 步执行一次
            // 复制上一行的状态到当前行（继承之前的方块）
            for (let i = 1; i < grid.rows; i++){
                for (let j = 0; j < grid.columns; j++) {
                    grid.cells[i-1][j] = grid.cells[i][j];
                }
            }
            // 然后遍历当前行的每个格子，决定是否生成方块
            for (let j = 0; j < grid.columns; j++) {
                if (Math.random() < 0.5) {  // 50%的概率生成方块
                    grid.cells[21][j] = 0x808080;
                }
                else grid.cells[21][j] = 0x000000;
            }
        }
    };

    // 随机控制下一个方块的下落位置（level 4）
    this.randomControlPiece = function (stepInterval) {
        if (step!=0 && step % stepInterval === 0) {  // 随机间隔来控制方块下落位置
            skipflag=1;
            let randomColumn = Math.floor(Math.random() * grid.columns);  // 随机选择一个列

            // 判断当前位置是否能放下方块（没有越界并且没有与已有方块重叠）
            // 使用 grid.valid() 来判断该列是否有效
            pieceWithRandomColumn = workingPiece.clone();
            pieceWithRandomColumn.column = randomColumn;
            
            // 如果不能放置方块，重新随机选择列
            if (!grid.valid(pieceWithRandomColumn)) {
                this.randomControlPiece(stepInterval);  // 递归重新选择列
            } else {
                workingPiece.column = pieceWithRandomColumn.column;  // 如果可以放下方块，则设置新的列位置
            }
        }
    };

    // Graphics·图像
    function intToRGBHexString(v){
        return 'rgb(' + ((v >> 16) & 0xFF) + ',' + ((v >> 8) & 0xFF) + ',' + (v & 0xFF) + ')';
    }//0x表示16进制 函数用于返回颜色值

    function redrawGridCanvas(workingPieceVerticalOffset = 0){//把整个主游戏画布刷新出来 —— 包括已经落地的砖块 + 当前正在操作的那块方块
                    //该参数给当前操作中的方块加一个“下落动画偏移量” 用于AI模拟动画
        gridContext.save();//保存当前画布的设置状态（比如颜色、坐标变换等），便于后面恢复。

        // Clear·清空
        gridContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

        // Draw grid·绘制已落地砖块
        for(var r = 2; r < grid.rows; r++){
            for(var c = 0; c < grid.columns; c++){
                if (grid.cells[r][c] != 0){
                    gridContext.fillStyle= intToRGBHexString(grid.cells[r][c]);//根据cell存的颜色信息设置画笔颜色
                    gridContext.fillRect(20 * c, 20 * (r - 2), 20, 20);//实际画一个方块
                    gridContext.strokeStyle="#FFFFFF";//白色
                    gridContext.strokeRect(20 * c, 20 * (r - 2), 20, 20);//画一个白色描边
                }
            }
        }

        // Draw working piece·绘制正在下落的操作方块
        for(var r = 0; r < workingPiece.dimension; r++){
            for(var c = 0; c < workingPiece.dimension; c++){
                if (workingPiece.cells[r][c] != 0){
                    gridContext.fillStyle = intToRGBHexString(workingPiece.cells[r][c]);
                    gridContext.fillRect(20 * (c + workingPiece.column), 20 * ((r + workingPiece.row) - 2) + workingPieceVerticalOffset, 20, 20);
                    gridContext.strokeStyle="#FFFFFF";
                    gridContext.strokeRect(20 * (c + workingPiece.column), 20 * ((r + workingPiece.row) - 2) + workingPieceVerticalOffset, 20, 20);
                }
            }
        }

        gridContext.restore();//还原画笔状态，防止影响后续绘图
    }

    function redrawNextCanvas(){//绘制“下一块方块”的预览区域(后可能改成多方块预览版本)
        nextContext.save();//保存画布状态，和主画布逻辑一致。

        nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);//清空右侧预览画布，准备重新绘制新的“下一块方块”。
        var next = workingPieces[1];
        var xOffset = next.dimension == 2 ? 20 : next.dimension == 3 ? 10 : next.dimension == 4 ? 0 : null;
        var yOffset = next.dimension == 2 ? 20 : next.dimension == 3 ? 20 : next.dimension == 4 ? 10 : null;
        for(var r = 0; r < next.dimension; r++){
            for(var c = 0; c < next.dimension; c++){
                if (next.cells[r][c] != 0){
                    nextContext.fillStyle = intToRGBHexString(next.cells[r][c]);
                    nextContext.fillRect(xOffset + 20 * c, yOffset + 20 * r, 20, 20);
                    nextContext.strokeStyle = "#FFFFFF";
                    nextContext.strokeRect(xOffset + 20 * c, yOffset + 20 * r, 20, 20);
                }
            }
        }

        nextContext.restore();
    }
    
    function updateScoreContainer(){//把当前游戏得分 score 显示到网页右侧的得分区域
        scoreContainer.innerHTML = score.toString();
        //scoreContainer——HTML元素 innerHTML——修改内容 score.toString()数字改成字符串
    }

    // Drop animation
    var workingPieceDropAnimationStopwatch = null;
    //用于保存：当前是否正在播放动画 一旦开始动画就会赋值为一个Stopwatch对象

    function startWorkingPieceDropAnimation(callback = function(){}){//模拟流畅的从高处掉到底的动画效果
        // Calculate animation height
        animationHeight = 0;
        _workingPiece = workingPiece.clone();
        while(_workingPiece.moveDown(grid)){//模拟统计下落多少格
            animationHeight++;
        }

        var stopwatch = new Stopwatch(function(elapsed){//逐帧动画计时器 定义在stopwatch.js中
            if(elapsed >= animationHeight * 20){//elapsed表示过去了多少ms
                stopwatch.stop();
                redrawGridCanvas(20 * animationHeight);
                callback();
                return;
            }

            redrawGridCanvas(20 * elapsed / 20);//加上垂直偏移 实现平滑掉落
        });

        workingPieceDropAnimationStopwatch = stopwatch;//保存这个动画控制器对象，如果后面需要 stop() 它，还能访问。
    }

    function cancelWorkingPieceDropAnimation(){//停止当前方块掉落动画
        if(workingPieceDropAnimationStopwatch === null){
            return;
        }
        workingPieceDropAnimationStopwatch.stop();
        workingPieceDropAnimationStopwatch = null;
    }

    // Process end of turn
    function endTurn(){
        // Add working piece·把当前方块加入地图
        grid.addPiece(workingPiece);

        // Clear lines·清除已满的行并加分
        score += grid.clearLines();

        // Refresh graphics·更新界面
        redrawGridCanvas();
        updateScoreContainer();

        return !grid.exceeded();//判断游戏是否结束
    }

    // Process gravity tick
    function onGravityTimerTick(){
        // If working piece has not reached bottom·如果还能往下移动
        if(workingPiece.canMoveDown(grid)){
            workingPiece.moveDown(grid);
            redrawGridCanvas();
            return;
        }

        // Stop gravity if working piece has reached bottom·如果到底了 停止下落
        gravityTimer.stop();

        // If working piece has reached bottom, end of turn has been processed
        // and game cannot continue because grid has been exceeded·执行结束逻辑 看看还能不能继续游戏
        if(!endTurn()){
            isKeyEnabled = false;
            alert('Game Over!');
            return;
        }

        // If working piece has reached bottom, end of turn has been processed
        // and game can still continue·可以继续游戏 进入下一轮
        startTurn();
    }

    // Process keys
    function onKeyDown(event){
        if(!isKeyEnabled){
            return;
        }
        switch(event.which){
            case 32: // spacebar·空格键 立刻掉到底
                isKeyEnabled = false;
                gravityTimer.stop(); // Stop gravity
                startWorkingPieceDropAnimation(function(){ // Start drop animation
                    while(workingPiece.moveDown(grid)); // Drop working piece
                    if(!endTurn()){
                        alert('Game Over!');
                        return;
                    }
                    startTurn();
                });
                break;
            case 40: // down·加速下落
                gravityTimer.resetForward(500);
                break;
            case 37: //left·左移
                if(workingPiece.canMoveLeft(grid)){
                    workingPiece.moveLeft(grid);
                    redrawGridCanvas();
                }
                break;
            case 39: //right·右移
                if(workingPiece.canMoveRight(grid)){
                    workingPiece.moveRight(grid);
                    redrawGridCanvas();
                }
                break;
            case 38: //up·旋转
                workingPiece.rotate(grid);
                redrawGridCanvas();
                break;
        }
    }

    aiButton.onclick = function(){//切换是否启用AI自动操作的开关
        if (isAiActive){
            isAiActive = false;
            aiButton.style.backgroundColor = "#f9f9f9";//淡灰色
        }else{
            isAiActive = true;
            aiButton.style.backgroundColor = "#e9e9ff";//淡蓝色

            isKeyEnabled = false;
            gravityTimer.stop();
            startWorkingPieceDropAnimation(function(){ // Start drop animation
                while(workingPiece.moveDown(grid)); // Drop working piece
                if(!endTurn()){
                    alert('Game Over!');
                    return;
                }
                startTurn(level);
            });
        }
    }

    resetButton.onclick = function(){//重开开关
        gravityTimer.stop();//停止自动下落
        cancelWorkingPieceDropAnimation();//停止正在播放的AI动画
        grid = new Grid(22, 10);//重建所有游戏数据结构
        rpg = new RandomPieceGenerator();
        workingPieces = [null, rpg.nextPiece()];
        workingPiece = null;
        score = 0;
        isKeyEnabled = true;
        isRandomHeightAdded = false;
        step=0;
        updateScoreContainer();
        startTurn(level);
    }

    aiButton.style.backgroundColor = "#e9e9ff";
    startTurn();
}
