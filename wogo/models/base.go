package models

import (
	"github.com/google/uuid"
	"github.com/wenerme/wode/wogo/db"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// BaseModel defines common fields for all models
type BaseModel struct {
	ID  string  `gorm:"type:char(36);primaryKey" json:"id"`
	UID *string `gorm:"type:char(36);uniqueIndex" json:"uid"`
	TID *string `gorm:"type:char(36);index" json:"tid"`
	EID *string `gorm:"type:varchar(255);index" json:"eid"`

	// Timestamps
	CreatedAt db.DateTime        `gorm:"type:datetime;not null" json:"createdAt"`
	UpdatedAt db.DateTime        `gorm:"type:datetime;not null" json:"updatedAt"`
	DeletedAt datatypes.NullTime `gorm:"type:datetime;index" json:"deletedAt"`

	// Metadata
	Attributes datatypes.JSON `gorm:"type:json" json:"attributes"`
	Properties datatypes.JSON `gorm:"type:json" json:"properties"`
	Extensions datatypes.JSON `gorm:"type:json" json:"extensions"`
}

// BeforeCreate hook to generate UUID
func (b *BaseModel) BeforeCreate(tx *gorm.DB) error {
	if b.ID == "" {
		b.ID = uuid.New().String()
	}
	// Initialize JSON fields to empty JSON objects for SQLite compatibility
	if len(b.Attributes) == 0 {
		b.Attributes = []byte("{}")
	}
	if len(b.Properties) == 0 {
		b.Properties = []byte("{}")
	}
	if len(b.Extensions) == 0 {
		b.Extensions = []byte("{}")
	}
	return nil
}

// GetID returns the ID of the resource
func (b *BaseModel) GetID() string {
	return b.ID
}

// GetCreatedAt returns the creation timestamp
func (b *BaseModel) GetCreatedAt() interface{} {
	return b.CreatedAt
}

// GetUpdatedAt returns the update timestamp
func (b *BaseModel) GetUpdatedAt() interface{} {
	return b.UpdatedAt
}

type ResourceModel struct {
	CID *string `gorm:"type:varchar(255)" json:"cid"`
	RID *string `gorm:"type:varchar(255)" json:"rid"`

	// Audit fields
	CreatedByID *string `gorm:"type:char(36)" json:"createdById"`
	UpdatedByID *string `gorm:"type:char(36)" json:"updatedById"`
	DeletedByID *string `gorm:"type:char(36)" json:"deletedById"`

	// Status fields
	State             *string            `gorm:"type:varchar(50)" json:"state"`
	Status            *string            `gorm:"type:varchar(50)" json:"status"`
	StatusReason      *string            `gorm:"type:text" json:"statusReason"`
	StatusUpdatedAt   datatypes.NullTime `gorm:"type:datetime" json:"statusUpdatedAt"`
	StatusUpdatedByID *string            `gorm:"type:char(36)" json:"statusUpdatedById"`
}
