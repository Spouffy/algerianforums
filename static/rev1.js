
var env = {
  load: {
    prefix: '{#',
    suffix: '#}'
  },
  api: [],
  parts: [],
}

function r(selector) {
  if (typeof selector == "object") return selector
  var selected = document.querySelectorAll(selector);
  if (selected.length > 1) {
    return selected
  }
  return selected[0]
}

var funcs = [
  {
    name: "hide",
    func: function(elm, arg) {
      elm.style.display = "none"
    }
  },
  {
    name: "show",
    func: function(elm, arg) {
      elm.style.display = arg || "block"
    }
  },
  {
    name: "on",
    func: function(elm, arg) {
      elm.addEventListener(arg.event, arg.handler)
    }
  },
  {
    name: "rem",
    func: function(elm) {
      elm.remove()
    }
  },
  {
    name: "crtElm",
    func: function(elm, args) {
      const el = document.createElement(args)
      elm.appendChild(el)
      return el
    }
  },
  {
    name: "css",
    func: function(elm, args) {
      Object.assign( elm.style, args )
    }
  }
]

funcs.forEach(e => {
  if (!e.list) {
    NodeList.prototype[e.name] = function(args) {
      let returns = []
      this.forEach(el => {
        returns.push(e.func(el, args))
      })
      if (returns[0] != undefined) return returns
    }
  }
  Object.prototype[e.name] = function(args) {
    return e.func(this, args)
  }
})

class Elm {
  constructor(tag) {
    this.elm = document.createElement(tag);
    return this.elm;
  }
  append(parent) {
    parent.appendChild(this.elm)
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
    var p = r(parent)
    var x = whatsBetween(this.text, env.load.prefix, env.load.suffix)
    x.forEach(e => {
      html = html.replace(`${env.load.prefix}${e}${env.load.suffix}`, obj[e]);
    })
    this.scripts = whatsBetween(html, '{$', '$}')
    this.scripts.map(e => {
      var varname = 'rev_';
      evalScript(`var ${varname} = () => {${e}}`)
      html = html.replace(`{$${e}$}`, rev_())
    })
    p.insertAdjacentHTML("beforeend", html)
    evalScript(this.script)

    if (!this.styled) {
      r('body').crtElm('style').textContent = this.style;
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

  async get() {
    var data = fetch(this.url, { method: "GET"})
    .then(res => {return res.json()})
    .then(e => { return e })
    return data
  }

  xmlget() {
    var req = new XMLHttpRequest()
    req.open('GET', this.url, false)
    req.send()
    return req.responseText
  }
}

window.onload = () => {
  var rev_containers = document.querySelectorAll("[fget]")
  rev_containers.forEach(c => {
    var params = JSON.parse(c.getAttribute("fget"))

    var req = new Request(env.api[params.api] + params.url)
    var res = JSON.parse(req.xmlget())

    var obj
    if (params.object != undefined) {
      obj = res[params.object]
    } else {
      obj = res
    }
    const count = params.count || obj.length

    for (let i = 0; i < count; i++) {
      env.parts[params.part].append(c, obj[i])
    }
  })
}

class keybind {
  constructor(obj, func) {
    this.obj = obj
    this.enabled = true
    this.handler = function (e) {
      if (e.ctrlKey === obj.ctrl) {
        if (e.altKey === obj.atl) {
          if (e.key === obj.key.toLowerCase()) {
            func()
          }
        }
      } 
    } 
    window.addEventListener('keyup', this.handler)
  }

  enable() {
    if (!this.enabled) {
      window.addEventListener('keyup', this.handler)
      this.enabled = true
    }
  }

  disable() {
    if (this.enabled) {
      window.removeEventListener("keyup", this.handler)
    }
  }
}

class JsonMenu {
  constructor(parent, json, func, b) {
    var t = mapi(json)
    var a = µ(parent).crtElm('div')
    this.elms = []
    t.forEach(e => {
      var wrap = new rev(a).crtElm('div')
      var lbl = new rev(wrap).crtElm('label')
      var inp = new rev(wrap).crtElm('input')
      this.elms.push([lbl, inp])

      lbl.textContent = e[0]
      inp.value = e[1]
      inp.dataset.key = e[0]
      inp.oninput = e => {
        func({ event: e, data: json })
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
  console.log(`${time()}`, e);
}

function evalScript(script) {
  var scr = document.head.crtElm("script")
  scr.innerHTML = script
  scr.remove()
}
