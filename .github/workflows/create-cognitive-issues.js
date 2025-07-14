#!/usr/bin/env node

import { execSync } from 'child_process';
import { Octokit } from "@octokit/rest";

// Configuration
const REPO_OWNER = 'OzCog';
const REPO_NAME = 'mlpn';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PHASE = process.env.PHASE || 'all';
const DRY_RUN = process.env.DRY_RUN === 'true';

// Initialize Octokit for label management
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Required labels with their configurations
const requiredLabels = [
  { name: "phase-1", color: "0e8a16", description: "Phase 1: Cognitive Primitives & Foundational Hypergraph Encoding" },
  { name: "phase-2", color: "5319e7", description: "Phase 2: ECAN Attention Allocation & Resource Kernel Construction" },
  { name: "phase-3", color: "ff6b6b", description: "Phase 3: Neural-Symbolic Synthesis via Custom ggml Kernels" },
  { name: "phase-4", color: "4ecdc4", description: "Phase 4: Distributed Cognitive Mesh API & Embodiment Layer" },
  { name: "phase-5", color: "45b7d1", description: "Phase 5: Recursive Meta-Cognition & Evolutionary Optimization" },
  { name: "phase-6", color: "96ceb4", description: "Phase 6: Rigorous Testing, Documentation, and Cognitive Unification" },
  { name: "milestone", color: "fbca04", description: "Milestone tracking issue" },
  { name: "cognitive-network", color: "d73a49", description: "Related to cognitive network development" },
  { name: "scheme", color: "0052cc", description: "Scheme programming language related" },
  { name: "microservices", color: "7057ff", description: "Microservices architecture" },
  { name: "grammar", color: "008672", description: "Grammar and language processing" },
  { name: "tensor", color: "e99695", description: "Tensor operations and processing" },
  { name: "hypergraph", color: "f9d0c4", description: "Hypergraph data structures" },
  { name: "architecture", color: "c2e0c6", description: "System architecture" },
  { name: "verification", color: "bfd4f2", description: "Verification and validation" },
  { name: "testing", color: "d4edda", description: "Testing and quality assurance" },
  { name: "visualization", color: "fff3cd", description: "Data visualization and flowcharts" },
  { name: "ecan", color: "0366d6", description: "ECAN attention allocation system" },
  { name: "kernel", color: "28a745", description: "Kernel development" },
  { name: "scheduler", color: "6f42c1", description: "Task scheduling systems" },
  { name: "atomspace", color: "e36209", description: "AtomSpace integration" },
  { name: "mesh", color: "f66a0a", description: "Distributed mesh networks" },
  { name: "distributed", color: "0969da", description: "Distributed systems" },
  { name: "benchmarking", color: "1f883d", description: "Performance benchmarking" },
  { name: "flowchart", color: "953800", description: "Flowchart documentation" },
  { name: "ggml", color: "8250df", description: "ggml neural network framework" },
  { name: "kernels", color: "bf8700", description: "Custom kernels development" },
  { name: "neural-symbolic", color: "cf222e", description: "Neural-symbolic computing" },
  { name: "validation", color: "8957e5", description: "Data validation" },
  { name: "documentation", color: "1a7f37", description: "Documentation and guides" },
  { name: "e2e-testing", color: "a40e26", description: "End-to-end testing" },
  { name: "pipeline", color: "fb8500", description: "Data processing pipelines" },
  { name: "api", color: "219653", description: "API development" },
  { name: "rest", color: "0969da", description: "REST API interfaces" },
  { name: "websocket", color: "8b5cf6", description: "WebSocket interfaces" },
  { name: "unity3d", color: "000000", description: "Unity3D integration" },
  { name: "ros", color: "22577a", description: "Robot Operating System integration" },
  { name: "embodiment", color: "38a3a5", description: "Embodied cognition interfaces" },
  { name: "bindings", color: "57cc99", description: "Language bindings" },
  { name: "integration", color: "80ed99", description: "System integration" },
  { name: "robotics", color: "c9ada7", description: "Robotics applications" },
  { name: "meta-cognition", color: "f2cc8f", description: "Meta-cognitive systems" },
  { name: "feedback", color: "f07167", description: "Feedback mechanisms" },
  { name: "moses", color: "0081a7", description: "MOSES evolutionary algorithm" },
  { name: "evolution", color: "00afb9", description: "Evolutionary algorithms" },
  { name: "optimization", color: "fdfcdc", description: "System optimization" },
  { name: "self-tuning", color: "fed9b7", description: "Self-tuning systems" },
  { name: "evolutionary", color: "f07167", description: "Evolutionary computation" },
  { name: "metrics", color: "00f5ff", description: "Performance metrics" },
  { name: "recursion", color: "8338ec", description: "Recursive algorithms" },
  { name: "coverage", color: "3a86ff", description: "Test coverage" },
  { name: "flowcharts", color: "06ffa5", description: "Flowchart generation" },
  { name: "unification", color: "ffbe0b", description: "System unification" },
  { name: "synthesis", color: "fb5607", description: "Component synthesis" },
  { name: "emergent-properties", color: "ff006e", description: "Emergent system properties" }
];

