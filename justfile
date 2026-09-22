set positional-arguments := true

# Show available tasks without running a build or a server.
default:
    @just --list

# Personal or machine-local recipes remain optional and ignored by Git.

import? 'local.just'

# Repository orchestration runs at this justfile's directory. Standalone
# package.just, packages/*.just, servers.just and bake.just preserve the caller.

import 'just/workspace.just'
import 'just/tools.just'
import 'just/buf.just'
import 'just/ci.just'
import 'just/components.just'
import 'just/root-server-entrypoints.just'
