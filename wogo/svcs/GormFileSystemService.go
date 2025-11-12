package svcs

import (
	"context"
	"encoding/base64"
	"errors"
	"path/filepath"
	"strings"
	"time"

	"github.com/wenerme/wode/wogo/models"
	filesystemservicev1 "github.com/wenerme/wode/wogo/proto/wode/fs/v1"
	"github.com/wenerme/wode/wogo/proto/wode/fs/v1/filesystemservicev1connect"
	"go.uber.org/dig"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

func ptr[T any](v T) *T {
	return &v
}

func convertMapToStringMap(data datatypes.JSON) *structpb.Struct {
	if len(data) == 0 {
		return nil
	}
	// TODO: implement proper conversion if needed, for now return empty or nil
	return nil
}

var _ filesystemservicev1connect.FileSystemServiceHandler = &GormFileSystemService{}

// GormFileSystemService handles file system operations using FileNodeMeta and FileNodeContent
type GormFileSystemService struct {
	DB *gorm.DB `name:"DataDB"` // Data database connection
}

// FileSystemServiceParams defines the dependencies for GormFileSystemService
type FileSystemServiceParams struct {
	dig.In
	DB *gorm.DB `name:"DataDB"`
}

// NewGormFileSystemService creates a new GormFileSystemService instance
func NewGormFileSystemService(params FileSystemServiceParams) *GormFileSystemService {
	return &GormFileSystemService{DB: params.DB}
}

// EnsureRootNode ensures that the root node exists
func (s *GormFileSystemService) EnsureRootNode() (*models.FileNodeMeta, error) {
	var root models.FileNodeMeta
	if err := s.DB.Where("parent_id IS NULL").First(&root).Error; err == nil {
		return &root, nil
	}

	// Create root directory
	rootNode := models.FileNodeMeta{
		Filename: "/",
		Kind:     string(models.FileKindDirectory),
		Size:     0,
		MTime:    time.Now(),
		ATime:    time.Now(),
		BTime:    time.Now(),
		CTime:    time.Now(),
		ParentID: nil,
	}

	if err := s.DB.Create(&rootNode).Error; err != nil {
		// Check if it was created concurrently
		if err := s.DB.Where("parent_id IS NULL").First(&root).Error; err == nil {
			return &root, nil
		}
		return nil, err
	}

	return &rootNode, nil
}

// normalizePath normalizes a path (removes trailing slashes, handles root)
func normalizePath(path string) string {
	path = filepath.Clean(path)
	if path == "." || path == "" {
		return "/"
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return path
}

// splitPath splits a path into parts, filtering empty parts
func splitPath(path string) []string {
	normalized := normalizePath(path)
	if normalized == "/" {
		return []string{}
	}
	parts := strings.Split(normalized, "/")
	result := []string{}
	for _, part := range parts {
		if part != "" {
			result = append(result, part)
		}
	}
	return result
}

// getNodeByPath finds a node by its path
func (s *GormFileSystemService) getNodeByPath(path string) (*models.FileNodeMeta, error) {
	normalized := normalizePath(path)
	if normalized == "/" {
		// Root node has parent_id = null
		var root models.FileNodeMeta
		if err := s.DB.Where("parent_id IS NULL").First(&root).Error; err != nil {
			return nil, err
		}
		return &root, nil
	}

	parts := splitPath(path)
	if len(parts) == 0 {
		return nil, errors.New("invalid path")
	}

	// Start from root
	var currentNode models.FileNodeMeta
	if err := s.DB.Where("parent_id IS NULL").First(&currentNode).Error; err != nil {
		return nil, err
	}

	// Traverse path parts
	for _, part := range parts {
		var child models.FileNodeMeta
		if err := s.DB.Where("parent_id = ? AND filename = ?", currentNode.ID, part).First(&child).Error; err != nil {
			return nil, err
		}
		currentNode = child
	}

	return &currentNode, nil
}

// buildPath builds the full path string from a node by traversing up to root
func (s *GormFileSystemService) buildPath(node *models.FileNodeMeta) (string, error) {
	if node.ParentID == nil {
		return "/", nil
	}

	parts := []string{node.Filename}
	currentID := node.ParentID

	for currentID != nil {
		var parent models.FileNodeMeta
		if err := s.DB.Where("id = ?", *currentID).First(&parent).Error; err != nil {
			return "", err
		}
		parts = append([]string{parent.Filename}, parts...)
		currentID = parent.ParentID
	}

	return "/" + strings.Join(parts, "/"), nil
}

// convertToFileStat converts FileNodeMeta to protobuf FileStat
func (s *GormFileSystemService) convertToFileStat(node *models.FileNodeMeta, path string) (*filesystemservicev1.FileStat, error) {
	// Build directory path
	dir := filepath.Dir(path)
	if dir == "." {
		dir = "/"
	}

	// Convert metadata
	meta := convertMapToStringMap(node.Metadata)

	fileStat := &filesystemservicev1.FileStat{
		Directory: dir,
		Path:      path,
		Name:      node.Filename,
		Kind:      filesystemservicev1.FileKind(filesystemservicev1.FileKind_value["FILE_KIND_"+strings.ToUpper(node.Kind)]),
		Mtime:     timestamppb.New(node.MTime),
		Size:      node.Size,
		Meta:      meta,
	}

	return fileStat, nil
}

// Readdir lists directory contents
func (s *GormFileSystemService) Readdir(ctx context.Context, req *filesystemservicev1.ReaddirRequest) (*filesystemservicev1.ReaddirResponse, error) {
	// Find parent directory node
	parentNode, err := s.getNodeByPath(req.Dir)
	if err != nil {
		return nil, errors.New("directory not found")
	}

	if parentNode.Kind != string(models.FileKindDirectory) {
		return nil, errors.New("path is not a directory")
	}

	// Get children
	var children []models.FileNodeMeta
	query := s.DB.Where("parent_id = ?", parentNode.ID)

	// Apply filters
	if req.Kind != nil && *req.Kind != filesystemservicev1.FileKind_FILE_KIND_UNSPECIFIED {
		// Map enum to string
		kindStr := "file"
		if *req.Kind == filesystemservicev1.FileKind_FILE_KIND_DIRECTORY {
			kindStr = "directory"
		}
		query = query.Where("kind = ?", kindStr)
	}

	if err := query.Find(&children).Error; err != nil {
		return nil, err
	}

	// Convert to FileStat
	var fileStats []*filesystemservicev1.FileStat
	for _, child := range children {
		// Build child path
		childPath, err := s.buildPath(&child)
		if err != nil {
			continue
		}

		fileStat, err := s.convertToFileStat(&child, childPath)
		if err != nil {
			continue
		}

		fileStats = append(fileStats, fileStat)
	}

	return &filesystemservicev1.ReaddirResponse{Data: fileStats}, nil
}

// Stat gets file or directory status
func (s *GormFileSystemService) Stat(ctx context.Context, req *filesystemservicev1.StatRequest) (*filesystemservicev1.StatResponse, error) {
	node, err := s.getNodeByPath(req.Path)
	if err != nil {
		return nil, errors.New("file or directory not found")
	}

	fileStat, err := s.convertToFileStat(node, req.Path)
	if err != nil {
		return nil, err
	}

	return &filesystemservicev1.StatResponse{Data: fileStat}, nil
}

// Mkdir creates a directory
func (s *GormFileSystemService) Mkdir(ctx context.Context, req *filesystemservicev1.MkdirRequest) (*filesystemservicev1.MkdirResponse, error) {
	normalized := normalizePath(req.Path)
	if normalized == "/" {
		// Check if root already exists
		var root models.FileNodeMeta
		if err := s.DB.Where("parent_id IS NULL").First(&root).Error; err == nil {
			return &filesystemservicev1.MkdirResponse{}, nil // Root already exists
		}
		// Create root node
		rootNode := models.FileNodeMeta{
			Filename: "/",
			Kind:     string(models.FileKindDirectory),
			Size:     0,
			MTime:    time.Now(),
			ATime:    time.Now(),
			BTime:    time.Now(),
			CTime:    time.Now(),
			ParentID: nil,
		}
		if err := s.DB.Create(&rootNode).Error; err != nil {
			return nil, err
		}
		return &filesystemservicev1.MkdirResponse{}, nil
	}

	parentPath := filepath.Dir(normalized)
	dirName := filepath.Base(normalized)

	// Find or create parent node
	var parentNode *models.FileNodeMeta
	parentNode, err := s.getNodeByPath(parentPath)
	if err != nil {
		if req.Recursive != nil && *req.Recursive {
			// Recursively create parent directories
			parentReq := &filesystemservicev1.MkdirRequest{
				Path:      parentPath,
				Recursive: ptr(true),
			}
			if _, err := s.Mkdir(ctx, parentReq); err != nil {
				return nil, err
			}
			// Re-query parent node
			parentNode, err = s.getNodeByPath(parentPath)
			if err != nil {
				return nil, err
			}
		} else {
			return nil, errors.New("parent directory not found")
		}
	}

	// Check if directory already exists
	var existingNode models.FileNodeMeta
	if err := s.DB.Where("parent_id = ? AND filename = ?", parentNode.ID, dirName).First(&existingNode).Error; err == nil {
		if existingNode.Kind == string(models.FileKindDirectory) {
			return &filesystemservicev1.MkdirResponse{}, nil // Directory already exists
		}
		return nil, errors.New("file with same name exists")
	}

	// Create directory node
	dirNode := models.FileNodeMeta{
		Filename: dirName,
		Kind:     string(models.FileKindDirectory),
		Size:     0,
		MTime:    time.Now(),
		ATime:    time.Now(),
		BTime:    time.Now(),
		CTime:    time.Now(),
		ParentID: &parentNode.ID,
	}

	if err := s.DB.Create(&dirNode).Error; err != nil {
		return nil, err
	}

	return &filesystemservicev1.MkdirResponse{}, nil
}

// ReadFile reads a file
func (s *GormFileSystemService) ReadFile(ctx context.Context, req *filesystemservicev1.ReadFileRequest) (*filesystemservicev1.ReadFileResponse, error) {
	content, _, err := s.GetFileContent(ctx, req.Path)
	if err != nil {
		return nil, err
	}

	resp := &filesystemservicev1.ReadFileResponse{}
	if req.Encoding == "binary" {
		resp.Content = content
	} else {
		// Default to base64
		resp.Base64 = base64.StdEncoding.EncodeToString(content)
	}

	return resp, nil
}

// WriteFile writes a file
func (s *GormFileSystemService) WriteFile(ctx context.Context, req *filesystemservicev1.WriteFileRequest) (*filesystemservicev1.WriteFileResponse, error) {
	content, err := base64.StdEncoding.DecodeString(req.Base64)
	if err != nil {
		return nil, errors.New("invalid base64 content")
	}

	normalized := normalizePath(req.Path)
	if normalized == "/" {
		return nil, errors.New("cannot write to root directory")
	}

	parentPath := filepath.Dir(normalized)
	fileName := filepath.Base(normalized)

	// Find or create parent directory
	parentNode, err := s.getNodeByPath(parentPath)
	if err != nil {
		// Create parent directory recursively
		parentReq := &filesystemservicev1.MkdirRequest{
			Path:      parentPath,
			Recursive: ptr(true),
		}
		if _, err := s.Mkdir(ctx, parentReq); err != nil {
			return nil, err
		}
		parentNode, err = s.getNodeByPath(parentPath)
		if err != nil {
			return nil, err
		}
	}

	// Check if file exists
	var existingNode models.FileNodeMeta
	err = s.DB.Where("parent_id = ? AND filename = ?", parentNode.ID, fileName).First(&existingNode).Error
	if err == nil {
		// File exists
		if req.Overwrite == nil || !*req.Overwrite {
			return nil, errors.New("file already exists")
		}

		// Update existing file
		existingNode.Size = int64(len(content))
		existingNode.MTime = time.Now()
		existingNode.ATime = time.Now()

		if len(content) <= 64*1024 {
			// Small file - store in node
			existingNode.Content = content
			// Delete FileNodeContent if exists
			s.DB.Where("node_id = ?", existingNode.ID).Delete(&models.FileNodeContent{})
		} else {
			// Large file - store in FileNodeContent
			existingNode.Content = nil
			var contentNode models.FileNodeContent
			if err := s.DB.Where("node_id = ?", existingNode.ID).First(&contentNode).Error; err != nil {
				// Create new content node
				contentNode = models.FileNodeContent{
					NodeID:  existingNode.ID,
					Size:    int64(len(content)),
					Content: content,
				}
				if err := s.DB.Create(&contentNode).Error; err != nil {
					return nil, err
				}
			} else {
				// Update existing content node
				contentNode.Size = int64(len(content))
				contentNode.Content = content
				if err := s.DB.Save(&contentNode).Error; err != nil {
					return nil, err
				}
			}
		}

		if err := s.DB.Save(&existingNode).Error; err != nil {
			return nil, err
		}

		return &filesystemservicev1.WriteFileResponse{}, nil
	}

	// Create new file
	fileNode := models.FileNodeMeta{
		Filename: fileName,
		Kind:     string(models.FileKindFile),
		Size:     int64(len(content)),
		MTime:    time.Now(),
		ATime:    time.Now(),
		BTime:    time.Now(),
		CTime:    time.Now(),
		ParentID: &parentNode.ID,
	}

	if len(content) <= 64*1024 {
		// Small file - store content directly
		fileNode.Content = content
	} else {
		// Large file - create separate content node
		fileNode.Content = nil
	}

	if err := s.DB.Create(&fileNode).Error; err != nil {
		return nil, err
	}

	if len(content) > 64*1024 {
		// Create content node for large file
		contentNode := models.FileNodeContent{
			NodeID:  fileNode.ID,
			Size:    int64(len(content)),
			Content: content,
		}
		if err := s.DB.Create(&contentNode).Error; err != nil {
			return nil, err
		}
	}

	return &filesystemservicev1.WriteFileResponse{}, nil
}

// Rename renames a file or directory
func (s *GormFileSystemService) Rename(ctx context.Context, req *filesystemservicev1.RenameRequest) (*filesystemservicev1.RenameResponse, error) {
	oldNormalized := normalizePath(req.OldPath)
	newNormalized := normalizePath(req.NewPath)

	if oldNormalized == "/" {
		return nil, errors.New("cannot rename root directory")
	}

	// Find source node
	srcNode, err := s.getNodeByPath(oldNormalized)
	if err != nil {
		return nil, errors.New("source file or directory not found")
	}

	// Check if destination exists
	newParentPath := filepath.Dir(newNormalized)
	newFileName := filepath.Base(newNormalized)

	var newParentNode *models.FileNodeMeta
	newParentNode, err = s.getNodeByPath(newParentPath)
	if err != nil {
		return nil, errors.New("destination parent directory not found")
	}

	// Check if destination already exists
	var existingNode models.FileNodeMeta
	err = s.DB.Where("parent_id = ? AND filename = ?", newParentNode.ID, newFileName).First(&existingNode).Error
	if err == nil {
		if req.Overwrite == nil || !*req.Overwrite {
			return nil, errors.New("destination already exists")
		}
		// Delete existing node (cascade will handle content)
		if err := s.DB.Delete(&existingNode).Error; err != nil {
			return nil, err
		}
	}

	// Update node
	srcNode.Filename = newFileName
	srcNode.ParentID = &newParentNode.ID
	srcNode.MTime = time.Now()

	if err := s.DB.Save(srcNode).Error; err != nil {
		return nil, err
	}

	return &filesystemservicev1.RenameResponse{}, nil
}

// Exists checks if a file or directory exists
func (s *GormFileSystemService) Exists(ctx context.Context, req *filesystemservicev1.ExistsRequest) (*filesystemservicev1.ExistsResponse, error) {
	_, err := s.getNodeByPath(req.Path)
	exists := err == nil
	return &filesystemservicev1.ExistsResponse{Data: exists}, nil
}

// Copy copies a file or directory
func (s *GormFileSystemService) Copy(ctx context.Context, req *filesystemservicev1.CopyRequest) (*filesystemservicev1.CopyResponse, error) {
	srcNormalized := normalizePath(req.Src)
	destNormalized := normalizePath(req.Dest)

	// Find source node
	srcNode, err := s.getNodeByPath(srcNormalized)
	if err != nil {
		return nil, errors.New("source file or directory not found")
	}

	if srcNode.Kind == string(models.FileKindDirectory) {
		// For directories, we need recursive copy (simplified: just create directory)
		if req.Shallow == nil || !*req.Shallow {
			return nil, errors.New("recursive directory copy not implemented")
		}
		// Create destination directory
		mkdirReq := &filesystemservicev1.MkdirRequest{
			Path:      destNormalized,
			Recursive: ptr(true),
		}
		_, err = s.Mkdir(ctx, mkdirReq)
		return &filesystemservicev1.CopyResponse{}, err
	}

	// For files, read and write
	readReq := &filesystemservicev1.ReadFileRequest{Path: srcNormalized}
	readResp, err := s.ReadFile(ctx, readReq)
	if err != nil {
		return nil, err
	}

	writeReq := &filesystemservicev1.WriteFileRequest{
		Path:      destNormalized,
		Base64:    readResp.Base64,
		Overwrite: req.Overwrite,
	}
	_, err = s.WriteFile(ctx, writeReq)
	return &filesystemservicev1.CopyResponse{}, err
}

// Remove removes a file or directory
func (s *GormFileSystemService) Remove(ctx context.Context, req *filesystemservicev1.RemoveRequest) (*filesystemservicev1.RemoveResponse, error) {
	normalized := normalizePath(req.Path)

	if normalized == "/" {
		return nil, errors.New("cannot remove root directory")
	}

	node, err := s.getNodeByPath(normalized)
	if err != nil {
		if req.Force != nil && *req.Force {
			return &filesystemservicev1.RemoveResponse{}, nil // File doesn't exist, consider it removed
		}
		return nil, errors.New("file or directory not found")
	}

	if node.Kind == string(models.FileKindDirectory) {
		// Check if directory is empty
		var childCount int64
		s.DB.Model(&models.FileNodeMeta{}).Where("parent_id = ?", node.ID).Count(&childCount)
		if childCount > 0 && (req.Recursive == nil || !*req.Recursive) {
			return nil, errors.New("directory is not empty")
		}
		// If recursive, delete all children first
		if req.Recursive != nil && *req.Recursive && childCount > 0 {
			var children []models.FileNodeMeta
			if err := s.DB.Where("parent_id = ?", node.ID).Find(&children).Error; err != nil {
				return nil, err
			}
			for _, child := range children {
				childPath, err := s.buildPath(&child)
				if err != nil {
					continue
				}
				childReq := &filesystemservicev1.RemoveRequest{
					Path:      childPath,
					Recursive: ptr(true),
					Force:     req.Force,
				}
				if _, err := s.Remove(ctx, childReq); err != nil {
					return nil, err
				}
			}
		}
	}

	// Delete the node (cascade will handle content deletion)
	if err := s.DB.Delete(node).Error; err != nil {
		return nil, err
	}

	return &filesystemservicev1.RemoveResponse{}, nil
}

// GetFileContent retrieves the raw content of a file
func (s *GormFileSystemService) GetFileContent(ctx context.Context, path string) ([]byte, *models.FileNodeMeta, error) {
	node, err := s.getNodeByPath(path)
	if err != nil {
		return nil, nil, errors.New("file not found")
	}

	if node.Kind != string(models.FileKindFile) {
		return nil, nil, errors.New("path is not a file")
	}

	var content []byte
	if len(node.Content) > 0 {
		// Small file content stored in node
		content = node.Content
	} else {
		// Large file content stored in FileNodeContent
		var contentNode models.FileNodeContent
		if err := s.DB.Where("node_id = ?", node.ID).First(&contentNode).Error; err != nil {
			return nil, nil, errors.New("file content not found")
		}
		content = contentNode.Content
	}

	return content, node, nil
}
