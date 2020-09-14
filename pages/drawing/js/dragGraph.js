const dragGraph = function ({ x, y, w, h, type='text', color, size, alpha, draw, drawStyle}, canvas){
  this.x = x;
  this.y = y;

  this.w = w;
  this.h = h;

  this.centerX = x + w / 2;
  this.centerY = y + h / 2;
  // 4个顶点坐标
  this.square = [
    [this.x, this.y],
    [this.x + this.w, this.y],
    [this.x + this.w, this.y + this.h],
    [this.x, this.y + this.h]
  ];
  this.rotate = 0
  this.ctx = canvas;
  this.type = type || 'text'

  this.size = size;
  this.alpha = alpha;
  //绘图方法
  this.draw = draw || function(){}
  //绘图样式
  this.drawStyle = drawStyle || function(){}
}
dragGraph.prototype = {
  /**
    * 绘制元素
    */
  paint() {
    this.ctx.save();
    let res = this.drawStyle()
    if(this.type.toLowerCase().indexOf('rect') > -1){
      this.ctx.clearRect(this.x-2, this.y-2, this.w+5, this.h+5)//清除之前的矩形
    }
    if(this.type === 'text'){
      let textWidth = res.width,
        textHeight = res.height;
      this.x = this.centerX - textWidth / 2;
      this.y = this.centerY - textHeight / 2;
    }else{
      this.x = this.centerX - this.x / 2;
      this.y = this.centerY - this.y / 2;
    }
    this.draw(this.x,this.y,this.w,this.h)
  },
  /**
   * 判断点击的坐标落在哪个区域
   * @param {*} x 点击的坐标
   * @param {*} y 点击的坐标
   */
  isInGraph(x, y) {
    if (this.insidePolygon(this.square, [x, y])){
      return 'move';
    }
    // 不在选择区域里面
    return false;
  },
  /**
     *  判断一个点是否在多边形内部
     *  @param points 多边形坐标集合
     *  @param testPoint 测试点坐标
     *  返回true为真，false为假
     *  */
  insidePolygon(points, testPoint) {
    let x = testPoint[0], y = testPoint[1];
    let inside = true;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      let xi = points[i][0], yi = points[i][1];
      let xj = points[j][0], yj = points[j][1];
      // let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      // if (intersect) inside = !inside;
      let intersect = true
      if (yi < yj){
        intersect = intersect && (y <= yj && y >= yi)
      }else if(yi != yj){
        intersect = intersect && (y <= yi && y >= yj)
      }
      if (xi < xj){
        intersect = intersect && (x <= xj && x >= xi)
      } else if (xi != xj){
        intersect = intersect && (x <= xi && x >= xj)
      }
      inside = inside && intersect
    }
    return inside;
  },
  /**
     * 计算旋转后矩形四个顶点的坐标（相对于画布）
     * @private
     */
  _rotateSquare() {
    this.square = [
      this._rotatePoint(this.x, this.y, this.centerX, this.centerY, this.rotate),
      this._rotatePoint(this.x + this.w, this.y, this.centerX, this.centerY, this.rotate),
      this._rotatePoint(this.x + this.w, this.y + this.h, this.centerX, this.centerY, this.rotate),
      this._rotatePoint(this.x, this.y + this.h, this.centerX, this.centerY, this.rotate),
    ];
  },
  /**
   * 计算旋转后的新坐标（相对于画布）
   * @param x
   * @param y
   * @param centerX
   * @param centerY
   * @param degrees
   * @returns {*[]}
   * @private
   */
  _rotatePoint(x, y, centerX, centerY, degrees) {
    let newX = (x - centerX) * Math.cos(degrees * Math.PI / 180) - (y - centerY) * Math.sin(degrees * Math.PI / 180) + centerX;
    let newY = (x - centerX) * Math.sin(degrees * Math.PI / 180) + (y - centerY) * Math.cos(degrees * Math.PI / 180) + centerY;
    return [newX, newY];
  },
}
module.exports = dragGraph;