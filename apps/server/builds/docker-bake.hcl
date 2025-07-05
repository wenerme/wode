variable "TAG" {
  default = "latest"
}
variable "VERSION" { default = "" }
# variable "IMAGE_REGISTRY" { default = "registry.gitlab.com" }
variable "IMAGE_REGISTRY" { default = "ghcr.io" }

group "default" {
  targets = ["wener-apis-server", "wener-get-server", "openai-proxy"]
}

target "base" {
  dockerfile = "Dockerfile"
  platforms  = ["linux/amd64"] // , "linux/arm64"
  pull       = true
}

target "wener-apis-server" {
  inherits = ["base"]
  context  = "wener-apis-server"
  tags     = tags("wener-apis-server")
}

target "wener-get-server" {
  inherits = ["base"]
  context  = "wener-get-server"
  tags     = tags("wener-get-server")
}

target "openai-proxy" {
  inherits = ["base"]
  context  = "openai-proxy"
  tags     = tags("openai-proxy")
}

function "tags" {
  params = [name]
  result = [
    "${IMAGE_REGISTRY}/wenerme/wode/${name}:${TAG}",
  ]
}
