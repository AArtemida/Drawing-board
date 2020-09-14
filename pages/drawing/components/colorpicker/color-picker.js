// pages/drawing/component/colorpicker2/colorPicker.js
const colorTrans = require('../../js/colorTrans.js')
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    colorData: {
      type: String,
      value: "#000"
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    background: 'hsl(0, 100%, 50%)',

    hsv:{//色相，饱和度，色调
      h: 0,
      s: 0,
      v: 0,
      a: 1,
    },
    rgba:{
      a: 1,
    },
    colorVal:'#fff',
    hueLeft: 0,

    alphaLeft: 0,
    alphaBg: 'transparent',

    pickerLeft: 0,
    pickerTop: 0,
    pickerBg: '',
    
    domInfo:{},
  },
  lifetimes: {
    attached() {
      
    },
    ready() {
      const query = this.createSelectorQuery()
      query.select('#colorPicker').boundingClientRect((res)=>{
        this.setData({
          domInfo: res,
          alphaLeft: res.width,
        })
        //初始位置
        let hsv = this.data.hsv
        this.getHuePos(hsv.h)
        this.getAlphaPos(hsv.a)
        this.getPickerPos(hsv)
      })
      query.exec()
      this.initColor()
    },
  },
  //监听器
  observers: {
    'hsv':function(val){
      console.log("监听颜色",val)
      this.getColorVal()
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    //初始化
    initColor(){
      let colorValue = this.data.colorData;
      let rgb = {}
      if (/^(rgb|RGB)/.test(colorValue)) {
        rgb = colorTrans.getRgbaData(colorValue)
      } else if (/^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6}|[0-9a-fA-f]{8})$/.test(colorValue)) {
        rgb = colorTrans.hex2rgb(colorValue)
      }
      let hsv = colorTrans.rgb2hsv(rgb)
      let bg = `hsl(${hsv.h}, 100%, 50%)`
      this.setData({
        hsv,
        background: bg,
      })
    },
    //获取显示的颜色
    getColorVal(){
      let color = this.data.hsv
      let hsl = colorTrans.hsv2hsl(color)
      // let val = `hsla(${hsl.h},${this.formatValue(hsl.s)},${this.formatValue(hsl.l)},${color.a})`
      let rgb = colorTrans.hsv2rgb(color)
      let val = `rgba(${rgb.r},${rgb.g},${rgb.b},${color.a})`
      this.setData({
        colorVal: val,
      })
      this.getAlphaBg(hsl)

      //绑定外部方法
      this.triggerEvent('changecolor', {
        rgba: val,
        alpha: color.a
      });
    },
    formatValue(num){
      if(num <= 1){
        return Math.round(num * 100) + '%'
      }
      return num
    },
    //改变色相
    getHue(){
      let width = this.data.domInfo.width;
      let h =  Math.round((this.data.hueLeft / width) * 360 * 100) / 100
      let bg = `hsl(${h}, 100%, 50%)`
      let color = this.data.hsv
      color.h = h
      this.setData({
        background: bg,
        hsv: color
      })
    },
    //改变透明度
    getAlpha(){
      let width = this.data.domInfo.width;
      let alpha = Math.round(this.data.alphaLeft / width * 100) / 100
      let color = this.data.hsv
      color.a = alpha
      this.setData({
        hsv: color
      })
    },
    //改变饱和度
    getColor(){

    },
    //获取透明背景颜色
    getAlphaBg(hsl){
      this.setData({
        alphaBg: `linear-gradient(to right, transparent, hsl(${hsl.h}, ${this.formatValue(hsl.s)}, ${this.formatValue(hsl.l)}))`
      })
    },
    //点击色相条
    sliderClick(e){
      if (e.touches.length > 1) return;
      let offsetLeft = this.data.domInfo.left;
      
      let left = e.changedTouches[0].clientX - offsetLeft
      this.setData({
        hueLeft: left
      })
      this.getHue()
    },
    sliderStart(e){
      if (e.touches.length > 1) return;
      this.hueStartX = e.changedTouches[0].clientX
      this.hueCurX = this.data.hueLeft
    },
    //色相移动
    sliderMove(e){
      let left = this.getDisX(e, this.hueStartX, this.hueCurX)
      this.setData({
        hueLeft: left
      })
      this.getHue()
    },
    //获取新的left
    getDisX(e, startX, curX){
      let max = this.data.domInfo.width
      let startX1 = e.changedTouches[0].clientX
      let disX = startX1 - startX
      let left = disX + curX
      if (left > max) {
        left = max
      } else if (left < 0) {
        left = 0
      }
      // console.log({ startX, startX1, left})
      return left
    },
    sliderEnd(){

    },
    //透明度移动
    sliderClickAlpha(e){
      if (e.touches.length > 1) return;
      let offsetLeft = this.data.domInfo.left;

      let left = e.changedTouches[0].clientX - offsetLeft
      this.setData({
        alphaLeft: left
      })
      this.getAlpha()
    },
    sliderStartAlpha(e) {
      if (e.touches.length > 1) return;
      this.alphaStartX = e.changedTouches[0].clientX
      this.alphaCurX = this.data.alphaLeft
    },
    sliderMoveAlpha(e) {
      let left = this.getDisX(e, this.alphaStartX, this.alphaCurX)
      this.setData({
        alphaLeft: left
      })
      this.getAlpha()
    },
    sliderEndAlpha(){},
    //选择颜色
    areaClick(e){
      if (e.touches.length > 1) return;
      let offsetTop = this.data.domInfo.top,
        offsetLeft = this.data.domInfo.left;
      let width = this.data.domInfo.width;
      let left = e.changedTouches[0].clientX - offsetLeft,
        top = e.changedTouches[0].clientY - offsetTop;
      const s = Math.round(left / width * 100) / 100
      const v = Math.round((1 - top / 100) * 100) / 100
      let color = this.data.hsv;
      color.s = s;
      color.v = v;
      this.setData({
        pickerLeft: left,
        pickerTop: top,
        hsv: color,
      })
    },
    //根据颜色获取位置
    getHuePos(h){
      let width = this.data.domInfo.width;
      let left = h * width / 360
      this.setData({
        hueLeft: left
      })
    },
    getAlphaPos(a){
      let width = this.data.domInfo.width;
      let left = a * width
      this.setData({
        alphaLeft: left
      })
    },
    getPickerPos({h,s,v}){
      let width = this.data.domInfo.width;

      let left = Math.round(s * width * 100) /100,
        top = Math.round((1 - v) * 100)

      this.setData({
        pickerLeft: left,
        pickerTop: top
      })
    },
  }
})
