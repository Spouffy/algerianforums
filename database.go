package main

import (
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"

	//"errors"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

const db_conn = "host=localhost port=5432 user=postgres dbname=test sslmode=disable"

func dbConn() *sql.DB {
	db, err := sql.Open("postgres", db_conn)
	checkError(err)
	return db
}

func RegisterNewUser(u *signup) (x session, err error) {

	code := isUserRegistered(u.Username, u.Email)
	switch code {
	case "username":
		return session{}, errors.New("Username Already exists")
	case "email":
		return session{}, errors.New("Email Already used.")
	case "both":
		return session{}, errors.New("existing_account")
	}

	db := dbConn()
	defer db.Close()

	id := uuid.NewString()
	query := fmt.Sprintf(`INSERT INTO users(username, password, email, session_id) VALUES ('%s','%s','%s','%s')`, u.Username, u.Password, u.Email, id)
	_, err = db.Exec(query)

	_ = db.QueryRow(fmt.Sprintf(`INSERT INTO profiles (score, profile_pic) VALUES ( %d, '%s')`, 100, "/content/default_pic.jpg"))

	s := new(session)
	return *s, nil
}

func LoginUser(u *login) (x session, ok bool) {
	db := dbConn()
	defer db.Close()

	query := fmt.Sprintf("SELECT password, session_id FROM users WHERE username = '%s'", u.Username)
	rows, _ := db.Query(query)

	var (
		id       string
		password string
	)

	defer rows.Close()
	for rows.Next() {
		err := rows.Scan(&password, &id)
		// if row don't exist, send bad request http response.
		if err != nil {
			return session{}, false
		}
		// If row found, continue
	}
	// check the password hash using checkPasswordHash()
	// if incorrect; send bad credentials http response.
	if !CheckPasswordHash(password, u.Password) {
		return session{}, false
	}
	// if correct password continue
	return session{ID: id}, true
}

func isSessionValid(id string) (ok bool) {
	db := dbConn()
	defer db.Close()

	var sess_id string
	err := db.QueryRow(fmt.Sprintf("SELECT session_id FROM users WHERE session_id = '%s'", id)).Scan(&sess_id)
	if err != nil {
		return false
	}
	return true
}

func getUserInfoFromSession(id string) (User, bool) {
	db := dbConn()
	defer db.Close()

	user := User{}

	err := db.QueryRow(fmt.Sprintf("SELECT id, username, email FROM users WHERE session_id = '%s'", id)).Scan(&user.ID, &user.Username, &user.Email)
	if err != nil {
		return User{}, false
	}
	err = db.QueryRow(fmt.Sprintf("SELECT profile_pic, score FROM profiles WHERE id = %d", user.ID)).Scan(&user.Picture, &user.Score)
	if err != nil {
		return User{}, false
	}

	return user, true
}

func isUserRegistered(username string, email string) string {
	db := dbConn()
	defer db.Close()

	row := db.QueryRow(fmt.Sprintf(`SELECT username, email FROM users WHERE username = '%s' OR email = '%s'`, username, email))
	var (
		usrn string
		mail string
	)
	row.Scan(&usrn, &mail)
	if mail != "" && usrn != "" {
		return "both"
	}
	if usrn != "" {
		return "username"
	}
	if mail != "" {
		return "email"
	}

	return "none"
}

func storeChatHistory(chatname string, history string) bool {
	db := dbConn()
	defer db.Close()

	_, err := db.Exec(fmt.Sprintf("UPDATE %s SET history = CONCAT(history, '%s')", chatname, history))
	if err != nil {
		fmt.Println(err)
		return false
	}

  fmt.Print("New Message in : ", chatname, "\n")

	return true
}

func getChatHistory(id int, chatname string) string {
	db := dbConn()
	defer db.Close()

	var history string

	_ = db.QueryRow(fmt.Sprintf("SELECT history FROM %s WHERE id = %d", chatname, id)).Scan(&history)
	msgs := strings.SplitAfter(history, ";")
	i0 := len(msgs) - (40 * id)
	i1 := len(msgs) - (40 * (id - 1))
	if i0 < 0 {
		i0 = 0
	}
	if i1 < 0 {
		i1 = 0
	}
	return strings.Join(msgs[i0:i1], "")
}

func getProfile(username string) (Profile, bool) {
	db := dbConn()
	defer db.Close()

	var profile Profile
	var id uint

	err := db.QueryRow(fmt.Sprintf("SELECT id FROM users WHERE username = '%s'", username)).Scan(&id)
	if err != nil {
		return Profile{}, false
	}

	err = db.QueryRow(fmt.Sprintf("SELECT score, profile_pic FROM profiles WHERE id = %d", id)).Scan(&profile.Score, &profile.Picture)
	if err != nil {
		return Profile{}, false
	}
	profile.Username = username
	return profile, true
}

func insertNewPost(post *Post) (ok bool) {
	db := dbConn()
	defer db.Close()
	query := fmt.Sprintf("INSERT INTO posts (posted_by, title, content, img, likes, comments) VALUES (%d, '%s', '%s', '%s', %d, '%s')", post.PostedBy, post.Title, post.Content, post.Img, 0, "")
	_, err := db.Exec(query)

	if err != nil {
		fmt.Println("insertNewPot Error: ", err)
		return false
	}

	fmt.Println("New Post.")
	return true
}

func getPosts(i int) []Post {
	db := dbConn()
	defer db.Close()

	var length_txt string
	err := db.QueryRow("SELECT MAX(id) FROM posts").Scan(&length_txt)
	checkError(err)
	l, err := strconv.Atoi(length_txt)

	query := fmt.Sprintf("SELECT * FROM posts WHERE id BETWEEN %d AND %d ORDER BY id DESC", l-(i*10), l-((i-1)*10))

	rows, err := db.Query(query)
	checkError(err)

	var posts []Post

	for rows.Next() {
		var this_post Post
		err = rows.Scan(&this_post.ID, &this_post.PostedBy, &this_post.PostedAt, &this_post.Title, &this_post.Content, &this_post.Img, &this_post.Likes, &this_post.Comments)
		if err != nil {
			fmt.Println("Row Scanning error : ", err)
		}
		posts = append(posts, this_post)
	}

	return posts
}
