# Release Automation

## Strategy

- Conventional commits drive semantic versioning.
- GitHub Actions is the only supported release authority.
- `semantic-release` generates versions, changelog entries, tags, and GitHub Releases.

## Required Secrets

- `GITHUB_TOKEN`: provided by GitHub Actions for release publication.

## Branch Expectations

- `main` is the release branch.
- validation workflows run on pushes and pull requests.
- release workflow runs after validation succeeds on `main`.

## Release Outputs

- updated `CHANGELOG.md`
- generated GitHub Release notes
- release summary artifact for marketing and post-release communication