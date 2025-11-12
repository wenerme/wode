package appx

import "github.com/samber/lo"

func CollectEnvInfo() map[string]string {
	app := Context.App
	if app == nil {
		return make(map[string]string)
	}
	env := app.Env.Info()
	i := make(map[string]string)
	i["GOOS"] = env.OS
	i["GOARCH"] = env.Arch
	i["Debug"] = lo.Ternary(env.Debug, "true", "false")
	i["OS.ID"] = env.OSInfo.ID
	i["OS.Name"] = env.OSInfo.Name
	i["OS.Version"] = env.OSInfo.Version
	i["OS.Branding"] = env.OSInfo.Branding

	m := env.PlatformInfo
	k, v := m["Go-WebView2Loader"]
	if v {
		i["WebView2Loader"] = lo.Ternary(k.(bool), "true", "false")
		i["WebView2"] = m["WebView2"].(string)
	}

	return i
}
