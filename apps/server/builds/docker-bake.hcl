variable "TAG" {
    default = "latest"
}
variable "VERSION" { default = "" }
variable "IMAGE_REGISTRY" { default = "registry.gitlab.com" }

group "default" {
    targets = ["apis-open-server"]
}

target "base" {
    dockerfile = "Dockerfile"
    platforms  = ["linux/amd64"] // , "linux/arm64"
    pull       = true
}

target "apis-open-server" {
    inherits = ["base"]
    context  = "apis-open-server"
    tags     = tags("apis-open-server")
}

function "tags" {
    params = [name]
    result = [
        "${IMAGE_REGISTRY}/wenerme/wode/${name}:${TAG}",
    ]
}
