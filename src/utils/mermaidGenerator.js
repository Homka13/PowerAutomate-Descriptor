/**
 * Converts parsed Power Automate flow data into Mermaid flowchart graph TD syntax.
 */

export function generateMermaidDiagram(analyzedFlow) {
  const { triggers, actionTree } = analyzedFlow;
  let code = ['graph TD'];

  // Define custom node styles
  code.push('  classDef triggerStyle fill:#059669,stroke:#10b981,color:#ffffff,stroke-width:2px,rx:6px,ry:6px;');
  code.push('  classDef controlStyle fill:#4338ca,stroke:#6366f1,color:#ffffff,stroke-width:2px,rx:6px,ry:6px;');
  code.push('  classDef dataStyle fill:#0284c7,stroke:#38bdf8,color:#ffffff,stroke-width:1px,rx:4px,ry:4px;');
  code.push('  classDef varStyle fill:#7c3aed,stroke:#a855f7,color:#ffffff,stroke-width:1px,rx:4px,ry:4px;');
  code.push('  classDef connectorStyle fill:#2563eb,stroke:#60a5fa,color:#ffffff,stroke-width:1px,rx:4px,ry:4px;');
  code.push('  classDef errorStyle fill:#991b1b,stroke:#f87171,color:#ffffff,stroke-width:2px,stroke-dasharray: 5 5;');
  code.push('  classDef defaultStyle fill:#1e293b,stroke:#475569,color:#f8fafc,stroke-width:1px,rx:4px,ry:4px;');

  const triggerIds = [];
  
  // Triggers
  if (triggers.length === 0) {
    code.push('  Start(["Початок потоку"]):::triggerStyle');
    triggerIds.push('Start');
  } else {
    triggers.forEach((trg, i) => {
      const id = `Trg_${sanitizeId(trg.name)}`;
      const label = escapeLabel(`⚡ Тригер: ${trg.name} (${trg.typeLabel || trg.type})`);
      code.push(`  ${id}["${label}"]:::triggerStyle`);
      triggerIds.push(id);
    });
  }

  // Find root actions (actions with no runAfter or runAfter is empty)
  const rootActions = actionTree.filter(a => Object.keys(a.runAfter || {}).length === 0);

  // Link triggers to root actions
  if (rootActions.length > 0) {
    triggerIds.forEach(tId => {
      rootActions.forEach(rAction => {
        const rId = `Act_${sanitizeId(rAction.name)}`;
        code.push(`  ${tId} --> ${rId}`);
      });
    });
  }

  // Process all action nodes & connections recursively
  const renderedNodes = new Set();
  renderActionNodes(actionTree, code, renderedNodes);

  return code.join('\n');
}

function renderActionNodes(actions, code, renderedNodes) {
  actions.forEach(action => {
    const actId = `Act_${sanitizeId(action.name)}`;
    
    if (!renderedNodes.has(actId)) {
      renderedNodes.add(actId);
      const icon = getCategoryIcon(action.typeCategory, action.type);
      const label = escapeLabel(`${icon} ${action.name} [${action.type}]`);
      const styleClass = getStyleClass(action.typeCategory, action.runsOnFailure);
      
      code.push(`  ${actId}["${label}"]:::${styleClass}`);
    }

    // Connect dependencies based on runAfter
    const runAfterKeys = Object.keys(action.runAfter || {});
    runAfterKeys.forEach(prevName => {
      const prevId = `Act_${sanitizeId(prevName)}`;
      const statuses = action.runAfter[prevName];
      const isErrorHandling = statuses.includes('Failed') || statuses.includes('TimedOut');

      if (isErrorHandling) {
        code.push(`  ${prevId} -. "При помилці (Failed)" .-> ${actId}`);
      } else {
        code.push(`  ${prevId} --> ${actId}`);
      }
    });

    // Render nested structures (If / Switch / Scope / Foreach)
    if (action.branches && action.branches.length > 0) {
      action.branches.forEach((branch, bIdx) => {
        if (branch.actions.length > 0) {
          const branchStart = branch.actions[0];
          const bStartId = `Act_${sanitizeId(branchStart.name)}`;
          code.push(`  ${actId} -- "${escapeLabel(branch.name)}" --> ${bStartId}`);
          renderActionNodes(branch.actions, code, renderedNodes);
        }
      });
    }

    if (action.children && action.children.length > 0) {
      const childStart = action.children[0];
      const cStartId = `Act_${sanitizeId(childStart.name)}`;
      code.push(`  ${actId} -- "Всередині циклу/блоку" --> ${cStartId}`);
      renderActionNodes(action.children, code, renderedNodes);
    }
  });
}

function sanitizeId(str) {
  return str.replace(/[^a-zA-Z0-9_]/g, '_');
}

function escapeLabel(str) {
  return str.replace(/"/g, "'").replace(/[\n\r]/g, ' ');
}

function getStyleClass(category, runsOnFailure) {
  if (runsOnFailure) return 'errorStyle';
  switch (category) {
    case 'control': return 'controlStyle';
    case 'variable': return 'varStyle';
    case 'data': return 'dataStyle';
    case 'connector': return 'connectorStyle';
    default: return 'defaultStyle';
  }
}

function getCategoryIcon(category, type) {
  if (type === 'If') return '🔀';
  if (type === 'Switch') return '🔀';
  if (type === 'Foreach') return '🔁';
  if (type === 'Scope') return '📦';
  if (category === 'variable') return '🔢';
  if (category === 'data') return '📊';
  if (category === 'connector') return '🔌';
  if (category === 'http') return '🌐';
  return '⚙️';
}
