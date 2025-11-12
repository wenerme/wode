package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// FileKind enum for file types
type FileKind string

const (
	FileKindDirectory FileKind = "directory"
	FileKindFile      FileKind = "file"
)

// FileNodeMeta - Main file system node model (equivalent to FileNodeMetaEntity in createDatabaseFileSystem.ts)
type FileNodeMeta struct {
	BaseModel

	// File identification
	Filename string `gorm:"type:varchar(255);not null;comment:文件名" json:"filename"`
	Size     int64  `gorm:"type:bigint;not null;default:0;comment:文件大小" json:"size"`
	Kind     string `gorm:"type:varchar(20);not null;comment:文件类型" json:"kind"` // directory, file

	// Timestamps
	ATime time.Time `gorm:"type:datetime;not null;default:CURRENT_TIMESTAMP;comment:访问时间" json:"atime"`
	BTime time.Time `gorm:"type:datetime;not null;default:CURRENT_TIMESTAMP;comment:创建时间" json:"btime"`
	CTime time.Time `gorm:"type:datetime;not null;default:CURRENT_TIMESTAMP;comment:状态改变时间" json:"ctime"`
	MTime time.Time `gorm:"type:datetime;not null;default:CURRENT_TIMESTAMP;comment:修改时间" json:"mtime"`

	// Metadata
	Metadata datatypes.JSON `gorm:"type:json;not null;default:'{}';comment:元数据" json:"metadata"`

	// Hierarchy relationships
	ParentID *string        `gorm:"type:char(36);index" json:"parentId"`
	Parent   *FileNodeMeta  `gorm:"foreignKey:ParentID;references:ID" json:"parent"`
	Children []FileNodeMeta `gorm:"foreignKey:ParentID;references:ID" json:"children"`

	// File content relationship
	FileContent *FileNodeContent `gorm:"foreignKey:NodeID;references:ID;constraint:OnDelete:CASCADE" json:"fileContent"`

	// Small file content (for files < 64KB)
	Content []byte `gorm:"type:longblob;comment:文件内容" json:"content,omitempty"`
}

// TableName specifies the table name
func (FileNodeMeta) TableName() string {
	return "file_node_meta"
}

// BeforeCreate hook to initialize Metadata
func (f *FileNodeMeta) BeforeCreate(tx *gorm.DB) error {
	// Call BaseModel's BeforeCreate first
	if err := f.BaseModel.BeforeCreate(tx); err != nil {
		return err
	}
	// Initialize Metadata if empty
	if len(f.Metadata) == 0 {
		f.Metadata = []byte("{}")
	}
	return nil
}
