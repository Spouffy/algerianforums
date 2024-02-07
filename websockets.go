package main

import (
	"encoding/base64"
	"fmt"
	"io"

	"golang.org/x/net/websocket"
)

var globalHistory string

type Chat struct {
	conns map[*websocket.Conn]bool
}

func NewChat() *Chat {
	return &Chat{
		conns: make(map[*websocket.Conn]bool),
	}
}

func (c *Chat) handleWS(ws *websocket.Conn) {
	fmt.Println("New Connection from Client: ", ws.RemoteAddr())

	c.conns[ws] = true

	c.readLoop(ws)
}

func (c *Chat) readLoop(ws *websocket.Conn) {
	buf := make([]byte, 1024)

	cookie, err := ws.Request().Cookie("session_id")
	user, ok := getUserInfoFromSession(cookie.Value)

	if !ok || err != nil {
		ws.Close()
    delete(c.conns, ws)
	}

	for {
		n, err := ws.Read(buf)
		if err != nil {
			if err == io.EOF {
				break
			}
			fmt.Println("read error: ", err)
			continue
		}
		msg := buf[:n]

		msga := base64.StdEncoding.EncodeToString(msg)
		usrn := base64.StdEncoding.EncodeToString([]byte(user.Username))
		c.broadcast([]byte(fmt.Sprintf(`{ "user": "%s", "msg": "%s" }`, usrn, msga)))
    history := fmt.Sprintf(`%s:"%s";`, usrn, msga)

		ok := storeChatHistory("global_history", history)
		if !ok {
			fmt.Println("Global chat history saving didn't work")
		}
		
	}

}

func (c *Chat) broadcast(b []byte) {
	for ws := range c.conns {
		go func(ws *websocket.Conn) {
			if _, err := ws.Write(b); err != nil {
				fmt.Println("A Connection Closed : ", ws.Config().Location)
				delete(c.conns, ws)
			}
		}(ws)
	}
}
