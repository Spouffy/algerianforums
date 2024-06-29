package main

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"text/template"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/crypto/acme/autocert"
	"golang.org/x/net/websocket"
)

func custom_headers(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		c.Response().Header().Set(echo.HeaderReferrerPolicy, "Do Not Hack pls :)")
		return next(c)
	}
}

func loginHandler(c echo.Context) error {
	return c.File("static/login.html")
}

type Template struct {
	templates *template.Template
}

func (t *Template) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func main() {
	e := echo.New()

	fmt.Println("Nice server btw")

	e.AutoTLSManager.Cache = autocert.DirCache("/var/www/.cache")

	e.Use(custom_headers)
	e.Use(middleware.Recover())
	//e.Use(middleware.Logger())

	e.Renderer = &Template{
		templates: template.Must(template.ParseFiles("./static/template.html")),
	}

	e.Static("/", "./static/")
	e.Static("/img", "./img/")
  e.Static("/parts", "./static/templates/")

	e.GET("/", func(c echo.Context) error {

		cookie, err := c.Cookie("session_id")
		if err != nil {
			return loginHandler(c)
		}

		_, ok := getUserInfoFromSession(cookie.Value)
		if !ok {
			return c.Redirect(http.StatusPermanentRedirect, "/login.html")
		}

		return c.File("static/index.html")
	})

	e.File("/login", "static/login.html")
	e.File("/signup", "static/signup.html")

	// Websocket shit
	var GlobChat = NewChat()
	e.GET("/ws", func(c echo.Context) (err error) {
		websocket.Handler(GlobChat.handleWS).ServeHTTP(c.Response(), c.Request())
		return nil
	})

	// Templated pages

	e.GET("/user/:username", func(c echo.Context) error {
		username := c.Param("username")
		profile, ok := getProfile(username)
    if !ok {
      return echo.NewHTTPError(http.StatusNotFound)
    }

		return c.Render(http.StatusOK, "template.html", profile)
	})

	// API routes
	e.POST("/api/login", func(c echo.Context) (err error) {
		possible_login := new(login)
		if err = c.Bind(possible_login); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		sess, ok := LoginUser(possible_login)
		if !ok {
			return echo.NewHTTPError(http.StatusNotFound)
		}

		sess_cookie := &http.Cookie{
			Name:     "session_id",
			Value:    sess.ID,
			Expires:  time.Now().Add((24 * time.Hour) * 15),
			Path:     "/",
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
		}
		c.SetCookie(sess_cookie)
		return c.String(http.StatusOK, "User Logged in !")
	})

	e.POST("/api/signup", func(c echo.Context) (err error) {
		new_user := new(signup)
		if err = c.Bind(new_user); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		new_user.Password, err = HashPassword(new_user.Password)
		checkError(err)
		_, err = RegisterNewUser(new_user)

		if err != nil {
			return echo.NewHTTPError(http.StatusAlreadyReported, err.Error())
		}

		return c.String(http.StatusOK, "User created !")
	})

	e.POST("/api/post", func(c echo.Context) error {
		new_post := new(Post)
		cookie, err := c.Cookie("session_id")
		if err != nil {
			return loginHandler(c)
		}

		user, ok := getUserInfoFromSession(cookie.Value)
		if !ok {
			return echo.NewHTTPError(http.StatusGone, "Invalid session id.")
		}

    id := user.ID
		if err := c.Bind(new_post); err != nil {
			fmt.Println(err)
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		new_post.PostedBy = id
    new_post.Likes = 0
    new_post.Comments = ""

		ok = insertNewPost(new_post) 
    if !ok {
			return echo.NewHTTPError(http.StatusInternalServerError, "Bruh.")
		}
		return c.NoContent(http.StatusCreated)
	})

	e.GET("/api/chathistory/:chatname/:id", func(c echo.Context) error {
		chatname := c.Param("chatname")
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			return c.String(http.StatusBadRequest, "Malformed URL params")
		}
		var history string = getChatHistory(id, chatname)
		return c.String(http.StatusOK, history)
	})

	e.GET("/api/userdata", func(c echo.Context) error {
		cookie, err := c.Cookie("session_id")
		if err != nil {
			return echo.NewHTTPError(http.StatusMethodNotAllowed, err.Error())
		}

		user, ok := getUserInfoFromSession(cookie.Value)
		if !ok {
			return echo.NewHTTPError(http.StatusInternalServerError, errors.New("Bruh"))
		}

		return c.JSON(http.StatusOK, user)

	})

  e.GET("/api/userdata/:user", func(c echo.Context) error {
    cookie, err := c.Cookie("session_id")
    username := c.Param("user")
    ok := isSessionValid(cookie.Value)
    if !ok || err != nil {
      return loginHandler(c)
    }
    
    profile, ok := getProfile(username)
    if !ok {
      return echo.NewHTTPError(http.StatusNotFound, errors.New(fmt.Sprintf("No profile with given username: %s", username)))
    }

    return c.JSON(http.StatusOK, profile)
  })

  e.GET("/api/posts/:i", func(c echo.Context) error {
    i, err := strconv.Atoi(c.Param("i"))
    if err != nil || i < 0 { return echo.NewHTTPError(http.StatusBadRequest)}
    
    posts := getPosts(i) 
    return c.JSON(http.StatusOK, posts)
  })

	e.Logger.Fatal(e.StartAutoTLS("192.168.100.4:443"))
}
