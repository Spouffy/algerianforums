package main

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
)

func checkError(err error) {
  if err != nil { fmt.Println(err) ;panic(err)}
}

func HashPassword(password string) (string, error) {
  bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
  return string(bytes), err
}

func CheckPasswordHash(hash string, password string) bool {
  err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) 
  return err == nil
}


