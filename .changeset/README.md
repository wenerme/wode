# Changesets

Add one Markdown file for each user-facing change that should be released.

For example:

```md
---
'@wener/ai': patch
---

Describe the change for the package changelog.
```

The release workflow creates a version pull request from these files. Merging
that pull request updates the package version and changelog; the next run
publishes only the packages included in that release.
