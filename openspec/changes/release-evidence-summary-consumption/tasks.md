# Tasks

## 1. Planning Artifacts

- [x] 1.1 Define the release evidence summary consumption scope in proposal/design/tasks.

## 2. Summary Consumption Wiring

- [x] 2.1 Extend release evidence policy with artifact and summary appendix metadata.
- [x] 2.2 Add a workflow_run artifact consumer that prepares a release evidence summary appendix.
- [x] 2.3 Add a GitHub body updater that appends the engineering evidence appendix after publish.
- [x] 2.4 Update release workflow and semantic-release config to consume the summary appendix without changing version inference.
- [x] 2.5 Add tests for artifact consumption and body update logic.
- [x] 2.6 Update release automation documentation.

## 3. Validation

- [x] 3.1 Run hook unit tests.
- [x] 3.2 Run the artifact consumer against a simulated workflow_run payload.
- [x] 3.3 Verify the local release summary file can include the engineering evidence appendix.
