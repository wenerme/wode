package svcs

import (
	"context"
	"encoding/base64"
	"fmt"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/wenerme/wode/wogo/models"
	filesystemservicev1 "github.com/wenerme/wode/wogo/proto/wode/fs/v1"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupFileSystemTestDB(t *testing.T) *gorm.DB {
	// Use unique in-memory SQLite for each test
	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("failed to connect to database: %v", err)
	}

	// Initialize schema
	if err := db.AutoMigrate(&models.FileNodeMeta{}, &models.FileNodeContent{}); err != nil {
		t.Fatalf("failed to init db: %v", err)
	}

	return db
}

func TestFileSystemService_EnsureRootNode(t *testing.T) {
	db := setupFileSystemTestDB(t)
	svc := NewGormFileSystemService(FileSystemServiceParams{DB: db})

	// First call should create root
	root, err := svc.EnsureRootNode()
	if err != nil {
		t.Fatalf("EnsureRootNode failed: %v", err)
	}
	if root.Filename != "/" {
		t.Errorf("expected root filename '/', got '%s'", root.Filename)
	}
	if root.ParentID != nil {
		t.Error("expected root parentID to be nil")
	}

	// Second call should return existing root
	root2, err := svc.EnsureRootNode()
	if err != nil {
		t.Fatalf("EnsureRootNode failed second time: %v", err)
	}
	if root.ID != root2.ID {
		t.Error("expected same root node ID")
	}
}

func TestFileSystemService_Mkdir(t *testing.T) {
	db := setupFileSystemTestDB(t)
	svc := NewGormFileSystemService(FileSystemServiceParams{DB: db})
	ctx := context.Background()

	// Ensure root exists
	if _, err := svc.EnsureRootNode(); err != nil {
		t.Fatal(err)
	}

	// Create directory
	req := &filesystemservicev1.MkdirRequest{
		Path: "/test_dir",
	}
	if _, err := svc.Mkdir(ctx, req); err != nil {
		t.Fatalf("Mkdir failed: %v", err)
	}

	// Verify existence
	existsReq := &filesystemservicev1.ExistsRequest{Path: "/test_dir"}
	existsResp, err := svc.Exists(ctx, existsReq)
	if err != nil {
		t.Fatalf("Exists failed: %v", err)
	}
	if !existsResp.Data {
		t.Error("expected directory to exist")
	}

	// Create nested directory (recursive)
	reqRecursive := &filesystemservicev1.MkdirRequest{
		Path:      "/a/b/c",
		Recursive: ptr(true),
	}
	if _, err := svc.Mkdir(ctx, reqRecursive); err != nil {
		t.Fatalf("Mkdir recursive failed: %v", err)
	}

	// Verify nested existence
	existsReqNested := &filesystemservicev1.ExistsRequest{Path: "/a/b/c"}
	existsRespNested, err := svc.Exists(ctx, existsReqNested)
	if err != nil {
		t.Fatalf("Exists nested failed: %v", err)
	}
	if !existsRespNested.Data {
		t.Error("expected nested directory to exist")
	}
}

func TestFileSystemService_WriteReadFile(t *testing.T) {
	db := setupFileSystemTestDB(t)
	svc := NewGormFileSystemService(FileSystemServiceParams{DB: db})
	ctx := context.Background()
	svc.EnsureRootNode()

	content := []byte("hello world")
	encoded := base64.StdEncoding.EncodeToString(content)

	// Write file
	writeReq := &filesystemservicev1.WriteFileRequest{
		Path:   "/test.txt",
		Base64: encoded,
	}
	if _, err := svc.WriteFile(ctx, writeReq); err != nil {
		t.Fatalf("WriteFile failed: %v", err)
	}

	// Read file
	readReq := &filesystemservicev1.ReadFileRequest{Path: "/test.txt"}
	readResp, err := svc.ReadFile(ctx, readReq)
	if err != nil {
		t.Fatalf("ReadFile failed: %v", err)
	}
	if readResp.Base64 != encoded {
		t.Errorf("expected content '%s', got '%s'", encoded, readResp.Base64)
	}

	// Get raw content
	rawContent, meta, err := svc.GetFileContent(ctx, "/test.txt")
	if err != nil {
		t.Fatalf("GetFileContent failed: %v", err)
	}
	if string(rawContent) != string(content) {
		t.Errorf("expected raw content '%s', got '%s'", content, rawContent)
	}
	if meta.Filename != "test.txt" {
		t.Errorf("expected filename 'test.txt', got '%s'", meta.Filename)
	}
}

