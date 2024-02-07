package main

type login struct{
  Username string `json:"username"`
  Password string `json:"password"`
}

type signup struct{
  Username string `json:"username"`
  Password string `json:"password"`
  Email string `json:"email"`
}

type session struct {
  ID string
  Username string
}

type User struct {
  ID uint32
  Username string
  Email string
  Picture string
  Score uint32
}

type UserSearch struct {
  Username string
  Email string
}

type Profile struct {
  Username string
  Score uint32
  Picture string
}

type Post struct {
  ID uint32
  PostedBy  uint32 
  PostedAt string 
  Title string `json:"title"`
  Content string `json:"content"`
  Img string `json:"img"`
  Likes uint32
  Comments string 
}

