const fs = require('fs');
const path = require('path');
const AI = require('./ai.js');
const Grid = require('./grid.js');
const RandomPieceGenerator = require('./random_piece_generator.js');

// 确保 log 目录存在
const logDir = path.join(__dirname, 'log');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// 每次运行，选取下一个可用文件名 log1.txt, log2.txt …
function getNextLogFile() {
  let i = 1;
  let file;
  do {
    file = path.join(logDir, `log${i}.txt`);
    i++;
  } while (fs.existsSync(file));
  return file;
}

// 写一行
function logLine(f, line) {
  fs.appendFileSync(f, line + '\n');
}

// 随机整数
function randomInt(min, max) {
  return Math.floor(Math.random()*(max-min) + min);
}

// 归一化
function normalize(c) {
  const n = Math.hypot(c.heightWeight, c.linesWeight, c.holesWeight, c.bumpinessWeight);
  c.heightWeight   /= n;
  c.linesWeight    /= n;
  c.holesWeight    /= n;
  c.bumpinessWeight/= n;
}

// 生成随机 candidate
function genCandidate() {
  const c = {
    heightWeight:   Math.random()-0.5,
    linesWeight:    Math.random()-0.5,
    holesWeight:    Math.random()-0.5,
    bumpinessWeight:Math.random()-0.5,
    fitness: 0
  };
  normalize(c);
  return c;
}

// 排序
function sortCand(arr) {
  arr.sort((a,b)=>b.fitness - a.fitness);
}

// 计算 fitness 并详细记录
function computeFitnesses(arr, rounds, moves, cfg, logFile) {
  // 只在第一次调用时写配置头
  if (!computeFitnesses._initialized) {
    computeFitnesses._initialized = true;
    logLine(logFile, `=== Initial Candidates ===`);
    logLine(logFile, `Level: ${cfg.level}  Pop: ${cfg.population}  Rounds: ${cfg.rounds}  Moves/Round: ${cfg.moves}`);
    logLine(logFile, `Computing fitness for ${arr.length} candidates...`);
  }

  arr.forEach((c, idx) => {
    let total = 0, details = [];
    for (let r=1;r<=rounds;r++){
      let grid = new Grid(22,10),
          rpg = new RandomPieceGenerator(),
          pieces = [rpg.nextPiece(),rpg.nextPiece()],
          p=pieces[0], mv=0, sc=0;
      while(mv < moves && !grid.exceeded()){
        p = new AI(c).best(grid,pieces);
        while(p.moveDown(grid));
        grid.addPiece(p);
        sc += grid.clearLines();
        pieces.shift(); pieces.push(rpg.nextPiece());
        mv++;
      }
      total += sc;
      details.push(`Game${r}: Moves=${mv}, Score=${sc}`);
    }
    c.fitness = total;
    logLine(logFile,
      `${String(idx+1).padEnd(3)}  hW:${c.heightWeight.toFixed(4)}  lW:${c.linesWeight.toFixed(4)}  hoW:${c.holesWeight.toFixed(4)}  bW:${c.bumpinessWeight.toFixed(4)}  Tot:${total}`
    );
    details.forEach(d=>logLine(logFile,'    '+d));
  });
}

// 锦标赛选择
function tournament(arr, k) {
  let idxs=[...arr.keys()], best=null, second=null;
  for (let i=0;i<k;i++){
    let pick = idxs.splice(randomInt(0,idxs.length),1)[0];
    if (best===null||pick<best){ second=best; best=pick; }
    else if (second===null||pick<second) second=pick;
  }
  return [arr[best],arr[second]];
}

// 交叉
function cross(a,b) {
  let c = {
    heightWeight:   a.fitness*a.heightWeight + b.fitness*b.heightWeight,
    linesWeight:    a.fitness*a.linesWeight  + b.fitness*b.linesWeight,
    holesWeight:    a.fitness*a.holesWeight  + b.fitness*b.holesWeight,
    bumpinessWeight:a.fitness*a.bumpinessWeight + b.fitness*b.bumpinessWeight,
    fitness:0
  };
  normalize(c);
  return c;
}

// 变异
function mutate(c) {
  let d=Math.random()*0.4-0.2;
  switch(randomInt(0,4)){
    case 0:c.heightWeight+=d;break;
    case 1:c.linesWeight+=d;break;
    case 2:c.holesWeight+=d;break;
    case 3:c.bumpinessWeight+=d;break;
  }
}

// 主类
function Tuner(){
  this.tune = function(params){
    const cfg = Object.assign({
      population:100, rounds:5, moves:200, maxGenerations:10, level:1
    },params);

    const logFile = getNextLogFile();
    // 清空并写 header
    fs.writeFileSync(logFile,'');
    computeFitnesses._initialized = false;

    // 初始种群
    let pop = Array.from({length:cfg.population},genCandidate);
    computeFitnesses(pop,cfg.rounds,cfg.moves,cfg,logFile);
    sortCand(pop);
    console.log(`Initial best fitness=${pop[0].fitness}`);
    logLine(logFile,`Initial best fitness=${pop[0].fitness}, weights=${JSON.stringify(pop[0])}`);

    // 迭代
    for (let gen=1; gen<=cfg.maxGenerations; gen++){
      console.log(`\n=== Generation ${gen} ===`);
      logLine(logFile,`\n=== Generation ${gen} ===`);
      const survivors = Math.floor(cfg.population*0.7),
            newCount  = cfg.population - survivors;
      let children=[];
      for (let i=0;i<newCount;i++){
        let [p1,p2]=tournament(pop,Math.floor(cfg.population*0.1));
        let ch = cross(p1,p2);
        if (Math.random()<0.05) mutate(ch);
        children.push(ch);
      }
      // 计算新一代 fitness
      computeFitnesses(children,cfg.rounds,cfg.moves,cfg,logFile);
      sortCand(children);

      console.log(`Generation ${gen} best fitness=${children[0].fitness}`);
      logLine(logFile,`Gen${gen} best fitness=${children[0].fitness}, weights=${JSON.stringify(children[0])}`);

      // 替换
      pop.splice(survivors,newCount,...children);
      sortCand(pop);
    }

    console.log(`\nAll done. Logs saved to ${logFile}`);
  };
}

module.exports = Tuner;
