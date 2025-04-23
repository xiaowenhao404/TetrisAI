function Grid(rows, columns){
    this.rows = rows;
    this.columns = columns;

    this.cells = new Array(rows);
    for (var r = 0; r < this.rows; r++) {
        this.cells[r] = new Array(this.columns);
        for(var c = 0; c < this.columns; c++){
            this.cells[r][c] = 0;
        }
    }
};

Grid.prototype.clone = function(){
    var _grid = new Grid(this.rows, this.columns);
    for (var r = 0; r < this.rows; r++) {
        for(var c = 0; c < this.columns; c++){
            _grid.cells[r][c] = this.cells[r][c];
        }
    }
    return _grid;
};

Grid.prototype.clearLines = function() {
    var distance = 0;
    var row = new Array(this.columns);
    var linesCleared = 0;  // 记录消除的行数
    for(var r = this.rows - 1; r >= 0; r--){
        if (this.isLine(r)){
            linesCleared++;  // 统计已消除的行数
            distance++;
            for(var c = 0; c < this.columns; c++){
                this.cells[r][c] = 0;
            }
        }else if (distance > 0){
            for(var c = 0; c < this.columns; c++){
                this.cells[r + distance][c] = this.cells[r][c];
                this.cells[r][c] = 0;
            }
        }
    }
    // 根据消除的行数计算得分
    let score = 0;
    switch (linesCleared) {
        case 1:
            score = 1;
            break;
        case 2:
            score = 3;
            break;
        case 3:
            score = 6;
            break;
        case 4:
            score = 10;
            break;
    }
    return score;  // 返回得分
};


Grid.prototype.isLine = function(row){
    for(var c = 0; c < this.columns; c++){
        if (this.cells[row][c] == 0){
            return false;
        }
    }
    return true;
};

Grid.prototype.isEmptyRow = function(row){
    for(var c = 0; c < this.columns; c++){
        if (this.cells[row][c] != 0){
            return false;
        }
    }
    return true;
};

Grid.prototype.exceeded = function(){
    return !this.isEmptyRow(0) || !this.isEmptyRow(1) || !this.isEmptyRow(2) || !this.isEmptyRow(3);
};

Grid.prototype.height = function(){//计算非空行数 表示方块堆叠的总高度
    var r = 0;
    for(; r < this.rows && this.isEmptyRow(r); r++);
    return this.rows - r;
};

Grid.prototype.lines = function(){//计算当前网格中已经被填满的行数
    var count = 0;
    for(var r = 0; r < this.rows; r++){
        if (this.isLine(r)){
            count++;
        }
    }
    return count;
};

Grid.prototype.holes = function(){//计算所有空洞
    var count = 0;
    for(var c = 0; c < this.columns; c++){
        var block = false;
        for(var r = 0; r < this.rows; r++){
            if (this.cells[r][c] != 0) {
                block = true;
            }else if (this.cells[r][c] == 0 && block){
                count++;
            }
        }
    }
    return count;
};

Grid.prototype.blockades = function(){
    var count = 0;
    for(var c = 0; c < this.columns; c++){
        var hole = false;
        for(var r = this.rows - 1; r >= 0; r--){
            if (this.cells[r][c] == 0){
                hole = true;
            }else if (this.cells[r][c] != 0 && hole){
                count++;
            }
        }
    }
    return count;
}

Grid.prototype.aggregateHeight = function(){
    var total = 0;
    for(var c = 0; c < this.columns; c++){
        total += this.columnHeight(c);
    }
    return total;
};

Grid.prototype.bumpiness = function(){
    var total = 0;
    for(var c = 0; c < this.columns - 1; c++){
        total += Math.abs(this.columnHeight(c) - this.columnHeight(c+ 1));
    }
    return total;
}

Grid.prototype.columnHeight = function(column){
    var r = 0;
    for(; r < this.rows && this.cells[r][column] == 0; r++);
    return this.rows - r;
};

Grid.prototype.addPiece = function(piece) {
    for(var r = 0; r < piece.cells.length; r++) {
        for (var c = 0; c < piece.cells[r].length; c++) {
            var _r = piece.row + r;
            var _c = piece.column + c;
            if (piece.cells[r][c] != 0 && _r >= 0){
                this.cells[_r][_c] = piece.cells[r][c];
            }
        }
    }
};

Grid.prototype.valid = function(piece){
    for(var r = 0; r < piece.cells.length; r++){
        for(var c = 0; c < piece.cells[r].length; c++){
            var _r = piece.row + r;
            var _c = piece.column + c;
            if (piece.cells[r][c] != 0){
                if(_r < 0 || _r >= this.rows){
                    return false;
                }
                if(_c < 0 || _c >= this.columns){
                    return false;
                }
                if (this.cells[_r][_c] != 0){
                    return false;
                }
            }
        }
    }
    return true;
};

module.exports = Grid;