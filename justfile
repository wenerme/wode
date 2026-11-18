set positional-arguments

# Show available tasks without running a build or a server.
default:
    @just --list

# Personal or machine-local recipes remain optional and ignored by Git.
mod? local 'local.just'

mod workspace 'just/workspace.just'
mod tools 'just/tools.just'
mod buf 'just/buf.just'
mod ci 'just/ci.just'
mod server 'apps/server/server.just'