// Function to ensure all required labels exist
async function ensureLabels() {
  if (DRY_RUN) {
    console.log('🏷️  [DRY RUN] Would check and create labels if needed...');
    return;
  }
  
  try {
    console.log('🏷️  Ensuring required labels exist...');
    
    // Get existing labels
    const { data: existingLabels } = await octokit.rest.issues.listLabelsForRepo({
      owner: REPO_OWNER,
      repo: REPO_NAME
    });
    
    const existingLabelNames = new Set(existingLabels.map(l => l.name));
    
    // Create missing labels
    let createdCount = 0;
    let existingCount = 0;
    
    for (const label of requiredLabels) {
      if (!existingLabelNames.has(label.name)) {
        await octokit.rest.issues.createLabel({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          name: label.name,
          color: label.color,
          description: label.description
        });
        console.log(`   ✅ Created label: ${label.name}`);
        createdCount++;
      } else {
        console.log(`   ✓ Label exists: ${label.name}`);
        existingCount++;
      }
    }
    
    console.log(`🏷️  Label check complete: ${existingCount} existing, ${createdCount} created\n`);
    
  } catch (error) {
    console.error('❌ Error ensuring labels:', error.message);
    if (!GITHUB_TOKEN) {
      console.error('   💡 Make sure GITHUB_TOKEN environment variable is set');
    }
    process.exit(1);
  }
}

