var env = {
    load: {
      prefix: '{#',
      suffix: '#}'
    }
  }
  
  class rev {
    constructor(elm) {
      //console.log(elm);
      if (elm == null || elm.length === 0) { console.error("REV : Element doesn't exist"); return }
      this.elm = elm
      return this
    }
    show(d) {
      if (this.elm.length != undefined) {
        this.elm.forEach(e => {
          e.style.display = d || 'block'
        })
        return true
      }
      this.elm.style.display = d || 'block'
    }
    hide() {
      if (this.elm.length != undefined) {
        this.elm.forEach(e => {
          e.style.display = 'none'
        })
        return true;
      }
      this.elm.style.display = 'none'
      return true;
    }
    forEach(f) {
      if (this.elm.length != undefined) {
        this.elm.forEach(f)
        return true;
      }
      console.error('Rev: Can\'t use forEach on a single element')
      return false
    }
    rem() {
      if (this.elm.length != undefined) {
        this.elm.forEach(e => {
          e.remove()
        })
        return true;
      }
      this.elm.remove()
    }
    on(event, f) {
      if (this.elm.length != undefined) {
        this.elm.forEach(e => {
          e.addEventListener(event, f)
        });
        return;
      }
      this.elm.addEventListener(event, f)
    }
    async load(path, obj) {
      var req = new Request(path)
      var yeh = await req.get('text')
      console.log(yeh);
    }
    innerHTML(t) {
      if (this.elm.length != undefined) {
        this.elm.forEach(e => {
          e.innerHTML += t || ''
        }) 
        return
      }
      this.elm.innerHTML += t || ''
    }
    crtElm(tag) {
      return new Elm(tag, this.elm);
    }
    style(dat) {
      if (this.elm.length == undefined) {
        {this.elm.style }
      } else {
        this.elm.forEach(e => {
  
        })
      }
    }
  }
  
  class Elm {
    constructor(tag, parent) {
      this.elm = document.createElement(tag);
      parent.appendChild(this.elm)
      return this.elm;
    }
  }
  
  class Part {
    constructor(path) {
      this.req = new Request(path)
      this.text = this.req.xmlget()
      this.styled = false
  
      this.style = whatsBetween(this.text, '<style>', '</style>')[0]
      this.html = whatsBetween(this.text, '<html>', '</html>')[0]
      this.script = whatsBetween(this.text, '<script>', '</script>')[0]
    }
  
    append(parent, obj) {
      var html = this.html;
      var p = $(parent)
      var x = whatsBetween(this.text, env.load.prefix, env.load.suffix)
      x.forEach(e => {
        html = html.replace(`${env.load.prefix}${e}${env.load.suffix}`, obj[e]);
      })
      this.scripts = whatsBetween(html, '{$', '$}')
      this.scripts.map( e => {
        var varname = 'rev_';
        evalScript(`var ${varname} = () => {${e}}`)
        html = html.replace(`{$${e}$}`,rev_())
      })
      p.innerHTML(html)
      evalScript(this.script)
  
      if (!this.styled) {
        $('body').crtElm('style').textContent = this.style;
        this.styled = true;
      }
    }
  }
  
  class Element {
    constructor(bp) {
      // Design this hehe :)
    }
  }
  
  class Request {
    constructor(url) {
      this.url = url
      return this
    }
  
    async get(format) {
      fetch(this.url, {
        method: 'GET',
      }).then(res => {
        if (format && format == 'text') return res.text()
        return res.json()
      }).then(res => { return res })
    }
  
    xmlget() {
      var req = new XMLHttpRequest()
      req.open('GET', this.url, false)
      req.send()
      return req.responseText
    }
  }
  
  class keybind {
    constructor (obj, func) {
      this.obj = obj
      this.event = window.addEventListener('keyup', e => {
        if (e.ctrlKey === obj.ctrl) {
          if (e.altKey === obj.atl) {
            if (e.key === obj.key.toLowerCase()) {
              func()
            }
          }
        }
      })
    }
  }
  
  class JsonMenu {
    constructor(parent, json, func,b) {
      var t = mapi(json)
      var a = $(parent).crtElm('div')
      this.elms = []
      t.forEach( e => {
        var wrap = new rev(a).crtElm('div')
        var lbl = new rev(wrap).crtElm('label')
        var inp = new rev(wrap).crtElm('input')
        this.elms.push([lbl, inp])
  
        lbl.textContent = e[0]
        inp.value = e[1]
        inp.dataset.key = e[0]
        inp.oninput = e => {
          func({event: e, data:json})
          if (b[0]) {
            console.log('e');
            var k = e.target.dataset.key
            json[k] = e.target.value
            localStorage.setItem(b[1], JSON.stringify(json))
          }
        }
      })
    }
  }
  
  function jsonmap(json, func) {
    var arr = mapi(json)
    arr.forEach(k => {
      func(k, json)
    })
  }
  
  function mapi(json) {
    let t = []
    var str = JSON.stringify(json);
    str = str.replace('{', '').replace('}', '')
    str.split(',').forEach(s => {
      t.push(s.split(':'))
    })
    for (let i = 0; i < t.length; i++) {
      t[i][0] = t[i][0].replace('"', "").replace('"', "");
      t[i][1] = t[i][1].replace('"', "").replace('"', "");
    }
    return t
  }
  
  function whatsBetween(str, str1, str2) {
    var arr1 = str.split(str1)
    var arr2 = []
    delete arr1[0]
    arr1.forEach(e => {
      arr2.push(e.split(str2)[0])
    });
    return arr2
  }

  function time() {
    var x = new Date;
    var h = x.getHours() < 10 ? `0${x.getHours()}` : x.getHours()
    var m = x.getMinutes() < 10 ? `0${x.getMinutes()}` : x.getMinutes()
    var s = x.getSeconds() < 10 ? `0${x.getSeconds()}` : x.getSeconds()
    var time = `${h}:${m}:${s}`
    return time
  }
  
  function log(e) {
    console.log( `${time()}`, e);
  }

  function $(selector) {
    if (typeof selector === 'object') return new rev(selector)
    if (selector.startsWith('#')) return new rev(document.querySelector(selector))
    if (selector.startsWith('.')) return new rev(document.querySelectorAll(selector))
    var elm = document.querySelectorAll(selector);
    if (elm.length == 1) return new rev(elm[0]);
    return new rev(elm);
  }
  
  function evalScript(script) {
    var e = new Elm('script', document.head)
    e.innerHTML = script;
    e.remove()
  }
