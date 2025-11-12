package wailsx

import (
	"encoding/base64"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"github.com/wenerme/wode/wode-assitant/wailsx/internal/wsx"
)

type WailsxService struct {
}

type WriteFileRequest struct {
	Destination string `json:"destination"`
	Base64      string `json:"base64"`
}

type OpenExplorerRequest struct {
	Path string `json:"path"`
}

func (s *WailsxService) ShowInspector(req WriteFileRequest) error {
	return nil
}

func (s *WailsxService) OpenExplorer(req OpenExplorerRequest) error {
	path := req.Path
	if !filepath.IsAbs(path) {
		cwd, err := os.Getwd()
		if err != nil {
			return fmt.Errorf("failed to get current working directory: %w", err)
		}
		path = filepath.Join(cwd, path)
	}

	var cmd *exec.Cmd
	fileInfo, err := os.Stat(path)
	if err != nil {
		return fmt.Errorf("path not found: %w", err)
	}
	isDir := fileInfo.IsDir()
	slog.Info("reveal", "path", path, "dir", isDir)

	switch runtime.GOOS {
	case "windows":
		// Windows 使用 /select, 选中文件
		if isDir {
			cmd = exec.Command("explorer", path)
		} else {
			cmd = exec.Command("explorer", "/select,", path)
		}
	case "darwin":
		// macOS 使用 Finder 打开并选中文件，避免直接执行可执行文件

		if isDir {
			cmd = exec.Command("open", path)
		} else {
			cmd = exec.Command("open", "-R", path)
		}
	case "linux":
		// Linux 系统对文件选中支持有限，这里仅使用 xdg-open 打开目录或文件
		cmd = exec.Command("xdg-open", path)
	default:
		return fmt.Errorf("unsupported platform")
	}

	return cmd.Start()
}

func (s *WailsxService) WriteFile(req WriteFileRequest) error {
	data, err := base64.StdEncoding.DecodeString(req.Base64)
	if err != nil {
		return fmt.Errorf("failed to decode base64 data: %w", err)
	}

	err = os.WriteFile(req.Destination, data, 0644)
	if err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}
	return nil
}

//func (s *WailsxService) OnStartup(ctx context.Context, options application.ServiceOptions) error {
//	return nil
//}
//
//func (s *WailsxService) OnShutdown() error {
//	return nil
//}
//
//func (s *WailsxService) ServeHTTP(w http.ResponseWriter, r *http.Request) {
//
//}

type WindowsService struct {
}

func (s *WindowsService) IsConsoleVisible(show bool) bool {
	hwnd := wsx.GetConsoleWindow()
	if hwnd != 0 {
		return wsx.IsVisible(hwnd)
	}
	return false
}
func (s *WindowsService) ShowConsoleWindow(show bool) error {
	wsx.ShowConsoleWindow(show)

	return nil
}
