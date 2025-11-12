package main

import (
	"embed"
	_ "embed"
	"fmt"
	"log"
	"log/slog"
	"runtime"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"github.com/wenerme/wode/wode-assitant/appx"
	"github.com/wenerme/wode/wode-assitant/wailsx"
	"github.com/wenerme/wode/wode-assitant/wodeass"
)

// Wails uses Go's `embed` package to embed the frontend files into the binary.
// Any files in the frontend/dist folder will be embedded into the binary and
// made available to the frontend.
// See https://pkg.go.dev/embed for more information.

//go:embed all:frontend/dist
var assets embed.FS

// main function serves as the application's entry point.
func main() {
	info := appx.Info

	// Create a new Wails application
	app := application.New(application.Options{
		Name:        info.ProductName,
		Description: fmt.Sprintf("%v v%s by %v", info.ProductName, info.ProductVersion, info.CompanyName),
		Services: []application.Service{
			application.NewService(&GreetService{}),
			application.NewService(&wailsx.WailsxService{}),
			application.NewService(&wailsx.WindowsService{}),
			application.NewService(&appx.AppInfoService{}),
		},
		Icon: appx.Icon128,
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: false,
		},
		Windows: application.WindowsOptions{},
		Linux: application.LinuxOptions{
			DisableQuitOnLastWindowClosed: true,
		},
	})

	// Set app in context
	appx.Context.App = app

	// Create a new window
	window := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            info.ProductName,
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
		Width:            360,
		Height:           600,
		MaxWidth:         720,
		MaxHeight:        1000,
		KeyBindings: map[string]func(window application.Window){
			"F12": func(window application.Window) {
				app.Event.Emit(appx.Events.SystemTrayOpen)
			},
		},
		Windows: application.WindowsWindow{
			HiddenOnTaskbar: false,
		},
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
	})

	// Set window in context
	appx.Context.WebviewWindow = window
	appx.Context.MainWindow = window

	// Setup system tray
	setupSystemTray(app, window)

	// Setup window events
	setupWindowEvents(app, window)

	// Set dev mode
	ctx := appx.Context
	env := app.Env.Info()
	ctx.Dev = env.Debug
	if ctx.Dev {
		slog.SetLogLoggerLevel(slog.LevelDebug)
	} else {
		slog.SetLogLoggerLevel(slog.LevelInfo)
	}

	log.Printf("env: %v", appx.CollectEnvInfo())

	// Create WodeAssistant for business logic
	_ = wodeass.NewWodeAssistant()

	// Create a goroutine that emits an event containing the current time every second
	go func() {
		for {
			now := time.Now().Format(time.RFC1123)
			app.Event.Emit("time", now)
			time.Sleep(time.Second)
		}
	}()

	// Run the application. This blocks until the application has been exited.
	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}

// setupSystemTray sets up the system tray with menu
func setupSystemTray(app *application.App, window *application.WebviewWindow) {
	info := appx.Info
	systemTray := app.SystemTray.New()
	appx.Context.SystemTray = systemTray

	menu := app.Menu.New()

	// Add app name and version (disabled)
	menu.Add(fmt.Sprintf("%v v%v", info.ProductName, info.ProductVersion)).
		SetBitmap(appx.Icon16).
		SetEnabled(false)

	// Add separator
	menu.AddSeparator()

	// Add "Show Window" option
	menu.Add("显示窗口").OnClick(func(ctx *application.Context) {
		if window != nil {
			app.Event.Emit(appx.Events.WindowOpen)
		}
	})

	// Add separator
	menu.AddSeparator()

	// Add "Quit" option
	menu.Add("退出").OnClick(func(ctx *application.Context) {
		app.Quit()
	})

	systemTray.SetMenu(menu)

	// Setup tray icon
	systemTray.SetIcon(appx.Icon64)

	slog.Info("system tray setup completed")
}

// setupWindowEvents sets up window-related event handlers
func setupWindowEvents(app *application.App, window *application.WebviewWindow) {
	// Handle window open event
	app.Event.On(appx.Events.WindowOpen, func(event *application.CustomEvent) {
		if window != nil {
			window.Show()
			window.Focus()
		}
	})

	// Handle system tray open event
	if appx.Context.SystemTray != nil {
		app.Event.On(appx.Events.SystemTrayOpen, func(ctx *application.CustomEvent) {
			appx.Context.SystemTray.OpenMenu()
		})
	}

	// Handle macOS application reopen event
	darwin := runtime.GOOS == "darwin"
	if darwin {
		app.Event.OnApplicationEvent(events.Mac.ApplicationShouldHandleReopen, func(event *application.ApplicationEvent) {
			app.Event.Emit(appx.Events.WindowOpen)
		})
	}

	slog.Info("window events setup completed")
}
