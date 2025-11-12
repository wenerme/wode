//go:build !windows

package wsx

import (
	"os/exec"
)

type GUID struct {
	Data1 uint32
	Data2 uint16
	Data3 uint16
	Data4 [8]byte
}

func SetSysProcAttr(cmd *exec.Cmd, attr *SysProcAttr) {

}

func DisableQuickEditMode() error {
	return nil
}

func ShowConsoleWindow(show bool) (err error) {
	return nil
}

func GetConsoleWindow() HANDLE {
	return 0
}

func GetCurrentProcessId() int {
	return 0
}

func GetWindowThreadProcessId(hwnd HANDLE) (HANDLE, int) {
	return 0, 0
}

func ShowWindowAsync(hwnd HWND, cmdshow int) bool {
	return false
}

func IsVisible(hwnd uintptr) bool {
	return false
}
