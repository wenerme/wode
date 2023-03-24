variable "TAG" {
  default = ""
}
variable "NAME" {
  default = "woodpecker-feishu-bot"
}
variable "PLATFORM" {
  default = "linux/amd64,linux/arm64"
}

target "default" {
  inherits = ["base"]
  tags = tags("latest")
}

target "base" {
  dockerfile = "Dockerfile"
  platforms = split(",",PLATFORM)
  pull = true
}

function "tags" {
  params = [tag]
  result = [
    "docker.io/wener/${NAME}:${tag}","quay.io/wener/${NAME}:${tag}",
    notequal("",TAG) ? "docker.io/wener/${NAME}:${TAG}": "",
    notequal("",TAG) ? "quay.io/wener/${NAME}:${TAG}": "",
  ]
}
