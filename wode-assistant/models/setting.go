package models

import (
	"encoding/json"
	"errors"
	"log/slog"
	"reflect"

	"github.com/wenerme/wode/wode-assitant/appx"

	"github.com/invopop/jsonschema"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type SettingModel struct {
	gorm.Model

	Key   string         `gorm:"unique"`
	Value datatypes.JSON `gorm:"type:json"`

	Title       string
	Description string
}

type DefineSettingOption[T any] struct {
	Key          string
	Title        string
	Description  string
	InitialValue T
	Metadata     map[string]interface{}
}

type SettingSchema struct {
	Key         string                 `json:"key,omitempty"`
	Title       string                 `json:"title,omitempty"`
	Description string                 `json:"description,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	JsonSchema  *jsonschema.Schema     `json:"jsonSchema,omitempty"`
	def         jsonValue
}

var _allSettingDefs []*SettingSchema

func GetAllSettingSchema() []*SettingSchema {
	return _allSettingDefs
}

type SettingDef[T any] interface {
	Set(v T) error
	Get() (T, error)

	GetJson() (any, error)
	SetJson(any) error
}

type jsonValue interface {
	GetJson() (any, error)
	SetJson(any) error
}

func DefineSetting[T any](o DefineSettingOption[T]) SettingDef[T] {
	if o.Key == "" {
		// use type name as Key
		o.Key = reflect.TypeFor[T]().Name()
	}

	def := &settingDef[T]{
		opts: &o,
	}
	schema := &SettingSchema{
		Key:         o.Key,
		Title:       o.Title,
		Description: o.Description,
		Metadata:    o.Metadata,
		def:         def,
		JsonSchema:  jsonschema.Reflect(&o.InitialValue),
	}

	def.schema = schema

	_allSettingDefs = append(_allSettingDefs, schema)
	return def
}

type settingDef[T any] struct {
	opts   *DefineSettingOption[T]
	schema *SettingSchema
}

func (s *settingDef[T]) GetJson() (any, error) {
	m, err := s.get()
	if err != nil || m == nil {
		return nil, err
	}
	return m.Value, nil
}

func (s *settingDef[T]) SetJson(a any) error {
	val, err := json.Marshal(a)
	if err != nil {
		return err
	}
	err = appx.Context.SysDB.Clauses(clause.OnConflict{
		DoUpdates: clause.AssignmentColumns([]string{"value"}),
	}).Create(&SettingModel{
		Key:         s.opts.Key,
		Value:       val,
		Title:       s.opts.Title,
		Description: s.opts.Description,
	}).Error
	return err
}

func (s *settingDef[T]) Set(v T) error {
	return s.SetJson(v)
}

func (s *settingDef[T]) get() (m *SettingModel, err error) {
	err = appx.Context.SysDB.Find(&m, "key = ?", s.opts.Key).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	switch {
	case string(m.Value) == "{}":
		fallthrough
	case string(m.Value) == "null":
		fallthrough
	case len(m.Value) == 0:
		return nil, nil
	}
	return
}

func (s *settingDef[T]) Get() (out T, err error) {
	m, err := s.get()
	if err != nil || m == nil {
		return s.opts.InitialValue, err
	}

	err = json.Unmarshal(m.Value, &out)
	if err != nil {
		slog.Warn("failed to unmarshal setting value", "key", s.opts.Key, "value", m.Value, "err", err)
		return s.opts.InitialValue, nil
	}
	return
}
