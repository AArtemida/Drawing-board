const colorTrans = require('./colorTrans.js')
let addPointTimeout;
const brushStroke = function ({ type = "star", width, color, opacity, scale }, ctx, points){
  this.points = points || []
  this.positions = [];

  this.starPoints = [];
  this.stavePoints = [];

  this.type = type
  this.ctx = ctx

  this.width = width
  this.color = color
  this.opacity = opacity
  this.scale = scale || 1
  this.rgb = {}
  if (this.color){
    this.initColor(this.color)
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function distanceBetween(point1, point2) {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}
function angleBetween(point1, point2) {
  return Math.atan2(point2.x - point1.x, point2.y - point1.y);
}
brushStroke.prototype = {
  initColor(color){
    if (/^(rgb|RGB)/.test(color)) {
      this.rgb = colorTrans.getRgbaData(color)
    } else if (/^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6}|[0-9a-fA-f]{8})$/.test(color)) {
      this.rgb = colorTrans.hex2rgb(color)
    }
  },
  /**
    * 绘制元素
    */
  paint(x,y,prevX,prevY){

    switch(this.type){
      case 'star':
      case 'colorstar':
        for (var i = 0; i < this.points.length; i++) {
          this.drawStar(this.points[i]);
        }
        break;
      case 'pixel':
        this.drawPixels(x, y);
        break;
      case 'gradient':
        let currentPoint = { x, y }
        let lastPoint = { x: prevX, y: prevY }

        this.drawGradients(lastPoint, currentPoint)
        break;
      case 'stave':
        this.drawStave()
        break;
    }
  },
  paintEnd(){
    this.points.length = 0
  },
  clearPoints(){
    this.points.length = 0;
    this.positions = []
  },
  changeType(type){
    this.type = type
    this.positions = []
  },
  changeColor(color){
    this.color = color
    this.positions = []
    if (this.color) {
      this.initColor(this.color)
    }
  },
  //画星星
  drawStar(options) {
    let ctx = this.ctx;
    let length = 15;
    ctx.save();
    ctx.translate(options.x, options.y);
    ctx.beginPath();
    ctx.globalAlpha = options.opacity;
    ctx.rotate(Math.PI / 180 * options.angle);
    ctx.scale(options.scale, options.scale);
    ctx.strokeStyle = options.color;
    ctx.lineWidth = options.width;
    for (var i = 5; i--;) {
      ctx.lineTo(0, length);
      ctx.translate(0, length);
      ctx.rotate((Math.PI * 2 / 10));
      ctx.lineTo(0, -length);
      ctx.translate(0, -length);
      ctx.rotate(-(Math.PI * 6 / 10));
    }
    ctx.lineTo(0, length);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  },
  //新增元素
  addRandomPoint(x, y) {
    let obj = {x, y}
    let theItem = this.positions.find(item=>{
      return (Math.abs(item.x - x) < 20) && (Math.abs(item.y - y) < 20)
    })
    if (theItem) return
    this.positions.push(obj)
    // console.log({ obj, theItem }, this.positions)
    if(this.type.includes("star")){
      obj.angle = getRandomInt(0, 180)
      if(this.type == 'colorstar'){
        obj = Object.assign({}, obj, {
          width: getRandomInt(1, 10),
          opacity: Math.random(),
          scale: getRandomInt(1, 12) / 10,
          color: ('rgb(' + getRandomInt(0, 255) + ',' + getRandomInt(0, 255) + ',' + getRandomInt(0, 255) + ')')
        })
      }else{
        obj = Object.assign({}, obj, {
          width: 1,
          opacity: this.opacity || Math.random(),
          scale: this.scale || getRandomInt(1, 12) / 10,
          color: this.color || ('rgb(' + getRandomInt(0, 255) + ',' + getRandomInt(0, 255) + ',' + getRandomInt(0, 255) + ')')
        })
      }
      
    }
    
    clearTimeout(addPointTimeout)
    addPointTimeout = setTimeout(()=>{
      this.points.push(obj);
      // if (this.type.includes("star")){
      //   this.drawStar(obj)
      //   this.paintEnd()
      // }
    },5)
    console.log(this.points.length)
  },
  //像素点
  drawPixels(x, y) {
    let ctx = this.ctx;
    let num = 5;
    for (var i = -num; i < num; i += 4) {
      for (var j = -num; j < num; j += 4) {
        if (Math.random() > 0.5) {
          ctx.fillStyle = ['red', 'orange', 'yellow', 'green',
            'light-blue', 'blue', 'purple'][getRandomInt(0, 6)];
          ctx.fillRect(x + i, y + j, 4, 4);
        }
      }
    }
  },
  //渐变
  drawGradients(lastPoint, currentPoint){
    let ctx = this.ctx;
    let dist = distanceBetween(lastPoint, currentPoint);
    let angle = angleBetween(lastPoint, currentPoint);
    for (var i = 0; i < dist; i += 5) {

      let x = lastPoint.x + (Math.sin(angle) * i);
      let y = lastPoint.y + (Math.cos(angle) * i);

      let radgrad = ctx.createRadialGradient(x, y, 10, x, y, 20);

      radgrad.addColorStop(0, this.color);
      radgrad.addColorStop(0.3, `rgba(${this.rgb.r},${this.rgb.g},${this.rgb.b},0.6)`);
      radgrad.addColorStop(0.5, `rgba(${this.rgb.r},${this.rgb.g},${this.rgb.b},0.4)`);
      radgrad.addColorStop(0.8, `rgba(${this.rgb.r},${this.rgb.g},${this.rgb.b},0.1)`);
      radgrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = radgrad;
      ctx.fillRect(x - 20, y - 20, 40, 40);
    }
  },
  //多线
  drawStave(){
    let ctx = this.ctx;
    ctx.strokeStyle = `rgba(${this.rgb.r},${this.rgb.g},${this.rgb.b},1)`;
    this.drawStroke(this.offsetPoints(-4));
    ctx.strokeStyle = `rgba(${this.rgb.r},${this.rgb.g},${this.rgb.b},0.8)`;
    this.drawStroke(this.offsetPoints(-2));
    ctx.strokeStyle = `rgba(${this.rgb.r},${this.rgb.g},${this.rgb.b},0.6)`;
    this.drawStroke(this.points);
    ctx.strokeStyle = `rgba(${this.rgb.r},${this.rgb.g},${this.rgb.b},0.4)`;
    this.drawStroke(this.offsetPoints(2));
    ctx.strokeStyle = `rgba(${this.rgb.r},${this.rgb.g},${this.rgb.b},0.2)`;
    this.drawStroke(this.offsetPoints(4));
  },
  offsetPoints(val) {
    var offsetPoints = [];
    for (var i = 0; i < this.points.length; i++) {
      offsetPoints.push({
        x: this.points[i].x + val,
        y: this.points[i].y + val
      });
    }
    return offsetPoints;
  },
  drawStroke(points) {
    let ctx = this.ctx;
    let p1 = points[0],
     p2 = points[1];

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);

    for (let i = 1, len = points.length; i < len; i++) {
      let midPoint = this.midPointBtw(p1, p2);
      ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      p1 = points[i];
      p2 = points[i + 1];
    }
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  },
  midPointBtw(p1, p2) {
    return {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2
    };
  },
}

module.exports = brushStroke;