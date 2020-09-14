// pages/drawing/components/iconbutton/iconbutton.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String,
      value: ""
    },
    icon: {
      type: String,
      value: "",
    },
    isSelect:{
      type: Boolean,
      value: false
    },
    dataParam:{
      type: Boolean,
      value: false,
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    clickButton(e){
      this.triggerEvent('clickbutton', {
        e
      });
    },
  }
})
