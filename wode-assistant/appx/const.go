package appx

import (
	_ "embed"
	"encoding/json"
	"log"
	"runtime"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"gorm.io/gorm"
)

//go:embed icon-32.png
var Icon128 []byte

//go:embed icon-64.png
var Icon64 []byte

//go:embed icon-32.png
var Icon32 []byte

//go:embed icon-16.png
var Icon16 []byte

var SystrayLight = Icon64
var SystrayDark = Icon64

type _info struct {
	AppName        string
	ProductName    string
	ProductVersion string
	CompanyName    string
}

//go:embed info.json
var infoJson []byte

func init() {
	err := json.Unmarshal(infoJson, Info)
	if err != nil {
		log.Fatalf("failed to unmarshal info.json: %v", err)
	}
}

var Info = &_info{
	AppName:        "AppName",
	ProductName:    "ProductName",
	CompanyName:    "CompanyName",
	ProductVersion: "1.0.0",
}

type _context struct {
	App           *application.App
	MainWindow    application.Window
	WebviewWindow *application.WebviewWindow
	SystemTray    *application.SystemTray
	AppName       string
	HomeDir       string
	DataDir       string
	CacheDir      string
	LogDir        string
	Dev           bool
	SysDB         *gorm.DB
	ServicePort   int

	//DatabasePath     string
	//DatabaseName     string
	//DatabaseUsername string
	//DatabasePassword string

	//PocketBase    *pocketbase.PocketBase
}

var Context = &_context{}

var Events = struct {
	WindowOpen      string
	SystemTrayOpen  string
	PocketBaseReady string
}{
	WindowOpen:      "WindowOpen",
	SystemTrayOpen:  "SystemTrayOpen",
	PocketBaseReady: "PocketBaseReady",
}

func (s *_context) InitWindow() {
	app := s.App
	window := s.MainWindow
	systemTray := s.SystemTray

	app.Event.On(Events.WindowOpen, func(event *application.CustomEvent) {
		window.Show()
		window.Focus()
	})

	darwin := runtime.GOOS == "darwin"
	if darwin {

		app.Event.OnApplicationEvent(events.Mac.ApplicationShouldHandleReopen, func(event *application.ApplicationEvent) {
			app.Event.Emit(Events.WindowOpen)
		})
	}

	if systemTray != nil {
		if darwin {
			systemTray.SetTemplateIcon(Icon64)
		} else {
			systemTray.SetDarkModeIcon(SystrayDark)
			systemTray.SetIcon(SystrayLight)
		}

		app.Event.On(Events.SystemTrayOpen, func(ctx *application.CustomEvent) {
			systemTray.OpenMenu()
		})
	}
}
