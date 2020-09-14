// pages/drawing/drawing.js
const dragGraph = require('./js/dragGraph.js')
const brushStroke = require('./js/brush.js')
const devmode = 'dev';//或者 生产环境：prod

function convertToGrayscale(data) {
  let g = 0
  for (let i = 0; i < data.length; i += 4) {
    g = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11)
    data[i] = g
    data[i + 1] = g
    data[i + 2] = g
  }
  return data
}
//bug：无法解决canvas层级问题 => canvas和图片交替出现 => 闪动明显；
/*bug1:canvas 层级太高无法覆盖；
bug2:cover-view 支持的太少；
bug3:canvas离屏之前的渲染会被清空
总结：我悔呀 当初就不应该想做画板*/
Page({

  /**
   * 页面的初始数据
   */
  data: {
    toolList: [{ icon: 'icon-caidan1', title: '菜单', key: 'menu' }, 
      { icon: 'icon-gongju', title: '工具', key: 'tool' },
      { icon: 'icon-qianbi', title: '笔大小', key: 'pen' }, 
      { icon: 'icon-kujialeqiyezhan_tiaosepan', title: '颜色', key: 'color' },
      { icon: 'icon-xiangpica', title: '橡皮', key: 'rubber' }, 
      // { icon: 'icon-tuceng', title: '图层', key: 'layer' }, 
      { icon: 'icon-quanping', title: '收起', key: 'hide' },
    ],
    //是否显示工具栏
    showTool: true,
    
    penSize: 2,
    penColor: "#333333",
    transparency:1,//全局透明度
    isClear: false,//判断是否启用的橡皮擦功能  ture表示清除  false表示画画
    //判断点击的工具
    selectToolIndex: null,
    eraserSize: 5,
    //色盘颜色值
    rgbaData: {
      r: 0,
      g: 0,
      b: 0,
      a: 1
    },
    isColorPicker: false,//是否是取色器模式

    isBuild:false,
    nocancel:false,

    imgCanvas:'',
    canvasHidden:false,
    canvasHidden2:false,

    //窗口
    windowHeight:0,
    windowWidth:0,

    //画图形
    drawRect:false,
    drawCircle:false,

    //文字
    isText:false,
    theText:'',
    //缩放
    scale: 1,
    //图层
    layerList:[null],
    currentLayer:0,
    //记录矩形上次的点
    prevX:0,
    prevY:0,
    //橡皮透明度
    rubberOpacity:1,
    //字体大小
    fontSize: 25,
    //拖拽
    mouse:{
      x: 0,
      y: 0,
    },
    history: [],
    isDrag:false,
    //填充
    isFillColor: false,
    //圆形
    isCircle: false,
    isPen: true,
    colorPlateTabs:['滑块','调色板'],
    colorPlateSelect: 1,
    //笔刷
    brushType: '',
    showBrush: false,
    brushList:{
      'star': '星星',
      'colorstar': '彩色星星',
      'pixel': '像素点',
      // 'gradient':'水墨',
      'stave': '五线谱',
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // this.context = wx.createCanvasContext('draw-canvas');
    //保存绘图数组
    this.drawArr = [];
    //获取宽高
    wx.getSystemInfo({
      success: (res) => {
        console.log(res.windowWidth, res.windowHeight)
        // let pixel = res.pixelRatio;
        this.setData({ windowWidth: res.windowWidth, windowHeight: res.windowHeight-40});
      }
    })
    const query = wx.createSelectorQuery()
    query.select('#draw-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node
        this.context = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        this.context.scale(dpr, dpr)
        this.canvas = canvas
      })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  //设置绘图样式
  setDrawStyle(){
    if(this.data.isFillColor){
      this.setFillStyle()
    }else{
      this.setLineStyle()
    }
    this.context.save();
  },
  //绘图线条样式
  setLineStyle(color = this.data.penColor, size = this.data.penSize, alpha = this.data.transparency){
    this.context.globalAlpha = alpha
    this.context.strokeStyle = color;
    this.context.lineWidth = size;//设置线条宽度
    this.context.lineCap = this.context.lineJoin = 'round';//设置线条端点的样式 设置两线相交处的样式
    this.context.shadowBlur = 1;
    this.context.shadowColor = color;
  },
  setFillStyle(color = this.data.penColor){
    this.context.fillStyle = color
  },
  setBrushStyle(){
    this.context.lineCap = this.context.lineJoin = 'miter';
  },
  //手指触摸动作开始
  touchStart(e) {
    if (e.touches.length > 1) return;
    //得到触摸点的坐标
    this.startX = e.changedTouches[0].x
    this.startY = e.changedTouches[0].y
    //判断绘图类型
    if (this.data.isColorPicker) {//取色器

    } else if (this.data.drawRect || this.data.isCircle) {//矩形
      this.setDrawStyle()
      //保存之前的位置
      this.setData({ prevX: this.startX, prevY: this.startY });

    }else if (this.data.isClear) { //橡皮擦
      let color = 'rgba(255,255,255,' + this.data.rubberOpacity + ')'
      this.setLineStyle(color, this.data.eraserSize)
      this.context.save();  //保存当前坐标轴的缩放、旋转、平移信息
      this.context.beginPath() //开始一个路径 
      this.context.restore();  //恢复之前保存过的坐标轴的缩放、旋转、平移信息

    } else if(this.data.isDrag){//拖拽图形
      this.dragCanvasStart()
    }else if(this.data.brushType){
      let type = this.data.brushType
      this.refreshBrushStyle()
      if (type == 'star' || type == 'colorstar'||type == 'stave' ){
        // this.setBrushStyle()
        this.brushStroke.addRandomPoint(this.startX, this.startY)
      }
    }else{//画笔
      this.setDrawStyle()
      this.context.beginPath();
    }
  },
  //手指触摸后移动
  touchMove(e) {
    let startX1 = e.changedTouches[0].x,
      startY1 = e.changedTouches[0].y;
    if (this.data.isColorPicker) {

    } else if (this.data.drawRect) {//矩形 
      this.drawRectHandler(startX1, startY1)
    } else if (this.data.isCircle) {//圆形
      this.drawCircleHandler(startX1, startY1)
    }else if (this.data.isClear) { //橡皮擦
      this.context.save();  //保存当前坐标轴的缩放、旋转、平移信息
      this.context.moveTo(this.startX, this.startY);  //把路径移动到画布中的指定点，但不创建线条
      this.context.lineTo(startX1, startY1);  //添加一个新点，然后在画布中创建从该点到最后指定点的线条
      this.context.stroke();  //对当前路径进行描边
      this.context.restore()  //恢复之前保存过的坐标轴的缩放、旋转、平移信息
      this.startX = startX1;
      this.startY = startY1;
    } else if (this.data.isDrag) {//拖拽图形
      this.dragCanvas(startX1, startY1)
    } else if (this.data.brushType) {
      this.drawBrushHandler(startX1, startY1)
    }else {//画笔
      this.context.moveTo(this.startX, this.startY);
      //曲线
      let point = this.midPointBtw({ x: this.startX, y: this.startY }, { x: startX1, y: startY1})
      this.context.quadraticCurveTo(this.startX, this.startY, point.x, point.y)

      this.context.lineTo(startX1, startY1);
      
      this.context.stroke();//画线
      this.startX = startX1;
      this.startY = startY1;
    }
  },
  touchEnd(e) {
    this.tempGraphArr = [];
    this.context.save();
    if (this.data.drawRect){//存放绘图矩形
      let type = this.data.isFillColor?'fillRect':'rect';
      let startX1 = this.data.prevX, startY1 = this.data.prevY;
      let width = startX1 - this.startX, height = startY1 - this.startY;
      this.changeDrawArr({x:this.startX, y:this.startY, w:width, h:height, type})
    } else if (this.data.isCircle) {//存放绘图圆形

    }
  },
  //获取凡赛尔曲线点
  midPointBtw(p1,p2){
    return {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2
    };
  },
  //笔刷绘图
  drawBrushHandler(startX1, startY1){
    let type = this.data.brushType
    if (type == 'star' || type == 'colorstar' || type == 'stave') {
      this.context.clearRect(0, 0, this.data.windowWidth, this.data.windowHeight);
      this.brushStroke.addRandomPoint(startX1, startY1)
    }
    this.brushStroke.paint(startX1, startY1,this.startX,this.startY)
    this.startX = startX1;
    this.startY = startY1;
  },
  //画矩形
  drawRectHandler(startX1, startY1){
    let newW = startX1 - this.startX, newH = startY1 - this.startY;
    // this.context.clearRect(0, 0, this.data.windowWidth, this.data.windowHeight);
    let prevStartX = this.startX, prevStartY = this.startY
    if (newW < 0) {
      prevStartX += 2
    } else {
      prevStartX -= 2
    }
    if (newH < 0) {
      prevStartY += 2
    } else {
      prevStartY -= 2
    }
    let prevWidth = this.data.prevX - prevStartX, prevHeight = this.data.prevY - prevStartY;
    if (prevWidth < 0) {
      prevWidth -= 5
    } else {
      prevWidth += 5
    }
    if (prevHeight < 0) {
      prevHeight -= 5
    } else {
      prevHeight += 5
    }
    this.context.clearRect(prevStartX, prevStartY, prevWidth, prevHeight)//清除之前的矩形
    this.drawRectGraph(this.startX, this.startY, newW, newH)
    //保存之前的位置
    this.setData({ prevX: startX1, prevY: startY1 });
  },
  drawRectGraph(x = this.startX, y = this.startY, newW, newH, isFill = this.data.isFillColor){
    if (isFill) {
      this.context.fillRect(x, y, newW, newH)
    } else {
      this.context.strokeRect(x, y, newW, newH);//画新的矩形
    }
  },
  //画圆形
  drawCircleHandler(startX1, startY1, isFill = this.data.isFillColor){
    this.context.beginPath()
    this.context.arc(this.startX, this.startY, 50, 0, 2 * Math.PI)
    if (isFill){
      this.context.fill();
    }else{
      this.context.stroke();
    }
    this.context.closePath();
  },
  //滑块修改笔触大小
  sliderPenchange(e) {
    //console.log('发生 change 事件，携带值为', e.detail.value)
    if (this.data.selectToolIndex == 'rubber') {
      //改变橡皮大小
      this.changeDataStatus({
        eraserSize: e.detail.value,
        isClear: true
      })
    } else if (this.data.selectToolIndex == 'pen') {
      //改变画笔大小
      this.changeDataStatus({
        penSize: e.detail.value,
        isPen: true
      })
    }
    // this.hiddenChildrenBox();
  },
  //显示工具子级框
  showToolChildren(e) {
    let index = e.currentTarget.dataset.index;//事件传参：参数只能绑定在元素上
    switch (index) {
      case 'pen':
        this.changeDataStatus()
        break;
      case 'rubber':
        this.changeDataStatus({ isClear: true });//开启橡皮擦
        break;
      case 'hide':
        //显示和隐藏
        this.setData({ showTool: index == this.data.selectToolIndex});
        break;
      default:
        break;
    }
    if (index != this.data.selectToolIndex) {
      this.setData({ selectToolIndex: index });
      if(index != 'hide'){
        this.hiddenCanvas();
      }
    } else {
      this.setData({ selectToolIndex: null});
      if (index != 'hide') {
        this.showCanvas();
      }
    }
    if (index == 'hide' && this.data.canvasHidden) {
      this.showCanvas();
    }
  },
  //关闭/开启橡皮擦
  changeClear(e) {
    let flag = e.currentTarget.dataset.param === "false" ? false : true;
    this.changeDataStatus({ isClear: flag, isPen: !flag, isFillColor: false })
  },
  //隐藏弹出框
  hiddenChildrenBox() {
    // clearTimeout(this.clearSelectToolTimer)
    // this.clearSelectToolTimer = setTimeout(() => { this.setData({ selectToolIndex: null }); }, 800);
    this.setData({ selectToolIndex: null });
    this.showCanvas();
  },
  //取色
  pickerColor() {
    this.changeDataStatus({ isColorPicker: !this.data.isColorPicker })
    this.hiddenChildrenBox();
  },
  //获取吸取颜色
  getCanvasColor(e) {
    //隐藏框框
    this.setData({ selectToolIndex: null });
    //this.showCanvas();

    if (!this.data.isColorPicker) return;

    var startX = e.detail.x;
    var startY = e.detail.y;
    const cfg = {
      x: startX,
      y: startY,
      width: 3,
      height: 3,
    }
    let imgData = this.context.getImageData(startX, startY ,3 ,3)
    if (imgData){
      let data = imgData.data
      let rgba = "rgba(" + data[0] + "," + data[1] + "," + data[2] + ",1)";
      this.changeDataStatus({ penColor: rgba, transparency: 1, isPen: true })
    }
    /*wx.canvasGetImageData({
      canvasId: 'draw-canvas',
      ...cfg,
      success: (res) => {
        const data = res.data;
        console.log("colorpicker:",data);
        let rgba = "rgba("+data[0]+","+data[1]+","+data[2]+",1)";
        this.changeDataStatus({ penColor: rgba,transparency: 1})
      },
      fail: (err) => {
        console.error(err)
      }
    })*/
  },
  //保存图片
  saveAsImg(func) {
    wx.showLoading({
      title: '生成图片中',
      mask: true
    })
    
    if(devmode === 'dev'){
      this.saveImgHandlder(func)
    }else{
      this.saveCanvas().then(()=>{
        this.saveImgHandlder(func)
      })
    }
  },
  saveImgHandlder(func) {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.imgCanvas,
      success: (res) => {
        wx.hideLoading()
        wx.showToast({
          title: '已保存到相册',
          icon: 'success',
          duration: 1500
        })
        this.hiddenChildrenBox();
        if (func && func instanceof Function) {
          func();
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error(err)
      }
    })
  },
  //导入图片
  openAndDraw() {
    this.hiddenChildrenBox();
    wx.chooseImage({
      success: (res) => {
        const img = res.tempFilePaths[0]
        const imgEle = this.canvas.createImage();
        imgEle.src = img
        imgEle.onload = ()=>{
          this.context.drawImage(imgEle, 0, 0, this.data.windowWidth, this.data.windowHeight)
        }
      }
    })
  },
  //新建
  newBuild(){
    this.changeDataStatus({ isBuild: true })
  },
  cancelSave(){
    this.changeDataStatus()
    
    this.hiddenChildrenBox();
    this.context.clearRect(0, 0, this.data.windowWidth, this.data.windowHeight);//清空canvas
  },
  confirmSave(){
    let func = this.cancelSave;
    this.changeDataStatus()
    this.hiddenChildrenBox();
    this.saveAsImg(func);
  },
  //改变笔颜色
  changePenColor(e){
    this.changeDataStatus({
      penColor: e.detail.rgba,
      transparency: e.detail.alpha || 1,
      drawRect: this.data.drawRect,
      isCircle: this.data.isCircle,
      brushType: this.data.brushType,
    })
  },
  //保存canvas
  saveCanvas() {
    return new Promise((resolve) => {
      wx.canvasToTempFilePath({
        canvas: this.canvas,
        success: (res) => {
          let img = res.tempFilePath
          let list = this.data.layerList
          let index = this.data.currentLayer
          list[index] = img
          this.setData({ imgCanvas: img, layerList: list });
          resolve()
        },
        fail: (err) => {
          console.error('error', err);
        }
      })
    });
    
  },
  //隐藏canvas
  hiddenCanvas(){
    if (this.data.canvasHidden) return;
    this.context.save();

    if(devmode === 'dev'){
      this.saveCanvas().then(()=>{
        this.setData({ canvasHidden: true})
      })
    }
  },
  //重新显示canvas
  showCanvas(){
    if (!this.data.canvasHidden) return;
    this.setData({ canvasHidden: false });

    this.context.restore();
  },
  //点击canvas图片
  clickImg(){
    //隐藏框框
    this.setData({ selectToolIndex: null });
    this.showCanvas();
  },
  //开启矩形
  setDrawRect(){
    this.changeDataStatus({
      drawRect: !this.data.drawRect
    })
    this.hiddenChildrenBox();
  },
  //开启圆形
  setDrawCircle() {
    this.changeDataStatus({
      isCircle: !this.data.isCircle
    })
    this.hiddenChildrenBox();
  },
  //开启填充
  setFillColor() {
    this.changeDataStatus({
      isFillColor: !this.data.isFillColor,
      drawRect: this.data.drawRect,
      isCircle: this.data.isCircle
    })
    this.hiddenChildrenBox();
  },
  //回退
  goBack(){

  },
  //添加文字
  addText(){
    this.changeDataStatus({
      isText: true, theText: ''
    })
  },
  cancelText(){
    this.changeDataStatus()
  },
  confirmText(){
    if (this.data.theText == '') return;
    this.hiddenChildrenBox();//显示canvas

    let text = this.data.theText
    let res = this.drawTextStyle()
    this.drawText()

    let textWidth = res.width,
      textHeight = res.height
    this.changeDrawArr({x:50, y:40, w:textWidth, h:textHeight})

    //改变状态值
    this.changeDataStatus()
  },
  //字
  drawTextStyle(color = this.data.penColor){
    let text = this.data.theText
    this.context.fillStyle = color;
    this.context.font = 'bold '+ this.data.fontSize + 'px serif';

    let textWidth = this.context.measureText(text).width,
      textHeight = this.data.fontSize + 10
    return {
      width: textWidth,
      height: textHeight
    }
  },
  drawText(x=50,y=40){
    let text = this.data.theText
    this.context.fillText(text, x, y);
  },
  //获取文字
  changeText(e){
    this.setData({ theText: e.detail.value });
  },
  //新增层级
  addLayer(){
    let list = this.data.layerList
    list.unshift(null)
    this.setData({ layerList: list});
  },
  //改变当前层
  changeCurrentLayer(e){
    let index = e.currentTarget.dataset.index;
    this.setData({ currentLayer: index });

    // //清空
    // this.context.clearRect(0, 0, this.data.windowWidth, this.data.windowHeight);
    // this.context.draw();
  },
  //修改橡皮透明度
  changeRubberOpacity(e){
    this.changeDataStatus({ rubberOpacity: e.detail.value, isClear: true })
  },
  //开启拖拽
  startDrag(){
    let d = !this.data.isDrag
    this.changeDataStatus({ isDrag: d, isFillColor: false})
    this.hiddenChildrenBox();
  },
  //拖拽
  dragCanvasStart(){
    let x = this.startX, y = this.startY;
    this.tempGraphArr = [];
    this.drawArr && this.drawArr.forEach((item, index) => {
      console.log(item, x, y)
      const action = item.isInGraph(x, y);
      console.log(action)
      if(action){
        item.action = action;
        this.tempGraphArr.push(item);
      }else{
        item.action = false;
        item.selected = false;
      }
    })
    // 保存点击时元素的信息
    if (this.tempGraphArr.length > 0) {
      for (let i = 0; i < this.tempGraphArr.length; i++) {
        let lastIndex = this.tempGraphArr.length - 1;
        // 对最后一个元素做操作
        if (i === lastIndex) {
          this.tempGraphArr[lastIndex].selected = true;
          this.currentGraph = Object.assign({}, this.tempGraphArr[lastIndex]);
        }else{
          // 不是最后一个元素，不需要选中，也不记录状态
          this.tempGraphArr[i].action = false;
          this.tempGraphArr[i].selected = false;
        }
      }
    }
    this.context.save();
    this.draw()
  },
  dragCanvas(x,y){
    if (this.tempGraphArr && this.tempGraphArr.length > 0) {
      const currentGraph = this.tempGraphArr[this.tempGraphArr.length - 1];
      if (currentGraph.action === 'move') {
        currentGraph.centerX = this.currentGraph.centerX + (x - this.startX);
        currentGraph.centerY = this.currentGraph.centerY + (y - this.startY);
      }
      // 更新4个坐标点（相对于画布的坐标系）
      currentGraph._rotateSquare();
      this.draw()
    }
  },
  //绘图
  draw() {
    this.drawArr.forEach((item) => {
      item.paint();
    });
    // return new Promise((resolve) => {
    //   this.context.draw(false, () => {
    //     resolve();
    //   });
    // });
  },
  //存储绘图数组
  changeDrawArr({ x, y, w, h, type = 'text', color = this.data.penColor, size = this.data.penSize, alpha=this.data.transparency}) {
    let _this = this
    let graph = new dragGraph(
      {
        x, y, w, h, type,
        color, size, alpha,
        drawStyle() {
          let res = {}
          switch (type) {
            case 'text':
              res = _this.drawTextStyle(color)
              break;
            case 'rect':
            case 'circle':
              _this.setLineStyle(color,size)
              break;
            case 'fillRect':
            case 'fillCircle':
              _this.setFillStyle(color,alpha)
              break;
          }
          return res
        },
        draw(x, y, w, h) {
          switch (type) {
            case 'text':
              _this.drawText(x, y)
              break;
            case 'rect':
              _this.drawRectGraph(x, y, w, h)
              break;
            case 'fillRect':
              _this.drawRectGraph(x, y, w, h, true)
              break;
            case 'circle':
              _this.drawCircleHandler(x, y)
              break;
            case 'fillCircle':
              _this.drawCircleHandler(x, y, true);
              break;
          }
        },
      },
      this.context
    )
    this.drawArr.push(graph);
    // this.draw();
  },
  //初始化状态值
  changeDataStatus(obj={}){
    let data = Object.assign({
      isClear: false,
      isColorPicker: false,
      isDrag: false,
      isText: false,
      drawRect: false,
      isBuild: false,
      isCircle: false,
      isPen: false,
      brushType: '',
    }, obj)
    this.setData(data)
  },
  //改变色盘
  changeColorPlate(e){
    let index = e.currentTarget.dataset.param
    this.setData({
      colorPlateSelect: index
    })
  },
  //设置笔刷
  setBrushType(e){
    let type = e.currentTarget.dataset.param;
    let param = {}
    if (type != "colorstar"){
      param = Object.assign({},param,{
        color: this.data.penColor,
        width: 10,
        opacity: this.data.transparency,
        scale: 1,
      })
    }
    this.changeDataStatus({
      brushType: type
    })

    let brush = new brushStroke(Object.assign({},param,{type}),this.context)
    this.brushStroke = brush
    // if (!this.brushStroke){
      
    // }else{
    //   this.brushStroke.changeType(type)
    // }
    this.setData({
      showBrush: false
    })
    this.hiddenChildrenBox();
  },
  showBrushModal(){
    this.setData({
      showBrush: true
    })
  },
  cancelSelectBrush(){
    this.setData({
      showBrush: false
    })
  },
  //重置笔触样式
  refreshBrushStyle(){
    if (!this.brushStroke) return
    this.brushStroke.changeColor(this.data.penColor)
  },
})