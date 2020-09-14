// pages/drawing/component/colorpicker1/colorPicker.js
const colorTrans = require('../../js/colorTrans.js')
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    colorData: {
      type: String,
      value: "#fff"
    },
    alpha:{
      type:String,
      value:1,
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    rgba:{
      R:255,
      G:255,
      B:255,
      A:1,
    },
    rgbColor:{
      R: 'red',
      G: 'green',
      B: 'blue',
      A:'#cccccc'
    },
    colorStr:'#fff',
    colorInput:'fff',
    alpha:1,//透明度
  },
  //组件生命周期
  lifetimes:{
    attached() {
      // 在组件实例进入页面节点树时执行
      this.initialColor();
    },
  },
  //监听器
  observers:{
    'rgba':function(n){
      console.log("监听",n)
      let colorValue = this.getRgbaColor();
      let colorStr = this.hexify(colorValue);
      this.setData({ colorStr: colorStr, colorInput: colorStr.replace("#", "") });//保存颜色值
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    //rgba转换成16进制色值
    hexify(color) {
      return colorTrans.hexify(color)
    },
    /*16进制颜色转为RGB格式*/
    colorRgb: function (color) {
      return colorTrans.colorRgb(color)
    },
    //初始化值
    initialColor(){
      let colorValue = this.data.colorData;
      if (/^(rgb|RGB)/.test(colorValue)) {
        var colorStr = this.hexify(colorValue);
        //保存颜色值
        this.setData({ colorStr: colorStr, colorInput: colorStr.replace("#","")});

      } else if (/^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6}|[0-9a-fA-f]{8})$/.test(colorValue)) {
        //十六进制颜色
        //保存颜色值
        this.setData({ colorStr: colorValue, colorInput: colorValue.replace("#","")});
        colorValue = this.colorRgb(colorValue);
      }
      this.getRgbaData(colorValue);
    },
    //根据rgba给 data 赋值
    getRgbaData(color){
      if(!color) return;
      var arr = color.replace(/rgba?\(/i, '').replace(/\)/, '').replace(/[\s+]/g, '').split(',');
      this.setData({ rgba: { R: arr[0], G: arr[1], B: arr[2], A: arr[3]}});
    },
    //改变slider值
    colorSliderChange(e){
      let param = e.currentTarget.dataset.param;
      let rgb = this.data.rgba;
      if(param == 'A'){
        rgb[param] = e.detail.value.toFixed(1);
      }else{
        rgb[param] = e.detail.value;
      }
      this.setData({ rgba: rgb });

      //绑定外部方法
      this.triggerEvent('changecolor', {
        colorData: this.data.colorStr,
        rgba: this.getRgbaColor(),
        alpha: this.data.rgba.A
      });
    },
    //根据data.rgba获取rgba()
    getRgbaColor(){
      let rgb = this.data.rgba;
      return "rgba("+rgb.R+","+rgb.G+","+rgb.B+","+rgb.A+")";
    },
    //输入框失焦 改变色值
    inputColorValue(e){
      let value = "#"+e.detail.value;
      this.setData({colorData:value});
      this.initialColor();

      //绑定外部方法
      this.triggerEvent('changecolor', {
        colorData: this.data.colorData,
        rgba: this.getRgbaColor(),
        alpha: this.data.rgba.A
      });
    },
    //改变透明度
    alphaSliderChange(e){
      let val = e.detail.value.toFixed(1)
      let color = Object.assign({},this.data.rgba,{
        A: val
      })
      this.setData({ alpha: val, rgba: color });
      //绑定外部方法
      this.triggerEvent('changecolor', {
        colorData: this.data.colorStr,
        rgba: this.getRgbaColor(),
        alpha: val
      });
    },
  }
})
