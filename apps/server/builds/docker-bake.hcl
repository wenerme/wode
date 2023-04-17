variable "TAG" {
    default = "latest"
}
variable "VERSION" { default = "" }

group "default" {
    targets = ["browser-agent"]
}

target "base" {
    dockerfile = "Dockerfile"
    platforms  = ["linux/amd64"] // , "linux/arm64"
    pull       = true
}

target "apis-server" {
    inherits = ["base"]
    context  = "apis-server"
    tags     = tags("apis-server")
}

function "tags" {
    params = [name]
    result = [
        "registry.gitlab.com/wenerme/wode/${name}:${TAG}",
    ]
}
