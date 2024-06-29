const msgTextElm = r("#message_text");
const sendBtn = r("#send_btn");
const messages_cont = r("#messages");

const message_part = new Part("./templates/message.rev.html")

let globchat_scrolls = 1

window.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    sendMessage()
    scrollToLastMsg()
  }
})
messages_cont.onscrollend = e => {
  if (e.target.scrollTop == 0) {
    globchat_scrolls++
    getChatHistory(globchat_scrolls)
  }
}


async function getChatHistory(i) {
  fetch("/api/chathistory/global_history/" + i).then(e => {
    e.text().then(msgs => {
      msgs = msgs.split(";")
      msgs.pop()
      if (i > 1 ){
        msgs.reverse();
      }
      msgs.forEach(msg => {
        parts = msg.split(":")
        newMessage(parts[0], parts[1].replaceAll('"', ''), i)
      })
    })
  })
}

getChatHistory(globchat_scrolls)


// Websocket shit
var ws = new WebSocket("wss://blueserver.mywire.org/ws")
ws.onmessage = (e) => {
  data = JSON.parse(e.data)
  newMessage(data.user, data.msg)
  scrollToLastMsg()
}

sendBtn.onclick = sendMessage

function newMessage(sender, text, i) {

  message = `<div><span class="sender">${atob(sender)}</span> : <span class="text">${atob(text)}</span></div>`
  if (i > 1) {
    messages_cont.innerHTML = message + messages_cont.innerHTML
    return
  } 
  messages_cont.innerHTML += message
}

function sendMessage() {
  ws.send(msgTextElm.value)
  msgTextElm.value = ""
}

function scrollToLastMsg() {
  messages_cont.scrollTop = messages_cont.scrollHeight;
}

