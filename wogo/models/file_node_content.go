package models

import (
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// FileNodeContent - Large file content model (equivalent to FileNodeContentEntity in createDatabaseFileSystem.ts)
type FileNodeContent struct {
	BaseModel

	// Reference to the file node
	NodeID string        `gorm:"type:char(36);not null;primaryKey;comment:文件节点ID" json:"nodeId"`
	Node   *FileNodeMeta `gorm:"foreignKey:NodeID;references:ID;constraint:OnDelete:CASCADE" json:"node"`

	// Content information
	Size int64 `gorm:"type:bigint;not null;comment:文件大小" json:"size"`

	// File content (lazy loaded)
	Content []byte `gorm:"type:longblob;comment:文件内容" json:"content,omitempty"`

	// File properties
	MimeType *string `gorm:"type:varchar(100);comment:MIME类型" json:"mimeType"`

	// Checksums
	MD5    *string `gorm:"type:char(32);comment:MD5哈希" json:"md5"`
	SHA256 *string `gorm:"type:char(64);comment:SHA256哈希" json:"sha256"`

	// Content metadata
	Text   *string `gorm:"type:text;comment:文本内容" json:"text"`
	Width  *int    `gorm:"type:int;comment:宽度" json:"width"`
	Height *int    `gorm:"type:int;comment:高度" json:"height"`

	// Additional metadata
	Metadata datatypes.JSON `gorm:"type:json;not null;default:'{}';comment:内容元数据" json:"metadata"`
}

// TableName specifies the table name
func (FileNodeContent) TableName() string {
	return "file_node_content"
}

// BeforeCreate hook to initialize Metadata
func (f *FileNodeContent) BeforeCreate(tx *gorm.DB) error {
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
