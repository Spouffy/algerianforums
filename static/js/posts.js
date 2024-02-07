// TODO :
// Event Handler for when reaching posts end scroll position
// getTenPosts finitions

const posts_cont = $("#posts_container")
const post_part = new Part('/parts/post.rev.html')

async function getTenPosts(offset) {
  const res = await fetch("/api/posts/" + offset)
  data = await res.json()
  return data
}

function generatePosts(offset) {
  getTenPosts(offset).then(data => appendPosts(data))
}

function appendPosts(posts) {
  posts_cont.elm.innerHTML = ""
  posts.forEach(post => {
    post_part.append("#posts_container", post)
  })
}

generatePosts(1)
