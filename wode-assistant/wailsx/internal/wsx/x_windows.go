package wsx

import (
	"os"
	"os/exec"
	"syscall"
	"unsafe"
)

//type GUID = windows.GUID

func SetSysProcAttr(cmd *exec.Cmd, src *SysProcAttr) {
	if src == nil {
		return
	}
	dst := cmd.SysProcAttr
	if dst == nil {
		dst = &syscall.SysProcAttr{}
		cmd.SysProcAttr = dst
	}

	dst.HideWindow = src.HideWindow
	dst.CmdLine = src.CmdLine
	dst.CreationFlags = src.CreationFlags
	dst.Token = syscall.Token(src.Token)
	dst.NoInheritHandles = src.NoInheritHandles
	dst.AdditionalInheritedHandles = make([]syscall.Handle, len(src.AdditionalInheritedHandles))
	for i, handle := range src.AdditionalInheritedHandles {
		dst.AdditionalInheritedHandles[i] = syscall.Handle(handle)
	}
	dst.ParentProcess = syscall.Handle(src.ParentProcess)
}

// // https://github.com/wailsapp/wails/tree/v3-alpha/v3/pkg/w32
// // https://github.com/gonutz/ide/blob/main/w32/functions_windows.go
var (
	//	kernel32                 = syscall.NewLazyDLL("kernel32.dll")
	//	user32                   = syscall.NewLazyDLL("user32.dll")
	//	getConsoleWindow         = kernel32.NewProc("GetConsoleWindow")
	//	showWindow               = user32.NewProc("ShowWindow")
	//	getWindowThreadProcessId = user32.NewProc("GetWindowThreadProcessId")
	getCurrentProcessId = kernel32.NewProc("GetCurrentProcessId")
	setConsoleMode      = kernel32.NewProc("SetConsoleMode")
	getConsoleMode      = kernel32.NewProc("GetConsoleMode")
	//	showWindowAsync          = kernel32.NewProc("ShowWindowAsync")
)

//
//const (
//	_SW_HIDE = 0 // 隐藏窗口
//	_SW_SHOW = 5 // 显示窗口
//)
//
//// 获取控制台窗口句柄
//func GetConsoleWindow() HANDLE {
//	handle, _, _ := getConsoleWindow.Call()
//	return HANDLE(handle)
//}
//

func ShowConsoleWindow(show bool) (out bool) {
	hwnd := GetConsoleWindow()
	if hwnd != 0 {
		if show {
			out = ShowWindowAsync(hwnd, SW_SHOW)
		} else {
			out = ShowWindowAsync(hwnd, SW_HIDE)
		}
	}
	return false
}

const (
	ENABLE_QUICK_EDIT_MODE = 0x0040
	ENABLE_EXTENDED_FLAGS  = 0x0080
)

//

func DisableQuickEditMode() error {
	// PowerShell 可以避免 Quick Edit Mode 的问题
	// Start-Process -FilePath "yourapp.exe" -NoNewWindow

	var mode uint32
	handle := syscall.Handle(os.Stdin.Fd())

	// 获取当前控制台模式
	_, _, err := getConsoleMode.Call(uintptr(handle), uintptr(unsafe.Pointer(&mode)))
	if err != nil {
		return err
	}

	// 禁用 Quick Edit Mode
	mode &^= ENABLE_QUICK_EDIT_MODE
	mode |= ENABLE_EXTENDED_FLAGS

	_, _, err = setConsoleMode.Call(uintptr(handle), uintptr(mode))
	return err
}

//	func GetWindowThreadProcessId(hwnd HANDLE) (HANDLE, uint32) {
//		var processId uint32
//		ret, _, _ := getWindowThreadProcessId.Call(
//			hwnd,
//			uintptr(unsafe.Pointer(&processId)),
//		)
//		return ret, processId
//	}
func GetCurrentProcessId() int {
	id, _, _ := getCurrentProcessId.Call()
	return int(id)
}

//
//func ShowWindowAsync(hwnd HWND, cmdshow int) bool {
//	ret, _, _ := showWindowAsync.Call(
//		uintptr(hwnd),
//		uintptr(cmdshow))
//
//	return ret != 0
//}
