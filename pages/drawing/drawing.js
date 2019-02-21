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
//bug：无法解决canvas层级问题 => canvas和图片交替出现 => 闪动明显；点击tab切换类型之后，canvas内容会被清空，=> 图片和canvas交替时调用api，请求缓慢
Page({

  /**
   * 页面的初始数据
   */
  data: {
    toolList: [{ icon: 'icon-caidan1', title: '菜单' }, { icon: 'icon-gongju', title: '工具' },
    { icon: 'icon-qianbi', title: '笔大小' }, { icon: 'icon-kujialeqiyezhan_tiaosepan', title: '颜色' },
    { icon: 'icon-xiangpica', title: '橡皮' }, { icon: 'icon-quanping', title: '收起' },],
    //是否显示工具栏
    showTool: true,
    penSize: 2,
    penColor: "#000000",
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
    const context = wx.createCanvasContext('draw-canvas');

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
    //得到触摸点的坐标
    this.startX = e.changedTouches[0].x
    this.startY = e.changedTouches[0].y
    this.context = wx.createCanvasContext();
    if (this.data.isColorPicker) {

    } else if (this.data.isClear) { //橡皮擦
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
    var startX1 = e.changedTouches[0].x;
    var startY1 = e.changedTouches[0].y;
    if (this.data.isColorPicker) {

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
  touchEnd() {

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
        this.setData({ isClear: false, isColorPicker:false });
        break;
      case 4:
        this.setData({ isClear: true, isColorPicker:false});//开启橡皮擦
        break;
      case 5:
        //显示和隐藏
        this.setData({ showTool: index == this.data.selectToolIndex });
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
  },
  //关闭/开启橡皮擦
  changeClear(e) {
    let flag = e.currentTarget.dataset.param === "false" ? false : true;
    this.setData({ isClear: flag, isColorPicker:false});
  },
  //隐藏弹出框
  hiddenChildrenBox() {
    let _this = this;
    setTimeout(function () { _this.setData({ selectToolIndex: null }); }, 800);

    this.showCanvas();
  },
  //取色
  pickerColor() {
    // var c = this.context.canvasGetImageData(mouseX, mouseY, 1, 1).data;
    // var red = c[0];
    // var green = c[1];
    // var blue = c[2];
    this.setData({ isColorPicker: !this.data.isColorPicker, isClear: false });

  },
  //获取吸取颜色
  getCanvasColor(e) {
    //隐藏框框
    this.setData({ selectToolIndex: null });
    //this.showCanvas();

    if (!this.data.isColorPicker) return;
    let _this = this;
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
        console.log(data)
        _this.hiddenChildrenBox();
      },
      fail: (err) => {
        console.error(err)
      }
    })
  },
  //保存图片
  saveAsImg(func) {
    let _this = this;
    wx.canvasToTempFilePath({
      canvasId: 'draw-canvas',
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: (res) => {
            console.log(res);
            _this.hiddenChildrenBox();
            if(func){
              func();
            }
          },
          fail: (err) => {
            console.error(err)
          }
        })
      },
      fail: (err) => {
        console.error(err)
      }
    }, this)
  },
  //导入图片
  openAndDraw() {
    let _this = this;
    wx.chooseImage({
      success: (res) => {
        const ctx = wx.createCanvasContext('draw-canvas', this);
        ctx.drawImage(res.tempFilePaths[0], 0, 0)
        ctx.draw();
        _this.hiddenChildrenBox();
      }
    })
  },
  //新建
  newBuild(){
    this.setData({ isBuild: true, isClear: false, isColorPicker:false });
  },
  cancelSave(){
    this.setData({ isBuild: false });
    const ctx = wx.createCanvasContext('draw-canvas');
    ctx.clearRect(0, 0, 375, 600);
    ctx.draw();
    this.hiddenChildrenBox();
  },
  confirmSave(){
    let func = this.cancelSave;
    this.setData({ isBuild: false });
    this.hiddenChildrenBox();
    this.saveAsImg(func);
  },
  //改变笔颜色
  changPenColor(e){
    this.setData({
      penColor: e.detail.colorData,
    })
  },
  //保存canvas
  saveCanvas() {
    let _this = this;
    //const ctx = wx.createCanvasContext('draw-canvas', this);
    
    wx.canvasToTempFilePath({ 
      canvasId: 'draw-canvas',
      success: (res) => { 
        console.log('result',res);
        _this.setData({ imgCanvas: res.tempFilePath});
      },
      fail: (err) => {
        console.error('error',err);
      }
    }) 
  },
  //隐藏canvas
  hiddenCanvas(){
    let _this = this;
    const ctx = wx.createCanvasContext('draw-canvas', this);
    this.setData({ canvasHidden: true });
    ctx.save();
    ctx.draw(false, () => {
      setTimeout(() => {
        _this.saveCanvas();
      }, 200);
    });
  },
  //重新显示canvas
  showCanvas(){
    const ctx = wx.createCanvasContext('draw-canvas', this);
    // ctx.drawImage(this.data.imgCanvas, 0, 0);
    // ctx.draw();
    ctx.restore();
    ctx.draw();
    this.setData({ canvasHidden: false });
  },
  clickImg(){
    //隐藏框框
    this.setData({ selectToolIndex: null });
    this.showCanvas();
  },
})