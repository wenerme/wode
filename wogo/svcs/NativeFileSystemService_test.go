package svcs

import (
	"context"
	"encoding/base64"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	filesystemservicev1 "github.com/wenerme/wode/wogo/proto/wode/fs/v1"
)

func TestNativeFileSystemService(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "native_fs_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tmpDir)

	svc := NewNativeFileSystemService(tmpDir)
	ctx := context.Background()

	t.Run("Mkdir", func(t *testing.T) {
		path := "/testdir" // Relative to root
		_, err := svc.Mkdir(ctx, &filesystemservicev1.MkdirRequest{Path: path})
		assert.NoError(t, err)

		info, err := os.Stat(filepath.Join(tmpDir, "testdir"))
		assert.NoError(t, err)
		assert.True(t, info.IsDir())
	})

	t.Run("WriteFile and ReadFile", func(t *testing.T) {
		path := "/test.txt"
		content := "hello world"
		b64 := base64.StdEncoding.EncodeToString([]byte(content))

		_, err := svc.WriteFile(ctx, &filesystemservicev1.WriteFileRequest{
			Path:   path,
			Base64: b64,
		})
		assert.NoError(t, err)

		// Read as base64
		resp, err := svc.ReadFile(ctx, &filesystemservicev1.ReadFileRequest{Path: path})
		assert.NoError(t, err)
		assert.Equal(t, b64, resp.Base64)

		// Read as binary
		respBin, err := svc.ReadFile(ctx, &filesystemservicev1.ReadFileRequest{
			Path:     path,
			Encoding: "binary",
		})
		assert.NoError(t, err)
		assert.Equal(t, []byte(content), respBin.Content)
	})

	t.Run("Readdir", func(t *testing.T) {
		resp, err := svc.Readdir(ctx, &filesystemservicev1.ReaddirRequest{Dir: "/"})
		assert.NoError(t, err)
		assert.NotEmpty(t, resp.Data)
	})

	t.Run("Exists", func(t *testing.T) {
		path := "/test.txt"
		resp, err := svc.Exists(ctx, &filesystemservicev1.ExistsRequest{Path: path})
		assert.NoError(t, err)
		assert.True(t, resp.Data)

		resp, err = svc.Exists(ctx, &filesystemservicev1.ExistsRequest{Path: "/nonexistent"})
		assert.NoError(t, err)
		assert.False(t, resp.Data)
	})

	t.Run("Rename", func(t *testing.T) {
		oldPath := "/test.txt"
		newPath := "/renamed.txt"

		_, err := svc.Rename(ctx, &filesystemservicev1.RenameRequest{
			OldPath: oldPath,
			NewPath: newPath,
		})
		assert.NoError(t, err)

		_, err = os.Stat(filepath.Join(tmpDir, "test.txt"))
		assert.True(t, os.IsNotExist(err))
		_, err = os.Stat(filepath.Join(tmpDir, "renamed.txt"))
		assert.NoError(t, err)
	})

	t.Run("Remove", func(t *testing.T) {
		path := "/renamed.txt"
		_, err := svc.Remove(ctx, &filesystemservicev1.RemoveRequest{Path: path})
		assert.NoError(t, err)

		_, err = os.Stat(filepath.Join(tmpDir, "renamed.txt"))
		assert.True(t, os.IsNotExist(err))

		// Create a directory with content for recursive removal
		_ = os.MkdirAll(filepath.Join(tmpDir, "dir1/subdir"), 0755)
		_ = os.WriteFile(filepath.Join(tmpDir, "dir1/file1.txt"), []byte("content"), 0644)

		// Remove recursive
		_, err = svc.Remove(ctx, &filesystemservicev1.RemoveRequest{Path: "/dir1", Recursive: ptr(true)})
		assert.NoError(t, err)

		_, err = os.Stat(filepath.Join(tmpDir, "dir1"))
		assert.True(t, os.IsNotExist(err))
	})
}
