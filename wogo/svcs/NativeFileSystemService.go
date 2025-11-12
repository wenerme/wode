package svcs

import (
	"context"
	"encoding/base64"
	"io"
	"os"
	"path/filepath"
	"strings"

	filesystemservicev1 "github.com/wenerme/wode/wogo/proto/wode/fs/v1"
	"github.com/wenerme/wode/wogo/proto/wode/fs/v1/filesystemservicev1connect"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var _ filesystemservicev1connect.FileSystemServiceHandler = &NativeFileSystemService{}

type NativeFileSystemService struct {
	RootPath string
}

func NewNativeFileSystemService(rootPath string) *NativeFileSystemService {
	if rootPath == "" {
		rootPath = "."
	}
	absRoot, err := filepath.Abs(rootPath)
	if err != nil {
		absRoot = rootPath
	}
	return &NativeFileSystemService{RootPath: absRoot}
}

func (s *NativeFileSystemService) resolvePath(p string) string {
	// Clean the path to remove . and ..
	cleanPath := filepath.Clean(p)

	// If path is absolute (starts with /), treat it as relative to RootPath
	// e.g. /foo -> RootPath/foo
	if filepath.IsAbs(cleanPath) {
		// Remove leading separator to join correctly
		cleanPath = strings.TrimPrefix(cleanPath, string(filepath.Separator))
	}

	return filepath.Join(s.RootPath, cleanPath)
}

func (s *NativeFileSystemService) Readdir(ctx context.Context, req *filesystemservicev1.ReaddirRequest) (*filesystemservicev1.ReaddirResponse, error) {
	fullPath := s.resolvePath(req.Dir)
	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return nil, err
	}

	var stats []*filesystemservicev1.FileStat
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}

		kind := filesystemservicev1.FileKind_FILE_KIND_FILE
		if entry.IsDir() {
			kind = filesystemservicev1.FileKind_FILE_KIND_DIRECTORY
		}

		// Filter by kind if requested
		if req.Kind != nil && *req.Kind != filesystemservicev1.FileKind_FILE_KIND_UNSPECIFIED && *req.Kind != kind {
			continue
		}

		// Filter hidden files if not requested
		if !req.Hidden && strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		// Return path relative to root (API path)
		relPath := filepath.Join(req.Dir, entry.Name())
		if !strings.HasPrefix(relPath, "/") {
			relPath = "/" + relPath
		}

		stat := &filesystemservicev1.FileStat{
			Directory: req.Dir,
			Path:      relPath,
			Name:      entry.Name(),
			Kind:      kind,
			Mtime:     timestamppb.New(info.ModTime()),
			Size:      info.Size(),
		}
		stats = append(stats, stat)
	}

	return &filesystemservicev1.ReaddirResponse{Data: stats}, nil
}

func (s *NativeFileSystemService) Stat(ctx context.Context, req *filesystemservicev1.StatRequest) (*filesystemservicev1.StatResponse, error) {
	fullPath := s.resolvePath(req.Path)
	info, err := os.Stat(fullPath)
	if err != nil {
		return nil, err
	}

	kind := filesystemservicev1.FileKind_FILE_KIND_FILE
	if info.IsDir() {
		kind = filesystemservicev1.FileKind_FILE_KIND_DIRECTORY
	}

	stat := &filesystemservicev1.FileStat{
		Directory: filepath.Dir(req.Path),
		Path:      req.Path,
		Name:      info.Name(),
		Kind:      kind,
		Mtime:     timestamppb.New(info.ModTime()),
		Size:      info.Size(),
	}

	return &filesystemservicev1.StatResponse{Data: stat}, nil
}

func (s *NativeFileSystemService) Mkdir(ctx context.Context, req *filesystemservicev1.MkdirRequest) (*filesystemservicev1.MkdirResponse, error) {
	fullPath := s.resolvePath(req.Path)
	if req.Recursive != nil && *req.Recursive {
		if err := os.MkdirAll(fullPath, 0755); err != nil {
			return nil, err
		}
	} else {
		if err := os.Mkdir(fullPath, 0755); err != nil {
			return nil, err
		}
	}
	return &filesystemservicev1.MkdirResponse{}, nil
}

