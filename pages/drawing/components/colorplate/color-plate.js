// pages/drawing/component/colorpicker1/colorPicker.js
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
      console.log(this.data.colorData);
      this.initialColor();
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    //rgba转换成16进制色值
    hexify(color) {
      var values = color.replace(/rgba?\(/i, '').replace(/\)/, '').replace(/[\s+]/g, '').split(',');
      var a = parseFloat(values[3] || 1),
        r = Math.floor(a * parseInt(values[0]) + (1 - a) * 255),
        g = Math.floor(a * parseInt(values[1]) + (1 - a) * 255),
        b = Math.floor(a * parseInt(values[2]) + (1 - a) * 255);
      return "#" + ("0" + r.toString(16)).slice(-2) + ("0" + g.toString(16)).slice(-2) + ("0" + b.toString(16)).slice(-2);
    },
    /*16进制颜色转为RGB格式*/
    colorRgb: function (color) {
      var sColor = color.toLowerCase();
      if (sColor && /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/.test(sColor)) {
        if (sColor.length === 4) {
          var sColorNew = "#";
          for (var i = 1; i < 4; i += 1) {
            sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
          }
          sColor = sColorNew;
        }
        //处理六位的颜色值
        var sColorChange = [];
        for (var i = 1; i < 7; i += 2) {
          sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
        }
        return "rgba(" + sColorChange.join(",") + ",1)";
      } else {
        return sColor;
      }
    },
    //初始化值
    initialColor(){
      let colorValue = this.data.colorData;
      if (/^(rgb|RGB)/.test(colorValue)) {
        var colorStr = this.hexify(colorValue);
        //保存颜色值
        this.setData({ colorStr: colorStr, colorInput: colorStr.replace("#","")});

      } else if (/^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/.test(colorValue)) {
        //十六进制颜色
        //保存颜色值
        this.setData({ colorStr: colorValue, colorInput: colorValue.replace("#","")});
        colorValue = this.colorRgb(colorValue);
      }
      this.getRgbaData(colorValue);
    },
    //根据rgba给 data 赋值
    getRgbaData(color){
      console.log('color:'+color);
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
      console.log(this.data.rgba);

      let colorValue = this.getRgbaColor();
      let colorStr = this.hexify(colorValue);
      this.setData({ colorStr: colorStr, colorInput: colorStr.replace("#","") });//保存颜色值

      //绑定外部方法
      this.triggerEvent('changecolor', {
        colorData: this.data.colorStr,
        alpha: this.data.alpha,
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
      });
    },
    //改变透明度
    alphaSliderChange(e){
      this.setData({ alpha: e.detail.value });
      //绑定外部方法
      this.triggerEvent('changecolor', {
        colorData: this.data.colorStr,
        alpha: this.data.alpha,
      });
    },
  }
})
