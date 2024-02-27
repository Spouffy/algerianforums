// The TODO list 
// //  Menus togglers
// //  


// DOM Elements
const user_label = r('#name_label')
const overlay = r('#overlay')
const post_overlay = r('#addpost')
const all_overlays = r(".overlay")


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
  user_label.innerHTML = username
}

// API funcs 

function newPost() {
  title = r("#addpost_title").value
  content = r("#addpost_content").value
  imgIn = r("#post_image")

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