func (s *NativeFileSystemService) ReadFile(ctx context.Context, req *filesystemservicev1.ReadFileRequest) (*filesystemservicev1.ReadFileResponse, error) {
	fullPath := s.resolvePath(req.Path)
	content, err := os.ReadFile(fullPath)
	if err != nil {
		return nil, err
	}

	resp := &filesystemservicev1.ReadFileResponse{}
	if req.Encoding == "binary" {
		resp.Content = content
	} else {
		resp.Base64 = base64.StdEncoding.EncodeToString(content)
	}

	return resp, nil
}

func (s *NativeFileSystemService) WriteFile(ctx context.Context, req *filesystemservicev1.WriteFileRequest) (*filesystemservicev1.WriteFileResponse, error) {
	var content []byte
	var err error

	if req.Base64 != "" {
		content, err = base64.StdEncoding.DecodeString(req.Base64)
		if err != nil {
			return nil, err
		}
	}

	fullPath := s.resolvePath(req.Path)
	// Ensure directory exists
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}

	flag := os.O_WRONLY | os.O_CREATE | os.O_TRUNC
	if req.Overwrite == nil || !*req.Overwrite {
		flag = os.O_WRONLY | os.O_CREATE | os.O_EXCL
	}

	f, err := os.OpenFile(fullPath, flag, 0644)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	if _, err := f.Write(content); err != nil {
		return nil, err
	}

	return &filesystemservicev1.WriteFileResponse{}, nil
}

func (s *NativeFileSystemService) Rename(ctx context.Context, req *filesystemservicev1.RenameRequest) (*filesystemservicev1.RenameResponse, error) {
	oldPath := s.resolvePath(req.OldPath)
	newPath := s.resolvePath(req.NewPath)

	if req.Overwrite == nil || !*req.Overwrite {
		if _, err := os.Stat(newPath); err == nil {
			return nil, os.ErrExist
		}
	}
	if err := os.Rename(oldPath, newPath); err != nil {
		return nil, err
	}
	return &filesystemservicev1.RenameResponse{}, nil
}

func (s *NativeFileSystemService) Exists(ctx context.Context, req *filesystemservicev1.ExistsRequest) (*filesystemservicev1.ExistsResponse, error) {
	fullPath := s.resolvePath(req.Path)
	_, err := os.Stat(fullPath)
	exists := err == nil || !os.IsNotExist(err)
	return &filesystemservicev1.ExistsResponse{Data: exists}, nil
}

func (s *NativeFileSystemService) Copy(ctx context.Context, req *filesystemservicev1.CopyRequest) (*filesystemservicev1.CopyResponse, error) {
	srcPath := s.resolvePath(req.Src)
	destPath := s.resolvePath(req.Dest)

	srcInfo, err := os.Stat(srcPath)
	if err != nil {
		return nil, err
	}

	if srcInfo.IsDir() {
		// Simple directory copy (create dir only)
		if err := os.MkdirAll(destPath, 0755); err != nil {
			return nil, err
		}
		return &filesystemservicev1.CopyResponse{}, nil
	}

	// File copy
	srcFile, err := os.Open(srcPath)
	if err != nil {
		return nil, err
	}
	defer srcFile.Close()

	flag := os.O_WRONLY | os.O_CREATE | os.O_TRUNC
	if req.Overwrite != nil && !*req.Overwrite { // Check if Overwrite is explicitly false
		flag = os.O_WRONLY | os.O_CREATE | os.O_EXCL
	}

	destFile, err := os.OpenFile(destPath, flag, 0644)
	if err != nil {
		return nil, err
	}
	defer destFile.Close()

	if _, err := io.Copy(destFile, srcFile); err != nil {
		return nil, err
	}

	return &filesystemservicev1.CopyResponse{}, nil
}

func (s *NativeFileSystemService) Remove(ctx context.Context, req *filesystemservicev1.RemoveRequest) (*filesystemservicev1.RemoveResponse, error) {
	fullPath := s.resolvePath(req.Path)
	if req.Recursive != nil && *req.Recursive {
		if err := os.RemoveAll(fullPath); err != nil && (req.Force == nil || !*req.Force) {
			return nil, err
		}
	} else {
		if err := os.Remove(fullPath); err != nil && (req.Force == nil || !*req.Force) {
			return nil, err
		}
	}
	return &filesystemservicev1.RemoveResponse{}, nil
}
