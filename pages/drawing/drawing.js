// pages/drawing/drawing.js
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
    toolList: [{ icon: 'icon-caidan1', title: '菜单' }, { icon: 'icon-gongju', title: '工具' },
    { icon: 'icon-qianbi', title: '笔大小' }, 
    { icon: 'icon-kujialeqiyezhan_tiaosepan', title: '颜色' },
    { icon: 'icon-xiangpica', title: '橡皮' }, { icon: 'icon-quanping', title: '收起' },],
    //是否显示工具栏
    showTool: true,
    
    penSize: 2,
    penColor: "#000000",
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
    //const context = wx.createCanvasContext('draw-canvas');
    this.context = wx.createCanvasContext('draw-canvas');
    //获取宽高
    wx.getSystemInfo({
      success: (res) => {
        console.log(res.pixelRatio)
        console.log(res.windowWidth, res.windowHeight)
        let pixel = res.pixelRatio;
        this.setData({ windowWidth: res.windowWidth, windowHeight: res.windowHeight - 50});
      }
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
  //手指触摸动作开始
  touchStart(e) {
    if (e.touches.length > 1) return;
    //得到触摸点的坐标
    this.startX = e.changedTouches[0].x
    this.startY = e.changedTouches[0].y
    
    this.context.setGlobalAlpha(this.data.transparency);
    if (this.data.isColorPicker) {//取色器

    } else if (this.data.drawRect){//矩形
      this.context.setStrokeStyle(this.data.penColor);
      this.context.setLineWidth(this.data.penSize);
      this.context.setLineCap('round');

    }else if (this.data.isClear) { //橡皮擦
      this.context.setGlobalAlpha(1);
      this.context.setStrokeStyle('#FFFFFF');
      this.context.setLineCap('round'); //设置线条端点的样式
      this.context.setLineJoin('round'); //设置两线相交处的样式
      this.context.setLineWidth(this.data.eraserSize); //设置线条宽度
      this.context.save();  //保存当前坐标轴的缩放、旋转、平移信息
      this.context.beginPath() //开始一个路径 
      this.context.arc(this.startX, this.startY, 5, 0, 2 * Math.PI, true);  //添加一个弧形路径到当前路径，顺时针绘制  这里总共画了360度  也就是一个圆形 
      this.context.fill();  //对当前路径进行填充
      this.context.restore();  //恢复之前保存过的坐标轴的缩放、旋转、平移信息
    } else {//画笔
      this.context.setStrokeStyle(this.data.penColor);
      this.context.setLineWidth(this.data.penSize);
      this.context.setLineCap('round'); // 让线条圆润
      this.context.beginPath();
    }
  },
  //手指触摸后移动
  touchMove(e) {
    var startX1 = e.changedTouches[0].x,
      startY1 = e.changedTouches[0].y;
    if (this.data.isColorPicker) {

    } else if (this.data.drawRect) {//矩形 
      var newW = startX1 - this.startX, newH = startY1 - this.startY;
      this.context.clearRect(0, 0, this.data.windowWidth, this.data.windowHeight);
      this.context.strokeRect(this.startX, this.startY, newW, newH);//画新的矩形
    } else if (this.data.isClear) { //橡皮擦
      this.context.save();  //保存当前坐标轴的缩放、旋转、平移信息
      this.context.moveTo(this.startX, this.startY);  //把路径移动到画布中的指定点，但不创建线条
      this.context.lineTo(startX1, startY1);  //添加一个新点，然后在画布中创建从该点到最后指定点的线条
      this.context.stroke();  //对当前路径进行描边
      this.context.restore()  //恢复之前保存过的坐标轴的缩放、旋转、平移信息
      this.startX = startX1;
      this.startY = startY1;
    } else {//画笔
      this.context.moveTo(this.startX, this.startY);
      this.context.lineTo(startX1, startY1);
      this.context.stroke();//画线
      this.startX = startX1;
      this.startY = startY1;
    }
    //this.context.draw();
    wx.drawCanvas({
      canvasId: 'draw-canvas',
      reserve: true,
      actions: this.context.getActions() // 获取绘图动作数组
    })
  },
  touchEnd(e) {
    this.context.save(); 
  },
  sliderPenchange(e) {
    //滑块修改笔触大小
    //console.log('发生 change 事件，携带值为', e.detail.value)
    if (this.data.selectToolIndex == 4) {
      //改变橡皮大小
      this.setData({ eraserSize: e.detail.value, isClear: true, isColorPicker:false});
    } else if (this.data.selectToolIndex == 2) {
      //改变画笔大小
      this.setData({ penSize: e.detail.value, isClear: false, isColorPicker:false});
    }
    this.hiddenChildrenBox();
  },
  showToolChildren(e) {
    let index = e.currentTarget.dataset.index;//事件传参：参数只能绑定在元素上
    switch (index) {
      case 2:
        this.setData({ isClear: false, isColorPicker: false, drawRect:false});
        break;
      case 4:
        this.setData({ isClear: true, isColorPicker: false, drawRect:false});//开启橡皮擦
        break;
      case 5:
        //显示和隐藏
        this.setData({ showTool: index == this.data.selectToolIndex});
        break;
      default:
        break;
    }
    if (index != this.data.selectToolIndex) {
      this.setData({ selectToolIndex: index });
      if(index != 5){
        this.hiddenCanvas();
      }
    } else {
      this.setData({ selectToolIndex: null});
      if (index != 5) {
        this.showCanvas();
      }
    }
    if (index == 5 && this.data.canvasHidden) {
      this.showCanvas();
    }
  },
  //关闭/开启橡皮擦
  changeClear(e) {
    let flag = e.currentTarget.dataset.param === "false" ? false : true;
    this.setData({ isClear: flag, isColorPicker: false, drawRect:false});
  },
  //隐藏弹出框
  hiddenChildrenBox() {
    setTimeout(() => { this.setData({ selectToolIndex: null }); }, 800);

    this.showCanvas();
  },
  //取色
  pickerColor() {
    this.setData({ isColorPicker: !this.data.isColorPicker, isClear: false, drawRect:false});
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
    wx.canvasGetImageData({
      canvasId: 'draw-canvas',
      ...cfg,
      success: (res) => {
        const data = res.data;
        console.log("colorpicker:",data);
        let rgba = "rgba("+data[0]+","+data[1]+","+data[2]+",1)";
        this.setData({ isColorPicker: false, isClear: false, penColor: rgba });
      },
      fail: (err) => {
        console.error(err)
      }
    })
  },
  //保存图片
  saveAsImg(func) {
    // wx.canvasToTempFilePath({
    //   canvasId: 'draw-canvas',
    //   success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: this.data.imgCanvas,
          success: (res) => {
            console.log(res);
            this.hiddenChildrenBox();
            if (func && func instanceof Function){
              func();
            }
          },
          fail: (err) => {
            console.error(err)
          }
        })
    //   },
    //   fail: (err) => {
    //     console.error(err)
    //   }
    // },this);
  },
  //导入图片
  openAndDraw() {
    this.hiddenChildrenBox();
    wx.chooseImage({
      success: (res) => {
        const ctx = wx.createCanvasContext('draw-canvas', this);
        ctx.drawImage(res.tempFilePaths[0], 0, 0)
        ctx.draw();
      }
    })
  },
  //新建
  newBuild(){
    this.setData({ isBuild: true, isClear: false, isColorPicker:false });
  },
  cancelSave(){
    this.setData({ isBuild: false});
    
    this.hiddenChildrenBox();
    this.context.clearRect(0, 0, this.data.windowWidth, this.data.windowHeight);//清空canvas
    this.context.draw();
  },
  confirmSave(){
    let func = this.cancelSave;
    this.setData({ isBuild: false });
    this.hiddenChildrenBox();
    this.saveAsImg(func);
  },
  //改变笔颜色
  changePenColor(e){
    this.setData({
      penColor: e.detail.colorData,
      transparency: e.detail.alpha
    });
  },
  //保存canvas
  saveCanvas() {
    this.context.draw(false, wx.canvasToTempFilePath({
      canvasId: 'draw-canvas',
      success: (res) => { 
        console.log('result',res);
        this.setData({ imgCanvas: res.tempFilePath, canvasHidden:true});
      },
      fail: (err) => {
        console.error('error',err);
      }
    })
    )
  },
  //隐藏canvas
  hiddenCanvas(){
    if (this.data.canvasHidden) return;
    this.context.save();
 
    this.saveCanvas();
    //console.log('one',this.context.getActions());
  },
  //重新显示canvas
  showCanvas(){
    //const ctx = wx.createCanvasContext('draw-canvas', this);
    if (!this.data.canvasHidden) return;
    this.setData({ canvasHidden: false });

    this.context.restore();
    this.context.drawImage(this.data.imgCanvas, 0, 0);//重绘canvas
    this.context.draw();
  },
  //点击canvas图片
  clickImg(){
    //隐藏框框
    this.setData({ selectToolIndex: null });
    this.showCanvas();
  },
  //开启矩形
  setDrawRect(){
    this.setData({ drawRect: !this.data.drawRect, isClear: false, isColorPicker:false });
    this.hiddenChildrenBox();
  },
  //回退
  goBack(){

  },
  //添加文字
  addText(){
    this.setData({ isText: true, theText:''});
  },
  cancelText(){
    this.setData({ isText: false });
  },
  confirmText(){
    if (this.data.theText == '') return;
    this.hiddenChildrenBox();//显示canvas

    this.context.setFillStyle(this.data.penColor);
    this.context.setFontSize(25);
    this.context.setGlobalAlpha(this.data.transparency);
    this.context.fillText(this.data.theText, 50, 40);
    
    this.context.draw();
    this.setData({ isText: false });
  },
  //获取文字
  changeText(e){
    this.setData({ theText: e.detail.value });
  },

})