// Phase definitions based on the issue description
const phases = {
  1: {
    title: "Phase 1: Cognitive Primitives & Foundational Hypergraph Encoding",
    objective: "Establish the atomic vocabulary and bidirectional translation mechanisms between ko6ml primitives and AtomSpace hypergraph patterns.",
    subSteps: [
      {
        title: "Scheme Cognitive Grammar Microservices",
        description: "Design modular Scheme adapters for agentic grammar AtomSpace.\nImplement round-trip translation tests (no mocks).",
        labels: ["phase-1", "scheme", "microservices", "grammar"]
      },
      {
        title: "Tensor Fragment Architecture", 
        description: "Encode agent/state as hypergraph nodes/links with tensor shapes: `[modality, depth, context, salience, autonomy_index]`.\nDocument tensor signatures and prime factorization mapping.",
        labels: ["phase-1", "tensor", "hypergraph", "architecture"]
      },
      {
        title: "Phase 1 Verification",
        description: "Exhaustive test patterns for each primitive and transformation.\nVisualization: Hypergraph fragment flowcharts.",
        labels: ["phase-1", "verification", "testing", "visualization"]
      }
    ]
  },
  2: {
    title: "Phase 2: ECAN Attention Allocation & Resource Kernel Construction",
    objective: "Infuse the network with dynamic, ECAN-style economic attention allocation and activation spreading.",
    subSteps: [
      {
        title: "Kernel & Scheduler Design",
        description: "Architect ECAN-inspired resource allocators (Scheme + Python).\nIntegrate with AtomSpace for activation spreading.",
        labels: ["phase-2", "ecan", "kernel", "scheduler", "atomspace"]
      },
      {
        title: "Dynamic Mesh Integration",
        description: "Benchmark attention allocation across distributed agents.\nDocument mesh topology and dynamic state propagation.",
        labels: ["phase-2", "mesh", "distributed", "benchmarking"]
      },
      {
        title: "Phase 2 Verification",
        description: "Real-world task scheduling and attention flow tests.\nFlowchart: Recursive resource allocation pathways.",
        labels: ["phase-2", "verification", "testing", "flowchart"]
      }
    ]
  },
  3: {
    title: "Phase 3: Neural-Symbolic Synthesis via Custom ggml Kernels",
    objective: "Engineer custom ggml kernels for seamless neural-symbolic computation and inference.",
    subSteps: [
      {
        title: "Kernel Customization",
        description: "Implement symbolic tensor operations in ggml.\nDesign neural inference hooks for AtomSpace integration.",
        labels: ["phase-3", "ggml", "kernels", "neural-symbolic"]
      },
      {
        title: "Tensor Signature Benchmarking",
        description: "Validate tensor operations with real data (no mocks).\nDocument: Kernel API, tensor shapes, performance metrics.",
        labels: ["phase-3", "benchmarking", "validation", "documentation"]
      },
      {
        title: "Phase 3 Verification",
        description: "End-to-end neural-symbolic inference pipeline tests.\nFlowchart: Symbolic ↔ Neural pathway recursion.",
        labels: ["phase-3", "verification", "e2e-testing", "pipeline"]
      }
    ]
  },
  4: {
    title: "Phase 4: Distributed Cognitive Mesh API & Embodiment Layer",
    objective: "Expose the network via REST/WebSocket APIs; bind to Unity3D, ROS, and web agents for embodied cognition.",
    subSteps: [
      {
        title: "API & Endpoint Engineering",
        description: "Architect distributed state propagation, task orchestration APIs.\nEnsure real endpoints—test with live data, no simulation.",
        labels: ["phase-4", "api", "rest", "websocket", "distributed"]
      },
      {
        title: "Embodiment Bindings",
        description: "Implement Unity3D/ROS/WebSocket interfaces.\nVerify bi-directional data flow and real-time embodiment.",
        labels: ["phase-4", "unity3d", "ros", "embodiment", "bindings"]
      },
      {
        title: "Phase 4 Verification",
        description: "Full-stack integration tests (virtual & robotic agents).\nFlowchart: Embodiment interface recursion.",
        labels: ["phase-4", "verification", "integration", "robotics"]
      }
    ]
  },
  5: {
    title: "Phase 5: Recursive Meta-Cognition & Evolutionary Optimization",
    objective: "Enable the system to observe, analyze, and recursively improve itself using evolutionary algorithms.",
    subSteps: [
      {
        title: "Meta-Cognitive Pathways",
        description: "Implement feedback-driven self-analysis modules.\nIntegrate MOSES (or equivalent) for kernel evolution.",
        labels: ["phase-5", "meta-cognition", "feedback", "moses", "evolution"]
      },
      {
        title: "Adaptive Optimization",
        description: "Continuous benchmarking, self-tuning of kernels and agents.\nDocument: Evolutionary trajectories, fitness landscapes.",
        labels: ["phase-5", "optimization", "self-tuning", "evolutionary"]
      },
      {
        title: "Phase 5 Verification",
        description: "Run evolutionary cycles with live performance metrics.\nFlowchart: Meta-cognitive recursion.",
        labels: ["phase-5", "verification", "metrics", "recursion"]
      }
    ]
  },
  6: {
    title: "Phase 6: Rigorous Testing, Documentation, and Cognitive Unification",
    objective: "Achieve maximal rigor, transparency, and recursive documentation—approaching cognitive unity.",
    subSteps: [
      {
        title: "Deep Testing Protocols",
        description: "For every function, perform real implementation verification.\nPublish test output, coverage, and edge cases.",
        labels: ["phase-6", "testing", "verification", "coverage"]
      },
      {
        title: "Recursive Documentation",
        description: "Auto-generate architectural flowcharts for every module.\nMaintain living documentation: code, tensors, tests, evolution.",
        labels: ["phase-6", "documentation", "flowcharts", "architecture"]
      },
      {
        title: "Cognitive Unification",
        description: "Synthesize all modules into a unified tensor field.\nDocument emergent properties and meta-patterns.",
        labels: ["phase-6", "unification", "synthesis", "emergent-properties"]
      }
    ]
  }
};

