/**
 * @param {Object} weights
 * @param {number} weights.heightWeight
 * @param {number} weights.linesWeight
 * @param {number} weights.holesWeight
 * @param {number} weights.bumpinessWeight
 */
function AI(weights){
    this.heightWeight = weights.heightWeight;
    this.linesWeight = weights.linesWeight;
    this.holesWeight = weights.holesWeight;
    this.bumpinessWeight = weights.bumpinessWeight;
};
//Grid对象grid当前地图, 数组workingPieces还要放的方块（一般是当前和下一个）, 数字workingPieceIndex当前轮到第几个方块（从0开始）
AI.prototype._best = function(grid, workingPieces, workingPieceIndex){
    var best = null;
    var bestScore = null;
    var workingPiece = workingPieces[workingPieceIndex];

    for(var rotation = 0; rotation < 4; rotation++){
        var _piece = workingPiece.clone();
        for(var i = 0; i < rotation; i++){
            _piece.rotate(grid);//调用piece.js中旋转函数 执行旋转操作
        }

        while(_piece.moveLeft(grid));//尽量左移

        while(grid.valid(_piece)){//调用grid.js中函数 尝试落点
            var _pieceSet = _piece.clone();
            while(_pieceSet.moveDown(grid));//持续下落判断落点

            var _grid = grid.clone();
            _grid.addPiece(_pieceSet);

            var score = null;
            if (workingPieceIndex == (workingPieces.length - 1)) {
                score = - this.heightWeight * _grid.aggregateHeight() 
                        + this.linesWeight * _grid.lines() 
                        - this.holesWeight * _grid.holes() 
                        - this.bumpinessWeight * _grid.bumpiness();
            }else{
                score = this._best(_grid, workingPieces, workingPieceIndex + 1).score;
            }

            if (score > bestScore || bestScore == null){
                bestScore = score;
                best = _piece.clone();
            }

            _piece.column++;
        }
    }

    return {piece:best, score:bestScore};
};

AI.prototype.best = function(grid, workingPieces){
    return this._best(grid, workingPieces, 0).piece;
};

module.exports = AI;
