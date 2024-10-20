package main

import (
	"fmt"
	"os"
	"scrumpoker/cmds"
)

func main() {
	argCount := len(os.Args)

	if argCount <= 1 {
		help()
		os.Exit(1)
	}

	switch os.Args[1] {
	case "cron":
		err := cmds.Cron()

		if err != nil {
			fmt.Println(err)
		}
	case "server":
		fmt.Println("server")
	default:
		help()
	}
}

func help() {
	fmt.Println("Usage:")
	fmt.Println("")
	fmt.Println("\tcron\tRun various cron tasks")
	fmt.Println("\tserver\tRun the Websocket server")
	fmt.Println("")
}