// Function to create GitHub issue using gh CLI
function createIssue(title, body, labels) {
  const labelArgs = labels.map(label => `--label "${label}"`).join(' ');
  const command = `gh issue create --title "${title}" --body "${body}" ${labelArgs} --repo ${REPO_OWNER}/${REPO_NAME}`;
  
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would create issue: ${title}`);
    console.log(`Labels: ${labels.join(', ')}`);
    console.log(`Body preview: ${body.substring(0, 100)}...`);
    console.log('---');
    return;
  }
  
  try {
    const result = execSync(command, { encoding: 'utf8' });
    console.log(`✅ Created issue: ${title}`);
    console.log(`   URL: ${result.trim()}`);
  } catch (error) {
    console.error(`❌ Failed to create issue: ${title}`);
    console.error(`   Error: ${error.message}`);
  }
}

// Function to generate issue body
function generateIssueBody(phase, subStep) {
  const flowchartSection = phase.title.includes('Phase 1') ? `

## Flowchart Reference
This phase contributes to the overall recursive implementation pathway:

\`\`\`
st=>start: Agentic Grammar Input
e1=>operation: Scheme Adapter Translation
e2=>operation: AtomSpace Hypergraph Encoding
e3=>operation: Tensor Shape Assignment
e4=>operation: ECAN Attention Kernel
e5=>operation: ggml Symbolic Kernel
e6=>operation: Distributed API Propagation
e7=>operation: Embodiment Interface Binding
e8=>operation: Meta-Cognitive Feedback
e9=>operation: Evolutionary Optimization
e10=>end: Unified Cognitive Tensor Field

st->e1->e2->e3->e4->e5->e6->e7->e8->e9->e10
\`\`\`
` : '';

  return `## Phase Objective
${phase.objective}

## Implementation Details
${subStep.description}

## Acceptance Criteria
- [ ] All implementation is completed with real data (no mocks or simulations)
- [ ] Comprehensive tests are written and passing
- [ ] Documentation is updated with architectural diagrams
- [ ] Code follows recursive modularity principles
- [ ] Integration tests validate the functionality

## Related to
This is part of the **${phase.title}** which aims to build a Distributed Agentic Cognitive Grammar Network.

${flowchartSection}

---
*This issue was automatically generated as part of the cognitive network development process.*`;
}

// Main function
async function main() {
  console.log('🚀 Creating Cognitive Network Issues...');
  console.log(`Phase: ${PHASE}`);
  console.log(`Dry Run: ${DRY_RUN}`);
  console.log('');
  
  // Ensure all required labels exist before creating issues
  await ensureLabels();

  // Determine which phases to process
  const phasesToProcess = PHASE === 'all' ? Object.keys(phases) : [PHASE];
  
  if (!phasesToProcess.every(p => phases[p])) {
    console.error('❌ Invalid phase specified. Valid phases are: 1, 2, 3, 4, 5, 6, all');
    process.exit(1);
  }

  // Create milestone issue for each phase
  phasesToProcess.forEach(phaseNum => {
    const phase = phases[phaseNum];
    
    // Create main phase issue
    const phaseBody = `## Objective
${phase.objective}

## Sub-Steps
${phase.subSteps.map((step, index) => `${index + 1}. **${step.title}**`).join('\n')}

## Implementation Approach
This phase follows recursive modularity principles and requires:
- Real implementation verification (no mocks)
- Comprehensive testing protocols
- Architectural documentation with flowcharts
- Integration with the distributed cognitive mesh

## Progress Tracking
- [ ] Phase planning completed
- [ ] Sub-issues created and assigned
- [ ] Implementation in progress
- [ ] Testing and verification
- [ ] Documentation and integration
- [ ] Phase completion and handoff

---
*This is a milestone issue for tracking the overall progress of ${phase.title}.*`;

    createIssue(
      phase.title,
      phaseBody,
      [`phase-${phaseNum}`, 'milestone', 'cognitive-network']
    );

    // Create sub-step issues
    phase.subSteps.forEach(subStep => {
      const issueBody = generateIssueBody(phase, subStep);
      createIssue(
        `${phase.title}: ${subStep.title}`,
        issueBody,
        [...subStep.labels, 'cognitive-network']
      );
    });
  });

  console.log('');
  console.log('✨ Issue creation process completed!');
}

// Run the script
// In ES modules, we can directly call main() since import.meta.url will be the entry point
main().catch(error => {
  console.error('❌ Script execution failed:', error.message);
  process.exit(1);
});