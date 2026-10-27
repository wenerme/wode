set positional-arguments := true

# Show available tasks without running a build or a server.
default:
    @just --list

# Personal or machine-local recipes remain optional and ignored by Git.

import? 'local.just'

# Repository orchestration runs at the justfile's directory. Package-local
# justfiles import `just/pkg.just` and preserve the caller's directory.

import 'just/workspace.just'
import 'just/tools.just'
import 'just/buf.just'
import 'just/ci.just'
import 'just/root-server-entrypoints.just'
