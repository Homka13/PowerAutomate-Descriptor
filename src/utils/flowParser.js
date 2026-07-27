/**
 * Normalizes and analyzes Power Automate workflow definitions.
 */

export function analyzeFlow(flowData) {
  const { definition, connections, displayName } = flowData;

  const triggers = parseTriggers(definition.triggers || {});
  const variables = [];
  const connectors = new Set();
  const summary = {
    totalActions: 0,
    controlFlowCount: 0,
    hasErrorHandling: false,
  };

  // Collect connectors from connectionReferences
  if (connections) {
    Object.values(connections).forEach((conn) => {
      if (conn.apiName || conn.displayName || conn.id) {
        connectors.add(conn.displayName || conn.apiName || conn.id);
      }
    });
  }

  // Parse actions recursively
  const actionsList = [];
  const actionTree = parseActionMap(definition.actions || {}, null, variables, connectors, summary, actionsList);

  return {
    displayName: displayName || 'Power Automate Flow',
    triggers,
    variables,
    connectors: Array.from(connectors),
    summary,
    actionTree,
    actionsList
  };
}

function parseTriggers(triggersObj) {
  const result = [];
  Object.keys(triggersObj).forEach((name) => {
    const trg = triggersObj[name];
    let typeLabel = trg.type || 'Manual';

    // Pretty connector/trigger types
    if (trg.type === 'Request') typeLabel = 'HTTP Webhook / HTTP Request';
    else if (trg.type === 'Recurrence') typeLabel = 'Розклад (Recurrence)';
    else if (trg.type === 'OpenApiConnection' || trg.type === 'ApiConnection') {
      typeLabel = trg.inputs?.host?.apiId?.split('/')?.pop() || 'Automated Cloud Trigger';
    }

    result.push({
      name,
      type: trg.type,
      typeLabel,
      kind: trg.kind,
      recurrence: trg.recurrence || null,
      inputs: trg.inputs || {},
      conditions: trg.conditions || []
    });
  });
  return result;
}

function parseActionMap(actionsObj, parentId, variables, connectors, summary, actionsList) {
  const result = [];

  Object.keys(actionsObj).forEach((actionName) => {
    const action = actionsObj[actionName];
    summary.totalActions++;

    // Extract connection info
    if (action.inputs?.host?.apiId) {
      const apiName = action.inputs.host.apiId.split('/').pop();
      connectors.add(apiName);
    } else if (action.type === 'Http') {
      connectors.add('HTTP REST API');
    }

    // Extract variables initialized
    if (action.type === 'InitializeVariable') {
      const vName = action.inputs?.variables?.[0]?.name || actionName;
      const vType = action.inputs?.variables?.[0]?.type || 'Unknown';
      const vVal = action.inputs?.variables?.[0]?.value;
      variables.push({ name: vName, type: vType, initialValue: vVal });
    }

    // Detect error handling (Scope or action running after failure)
    const runAfterKeys = Object.keys(action.runAfter || {});
    const runsOnFailure = runAfterKeys.some((k) => {
      const statuses = action.runAfter[k];
      return statuses.includes('Failed') || statuses.includes('TimedOut');
    });

    if (runsOnFailure) {
      summary.hasErrorHandling = true;
    }

    const parsedAction = {
      name: actionName,
      type: action.type,
      parentId,
      runAfter: action.runAfter || {},
      runsOnFailure,
      description: action.description || '',
      inputs: action.inputs || {},
      typeCategory: getActionCategory(action.type),
      children: [],
      branches: []
    };

    // Handle Control Flow structures (If/Condition, Switch, Foreach, Until, Scope)
    if (action.type === 'If') {
      summary.controlFlowCount++;
      parsedAction.expression = action.expression || action.inputs?.expression;
      
      const trueBranch = parseActionMap(action.actions || {}, actionName, variables, connectors, summary, actionsList);
      const falseBranch = parseActionMap(action.else?.actions || {}, actionName, variables, connectors, summary, actionsList);
      
      parsedAction.branches.push({ name: 'Якщо Так (True)', actions: trueBranch });
      parsedAction.branches.push({ name: 'Якщо Ні (False)', actions: falseBranch });
    } else if (action.type === 'Switch') {
      summary.controlFlowCount++;
      parsedAction.expression = action.expression;
      
      if (action.cases) {
        Object.keys(action.cases).forEach((caseKey) => {
          const caseObj = action.cases[caseKey];
          const caseActions = parseActionMap(caseObj.actions || {}, actionName, variables, connectors, summary, actionsList);
          parsedAction.branches.push({ name: `Випадок ${caseObj.value || caseKey}`, actions: caseActions });
        });
      }
      if (action.default) {
        const defaultActions = parseActionMap(action.default.actions || {}, actionName, variables, connectors, summary, actionsList);
        parsedAction.branches.push({ name: 'По замовчуванню (Default)', actions: defaultActions });
      }
    } else if (action.type === 'Foreach' || action.type === 'Until') {
      summary.controlFlowCount++;
      parsedAction.foreachArray = action.foreach;
      const childActions = parseActionMap(action.actions || {}, actionName, variables, connectors, summary, actionsList);
      parsedAction.children = childActions;
    } else if (action.type === 'Scope') {
      summary.controlFlowCount++;
      const childActions = parseActionMap(action.actions || {}, actionName, variables, connectors, summary, actionsList);
      parsedAction.children = childActions;
    }

    actionsList.push(parsedAction);
    result.push(parsedAction);
  });

  return result;
}

function getActionCategory(type) {
  if (['If', 'Switch', 'Foreach', 'Until', 'Scope'].includes(type)) return 'control';
  if (['InitializeVariable', 'SetVariable', 'IncrementVariable', 'AppendToArrayVariable'].includes(type)) return 'variable';
  if (['Compose', 'ParseJson', 'Select', 'Filter', 'Table'].includes(type)) return 'data';
  if (['OpenApiConnection', 'ApiConnection'].includes(type)) return 'connector';
  if (['Http', 'HttpWebhook'].includes(type)) return 'http';
  if (['Response', 'Terminate'].includes(type)) return 'terminal';
  return 'action';
}
