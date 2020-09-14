const parseAlpha = (a) => a !== void 0 && !isNaN(+a) && 0 <= +a && +a <= 1 ? +a : 1

function boundValue(value, max) {
  value = Math.min(max, Math.max(0, value))
  if ((Math.abs(value - max) < 0.000001)) {
    return 1
  }
  return (value % max) / (~~max)
}

module.exports = {
  /*
   * h.s.v转换为h.s.l
   */
  hsv2hsl({h, s, v}){
    return {
      h,
      s: (s * v / ((h = (2 - s) * v) < 1 ? h : 2 - h)) || 0,
      l: h / 2
    } 
  },
  /*
   * h.s.l转换为h.s.v
   */
  hsl2hsv({h, s, l, a}){
    let _s
    let _v
    l *= 2
    s *= (l <= 1) ? l : 2 - l
    _v = (l + s) / 2
    _s = (2 * s) / (l + s)
    return {
      h,
      s: _s,
      v: _v,
      a: parseAlpha(a)
    }
  },
  /*
   * hex转换为rgb
   */
  hex2rgb(color){
    color = color.replace(/^#/, '')
    if (color.length === 3) {
      const colors = []
      for (let i = 0; i < 3; i++) {
        colors.push(color[i], color[i])
      }
      color = colors.join('')
    }

    const r = parseInt([color[0], color[1]].join(''), 16)
    const g = parseInt([color[2], color[3]].join(''), 16)
    const b = parseInt([color[4], color[5]].join(''), 16)

    return {
      r,
      g,
      b
    }
  },
  /*
   * rgb转化为hex
   */
  rgb2hex({r, g, b}){
    let color = '#'
      ;[r, g, b].forEach(v => {
        let hex = v.toString(16)
        if (hex.length < 2) {
          hex = '0' + hex
        }
        color += hex
      })
    return color
  },
  /*
   * h.s.v. 转换为 r.g.b
   */
  hsv2rgb({h, s, v}){
    h = boundValue(h, 360)
    s = boundValue(s * 100, 100)
    v = boundValue(v * 100, 100)

    const i = ~~(h * 6)
    const f = h * 6 - i
    const p = v * (1 - s)
    const q = v * (1 - f * s)
    const t = v * (1 - (1 - f) * s)
    let r = 0, g = 0, b = 0;
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v, g = p, b = q; break;
    }

    const round = (value) => Math.round(value * 255)

    return {
      r: round(r),
      g: round(g),
      b: round(b)
    }
  },
  /*
   * r.g.b 转换为 h.s.v
   */
  rgb2hsv({r, g, b, a}) {
    r = boundValue(r, 255)
    g = boundValue(g, 255)
    b = boundValue(b, 255)
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s
    let v = max

    const d = max - min
    s = max === 0 ? 0 : d / max

    if (max === min) {
      h = 0
    } else {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }

    return {
      h: h * 360,
      s: s,
      v: v,
      a: parseAlpha(a)
    }
  },
  //rgba转换成16进制色值
  hexify(color) {
    let values = color.replace(/rgba?\(/i, '').replace(/\)/, '').replace(/[\s+]/g, '').split(',');
    let orgA = parseFloat(values[3] || 1);
    let a = 1,
      r = Math.floor(a * parseInt(values[0]) + (1 - a) * 255),
      g = Math.floor(a * parseInt(values[1]) + (1 - a) * 255),
      b = Math.floor(a * parseInt(values[2]) + (1 - a) * 255);
    let alpha = Math.ceil(orgA * 255).toString(16)
    let res = "#" + ("0" + r.toString(16)).slice(-2) + ("0" + g.toString(16)).slice(-2) + ("0" + b.toString(16)).slice(-2)
    if (alpha && alpha != 'ff') {
      res += alpha
    }
    return res;
  },
  /*16进制颜色转为RGB格式*/
  colorRgb: function (color) {
    let sColor = color.toLowerCase();
    if (sColor && /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6}|[0-9a-fA-f]{8})$/.test(sColor)) {
      let alpha = 1;
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
      //有透明度
      if (sColor.length === 9) {
        let alphaColor = parseInt("0x" + sColor.substr(7, 9))
        alpha = alphaColor / 255
      }
      return "rgba(" + sColorChange.join(",") + "," + alpha + ")";
    } else {
      return sColor;
    }
  },
  //获取rgba
  getRgbaData(rgba) {
    if (!rgba) return {};
    var arr = rgba.replace(/rgba?\(/i, '').replace(/\)/, '').replace(/[\s+]/g, '').split(',');
    return {
      r: arr[0],
      g: arr[1],
      b: arr[2],
      a: arr[3] || 1
    }
  },
}