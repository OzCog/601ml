# Cognitive Network Issues Creation

This GitHub Action automates the creation of structured issues for the Distributed Agentic Cognitive Grammar Network development process.

## Overview

The action creates issues for 6 main phases of cognitive network development:

1. **Phase 1**: Cognitive Primitives & Foundational Hypergraph Encoding
2. **Phase 2**: ECAN Attention Allocation & Resource Kernel Construction  
3. **Phase 3**: Neural-Symbolic Synthesis via Custom ggml Kernels
4. **Phase 4**: Distributed Cognitive Mesh API & Embodiment Layer
5. **Phase 5**: Recursive Meta-Cognition & Evolutionary Optimization
6. **Phase 6**: Rigorous Testing, Documentation, and Cognitive Unification

Each phase contains multiple sub-steps that are created as individual issues with proper labeling and organization.

## Usage

### Manual Trigger

1. Go to the **Actions** tab in your GitHub repository
2. Find the "Create Cognitive Network Issues" workflow
3. Click "Run workflow"
4. Configure the inputs:
   - **Phase**: Choose which phase to create issues for (`all`, `1`, `2`, `3`, `4`, `5`, or `6`)
   - **Dry Run**: Set to `true` to preview what issues would be created without actually creating them

### Inputs

- `phase` (optional): Which phase to create issues for
  - Default: `all`
  - Options: `all`, `1`, `2`, `3`, `4`, `5`, `6`
- `dry_run` (optional): Preview mode without creating actual issues
  - Default: `false`
  - Options: `true`, `false`

## Issue Structure

Each phase creates:

1. **Milestone Issue**: Overview of the entire phase with progress tracking
2. **Sub-step Issues**: Individual implementable tasks for each component

### Labels Applied

- `phase-X`: Indicates which phase the issue belongs to
- `milestone`: Applied to main phase tracking issues
- `cognitive-network`: Applied to all generated issues
- Component-specific labels: `scheme`, `tensor`, `ecan`, `ggml`, `api`, etc.

### Issue Content

Each issue includes:
- Phase objective and context
- Detailed implementation requirements
- Acceptance criteria checklist
- Integration requirements
- Architectural flowchart references (where applicable)

## Local Testing

You can test the issue creation locally using the script directly:

```bash
# Dry run for Phase 1 only
PHASE=1 DRY_RUN=true node .github/scripts/create-cognitive-issues.js

# Dry run for all phases  
PHASE=all DRY_RUN=true node .github/scripts/create-cognitive-issues.js

# Actually create issues for Phase 1 (requires GITHUB_TOKEN)
GITHUB_TOKEN=your_token PHASE=1 node .github/scripts/create-cognitive-issues.js
```

## Requirements

- GitHub CLI (`gh`) must be available in the runner environment
- `issues: write` permission is required
- Repository must be accessible with the provided GitHub token

## Implementation Philosophy

The generated issues follow these principles:

- **Recursive Modularity**: Each component is self-similar and modular
- **Real Implementation**: All work must use real data, no mocks or simulations  
- **Comprehensive Testing**: Every component requires thorough testing protocols
- **Living Documentation**: Auto-generated flowcharts and architectural diagrams
- **Evolutionary Optimization**: Continuous improvement and adaptation
- **Cognitive Unity**: All modules converge toward emergent cognitive synthesis

## Example Issue Structure

```
Title: Phase 1: Cognitive Primitives & Foundational Hypergraph Encoding: Scheme Cognitive Grammar Microservices

## Phase Objective
Establish the atomic vocabulary and bidirectional translation mechanisms between ko6ml primitives and AtomSpace hypergraph patterns.

## Implementation Details
Design modular Scheme adapters for agentic grammar AtomSpace.
Implement round-trip translation tests (no mocks).

## Acceptance Criteria
- [ ] All implementation is completed with real data (no mocks or simulations)
- [ ] Comprehensive tests are written and passing
- [ ] Documentation is updated with architectural diagrams
- [ ] Code follows recursive modularity principles
- [ ] Integration tests validate the functionality

...
```

## Files

- `.github/workflows/create-cognitive-network-issues.yml`: Main workflow file
- `.github/scripts/create-cognitive-issues.js`: Issue creation script
- `.github/docs/cognitive-network-issues.md`: This documentation file