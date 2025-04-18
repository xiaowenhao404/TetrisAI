const Piece = require('./piece.js');

function RandomPieceGenerator(isRandom = false){
    this.isRandom = isRandom;//通过参数决定是否启用真随机
    this.bag = [0, 1, 2, 3, 4, 5, 6, 7];//代表方块类型
    if(!this.isRandom){
        this.shuffleBag();//如果是伪随机 采用原来的打乱顺序模式
    }
    this.index = -1;
};

RandomPieceGenerator.prototype.nextPiece = function(){
    this.index++;
    if (this.index >= this.bag.length) {
        if (this.isRandom) {
            //真随机 使用完全随机方式重新生成方块
            this.index = 0; //重置索引
        } else {
            this.shuffleBag();//如果是伪随机 重新打乱方块顺序
            this.index = 0;//重置索引
        }
    }
    return Piece.fromIndex(this.bag[this.index]);
};

RandomPieceGenerator.prototype.shuffleBag = function() {
    var currentIndex = this.bag.length
        , temporaryValue
        , randomIndex
        ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = this.bag[currentIndex];
        this.bag[currentIndex] = this.bag[randomIndex];
        this.bag[randomIndex] = temporaryValue;
    }
};

module.exports = RandomPieceGenerator;