func TestFileSystemService_LargeFile(t *testing.T) {
	db := setupFileSystemTestDB(t)
	svc := NewGormFileSystemService(FileSystemServiceParams{DB: db})
	ctx := context.Background()
	svc.EnsureRootNode()

	// Create large content (> 64KB)
	size := 70 * 1024
	content := make([]byte, size)
	for i := 0; i < size; i++ {
		content[i] = byte(i % 256)
	}
	encoded := base64.StdEncoding.EncodeToString(content)

	// Write large file
	writeReq := &filesystemservicev1.WriteFileRequest{
		Path:   "/large.bin",
		Base64: encoded,
	}
	if _, err := svc.WriteFile(ctx, writeReq); err != nil {
		t.Fatalf("WriteFile large failed: %v", err)
	}

	// Verify storage location
	var node models.FileNodeMeta
	if err := db.Where("filename = ?", "large.bin").First(&node).Error; err != nil {
		t.Fatal(err)
	}
	if len(node.Content) != 0 {
		t.Error("expected node content to be empty for large file")
	}

	var contentNode models.FileNodeContent
	if err := db.Where("node_id = ?", node.ID).First(&contentNode).Error; err != nil {
		t.Fatalf("failed to find content node: %v", err)
	}
	if len(contentNode.Content) != size {
		t.Errorf("expected content size %d, got %d", size, len(contentNode.Content))
	}

	// Read back
	rawContent, _, err := svc.GetFileContent(ctx, "/large.bin")
	if err != nil {
		t.Fatalf("GetFileContent failed: %v", err)
	}
	if len(rawContent) != size {
		t.Errorf("expected read size %d, got %d", size, len(rawContent))
	}
}

func TestFileSystemService_Readdir(t *testing.T) {
	db := setupFileSystemTestDB(t)
	svc := NewGormFileSystemService(FileSystemServiceParams{DB: db})
	ctx := context.Background()
	svc.EnsureRootNode()

	svc.Mkdir(ctx, &filesystemservicev1.MkdirRequest{Path: "/dir1"})
	svc.Mkdir(ctx, &filesystemservicev1.MkdirRequest{Path: "/dir2"})
	svc.WriteFile(ctx, &filesystemservicev1.WriteFileRequest{Path: "/file1.txt", Base64: "AA=="})

	resp, err := svc.Readdir(ctx, &filesystemservicev1.ReaddirRequest{Dir: "/"})
	if err != nil {
		t.Fatalf("Readdir failed: %v", err)
	}

	if len(resp.Data) != 3 {
		t.Errorf("expected 3 items, got %d", len(resp.Data))
	}
}

func TestFileSystemService_Remove(t *testing.T) {
	db := setupFileSystemTestDB(t)
	svc := NewGormFileSystemService(FileSystemServiceParams{DB: db})
	ctx := context.Background()
	svc.EnsureRootNode()

	svc.Mkdir(ctx, &filesystemservicev1.MkdirRequest{Path: "/dir1"})
	svc.WriteFile(ctx, &filesystemservicev1.WriteFileRequest{Path: "/dir1/file1.txt", Base64: "AA=="})

	// Try remove non-empty dir without recursive
	if _, err := svc.Remove(ctx, &filesystemservicev1.RemoveRequest{Path: "/dir1"}); err == nil {
		t.Error("expected error removing non-empty directory")
	}

	// Remove recursive
	if _, err := svc.Remove(ctx, &filesystemservicev1.RemoveRequest{Path: "/dir1", Recursive: ptr(true)}); err != nil {
		t.Fatalf("Remove recursive failed: %v", err)
	}

	// Verify gone
	if exists, _ := svc.Exists(ctx, &filesystemservicev1.ExistsRequest{Path: "/dir1"}); exists.Data {
		t.Error("expected /dir1 to be gone")
	}
}
