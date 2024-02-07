// The TODO list 
// //  Menus togglers
// //  


// DOM Elements
const user_label = $('#name_label')
const overlay = $('#overlay')
const post_overlay = $('#addpost')
const all_overlays = $(".overlay")


// Overlay toggles
overlay.hide()
all_overlays.hide()

function togglePost() {
  overlay.show()
  post_overlay.show("flex")
}

// Getting user data
var username
var email
var score

fetch("/api/userdata").then(e => {
  e.json().then(e => {
    username = e.Username
    email = e.Email
    score = e.Score

    main()
  })
})

function main() {
  user_label.elm.innerHTML = username
}

// API funcs 

function newPost() {
  title = $("#addpost_title").elm.value
  content = $("#addpost_content").elm.value
  imgIn = $("#post_image").elm

  if (imgIn.files.length > 0) {
    fr = new FileReader()
    fr.readAsDataURL(imgIn.files[0])
    fr.onload = e => {
      sendPost(e.target.result)
      overlay.hide()
      all_overlays.hide()
      generatePosts(1)
    }
  } else {
    sendPost()
    overlay.hide()
    all_overlays.hide()
    generatePosts(1)
  }

  function sendPost(img) {
    post = {
      title: title,
      content: content,
      img: img || ""
    }

    console.log(post)
    fetch("/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(post)
    }).then(res => {
      console.log(res)
    })
  }

}
