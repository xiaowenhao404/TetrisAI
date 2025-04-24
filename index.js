// 引入所需的模块
const AI = require('./js/ai.js');        // 引入 AI 文件
const Tuner = require('./js/tuner.js');  // 引入 tuner.js 文件
const GameManager = require('./js/game_manager.js');  // 引入 GameManager 文件

// 创建自定义方块序列
const customSequence = [0, 1, 2, 3, 4, 5, 6, 7];

// 设计难度
const level = 3;

// 创建 Tuner 实例
const tuner = new Tuner();


// 启动调优过程
tuner.tune({
    population: 100,  // 种群大小
    rounds: 5,        // 每个候选解的回合数
    moves: 200,        // 每回合的最大步数
    maxGenerations:50,  // 共优化多少代种群
    level: level      // 传递当前游戏难度
});
