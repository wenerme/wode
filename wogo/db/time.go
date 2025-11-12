package db

import (
	"database/sql"
	"database/sql/driver"
	"fmt"
	"time"
)

// DateTime is a time.Time wrapper that properly handles SQLite datetime strings
// for modernc.org/sqlite driver which returns datetime as strings
type DateTime struct {
	time.Time
}

// Scan implements sql.Scanner interface
// Handles various SQLite datetime string formats and Unix timestamps
func (dt *DateTime) Scan(value interface{}) error {
	if value == nil {
		dt.Time = time.Time{}
		return nil
	}

	switch v := value.(type) {
	case time.Time:
		dt.Time = v
		return nil
	case int64:
		// Unix timestamp in seconds
		dt.Time = time.Unix(v, 0).UTC()
		return nil
	case int:
		// Unix timestamp in seconds
		dt.Time = time.Unix(int64(v), 0).UTC()
		return nil
	case float64:
		// Unix timestamp with fractional seconds
		sec := int64(v)
		nsec := int64((v - float64(sec)) * 1e9)
		dt.Time = time.Unix(sec, nsec).UTC()
		return nil
	case string:
		t, err := parseTimeString(v)
		if err != nil {
			return fmt.Errorf("failed to parse datetime string %q: %w", v, err)
		}
		dt.Time = t
		return nil
	case []byte:
		t, err := parseTimeString(string(v))
		if err != nil {
			return fmt.Errorf("failed to parse datetime bytes %q: %w", v, err)
		}
		dt.Time = t
		return nil
	case sql.NullTime:
		if !v.Valid {
			dt.Time = time.Time{}
			return nil
		}
		dt.Time = v.Time
		return nil
	default:
		return fmt.Errorf("cannot scan %T into DateTime", value)
	}
}

// Value implements driver.Valuer interface
// Formats time.Time to SQLite-compatible datetime string
func (dt DateTime) Value() (driver.Value, error) {
	if dt.IsZero() {
		return nil, nil
	}
	// Use SQLite standard datetime format
	return dt.Format("2006-01-02 15:04:05"), nil
}

// parseTimeString attempts to parse a datetime string using multiple formats
// commonly used by SQLite, or as a Unix timestamp string
func parseTimeString(s string) (time.Time, error) {
	if s == "" {
		return time.Time{}, nil
	}

	// Check if string is a Unix timestamp (10+ digits, all numeric)
	// Unix timestamp: 10 digits for seconds, 13 for milliseconds, 16+ for microseconds/nanoseconds
	if len(s) >= 10 && isNumeric(s) {
		return parseUnixTimestampString(s)
	}

	// Try various SQLite datetime formats
	formats := []string{
		"2006-01-02 15:04:05.999999999",
		"2006-01-02 15:04:05.999999",
		"2006-01-02 15:04:05.999",
		"2006-01-02 15:04:05",
		"2006-01-02T15:04:05.999999999Z07:00",
		"2006-01-02T15:04:05.999999999Z",
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05",
		"2006-01-02",
	}

	var lastErr error
	for _, format := range formats {
		t, err := time.Parse(format, s)
		if err == nil {
			return t, nil
		}
		lastErr = err
	}

	return time.Time{}, fmt.Errorf("unable to parse datetime string %q: %w", s, lastErr)
}

// isNumeric checks if a string contains only digits (and optionally a decimal point)
func isNumeric(s string) bool {
	hasDecimal := false
	for i, r := range s {
		if r == '.' || r == ',' {
			if hasDecimal {
				return false // Multiple decimal points
			}
			hasDecimal = true
			continue
		}
		if r < '0' || r > '9' {
			// Allow leading minus sign for negative timestamps
			if i == 0 && r == '-' {
				continue
			}
			return false
		}
	}
	return true
}

// parseUnixTimestampString parses a Unix timestamp from a string
// Supports seconds (10 digits), milliseconds (13 digits), microseconds (16 digits), nanoseconds (19 digits)
func parseUnixTimestampString(s string) (time.Time, error) {
	// Replace comma with dot for European-style decimal separators
	s = replaceCommaWithDot(s)

	// Try parsing as float64 first (handles fractional seconds)
	if f, err := parseFloat(s); err == nil {
		// Determine the unit based on magnitude
		if f >= 1e18 {
			// Nanoseconds (19+ digits)
			return time.Unix(0, int64(f)).UTC(), nil
		} else if f >= 1e15 {
			// Microseconds (16-18 digits)
			sec := int64(f / 1e6)
			nsec := int64(f) - sec*1e6
			return time.Unix(sec, nsec*1e3).UTC(), nil
		} else if f >= 1e12 {
			// Milliseconds (13-15 digits)
			sec := int64(f / 1e3)
			nsec := (int64(f) - sec*1e3) * 1e6
			return time.Unix(sec, nsec).UTC(), nil
		} else {
			// Seconds (10-12 digits) with possible fractional part
			sec := int64(f)
			nsec := int64((f - float64(sec)) * 1e9)
			return time.Unix(sec, nsec).UTC(), nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse Unix timestamp string %q", s)
}

// replaceCommaWithDot replaces comma with dot for decimal separator
func replaceCommaWithDot(s string) string {
	result := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		if s[i] == ',' {
			result[i] = '.'
		} else {
			result[i] = s[i]
		}
	}
	return string(result)
}

// parseFloat parses a string to float64
func parseFloat(s string) (float64, error) {
	var result float64
	var decimal float64
	var isDecimal bool
	var isNegative bool
	decimalPlace := 0.1

	for i, r := range s {
		if r == '-' && i == 0 {
			isNegative = true
			continue
		}
		if r == '.' {
			isDecimal = true
			continue
		}
		if r < '0' || r > '9' {
			return 0, fmt.Errorf("invalid character %q", r)
		}

		digit := float64(r - '0')
		if isDecimal {
			decimal += digit * decimalPlace
			decimalPlace *= 0.1
		} else {
			result = result*10 + digit
		}
	}

	result += decimal
	if isNegative {
		result = -result
	}
	return result, nil
}

// NullDateTime is a nullable DateTime type
type NullDateTime struct {
	DateTime DateTime
	Valid    bool // Valid is true if DateTime is not NULL
}

// Scan implements sql.Scanner interface
func (ndt *NullDateTime) Scan(value interface{}) error {
	if value == nil {
		ndt.Valid = false
		ndt.DateTime = DateTime{}
		return nil
	}

	err := ndt.DateTime.Scan(value)
	if err != nil {
		ndt.Valid = false
		return err
	}

	ndt.Valid = true
	return nil
}

// Value implements driver.Valuer interface
func (ndt NullDateTime) Value() (driver.Value, error) {
	if !ndt.Valid {
		return nil, nil
	}
	return ndt.DateTime.Value()
}
