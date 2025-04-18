function Stopwatch(callback) {
    var isStopped = false;//控制计时器是否停止
    var startDate = null;//计时开始的时间
    var self = this;//让this保持指向Stopwatch实例

    var onAnimationFrame = function(){
        if(isStopped){
            return;
        }
        //执行回调 传入当前时间减去开始时间（得到经过的时间）
        callback(Date.now() - startDate);
        //使用requestAnimationFrame再次调用onAnimationFrame 实现动画效果
        requestAnimationFrame(onAnimationFrame);
    };

    this.stop = function() {
        isStopped = true;
    }

    startDate = Date.now();
    requestAnimationFrame(onAnimationFrame);
}
