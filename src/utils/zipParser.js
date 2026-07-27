import JSZip from 'jszip';

/**
 * Parses a ZIP archive or JSON file containing Power Automate flow(s).
 * Supports standard Power Automate exports, Power Apps Solutions, and direct JSON files.
 * @param {File} file 
 * @returns {Promise<Array<{id: string, displayName: string, definition: object, connections: object, parameters: object, rawText: string}>>}
 */
export async function parsePowerAutomatePackage(file) {
  const fileName = file.name.toLowerCase();

  // Single JSON file upload
  if (fileName.endsWith('.json')) {
    const text = await file.text();
    const json = JSON.parse(text);
    const flowData = extractFlowFromJSON(json, file.name);
    return [flowData];
  }

  // ZIP package upload
  if (fileName.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file);
    const flows = [];

    // Check if it's a standard Package Export (Microsoft.Flow/flows/{id}/definition.json)
    const packageFlowEntries = [];
    const solutionFlowEntries = [];

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;

      const pathLower = relativePath.toLowerCase();

      if (pathLower.endsWith('definition.json')) {
        packageFlowEntries.push(zipEntry);
      } else if (pathLower.includes('workflows/') && pathLower.endsWith('.json')) {
        solutionFlowEntries.push(zipEntry);
      }
    });

    // Parse Package Export format
    if (packageFlowEntries.length > 0) {
      // Look for root or flow-level manifest.json files for display names
      let manifestMap = {};
      try {
        const manifestEntries = [];
        zip.forEach((path, entry) => {
          if (path.toLowerCase().endsWith('manifest.json')) manifestEntries.push(entry);
        });

        for (const mEntry of manifestEntries) {
          const mText = await mEntry.async('text');
          const mJson = JSON.parse(mText);
          if (mJson.resources) {
            Object.keys(mJson.resources).forEach(resKey => {
              const res = mJson.resources[resKey];
              if (res.type === 'Microsoft.Flow/flows' && res.details?.displayName) {
                manifestMap[res.id || resKey] = res.details.displayName;
              }
            });
          }
        }
      } catch (err) {
        console.warn('Manifest parsing warning:', err);
      }

      for (const entry of packageFlowEntries) {
        const text = await entry.async('text');
        const definition = JSON.parse(text);
        const flowId = entry.name.split('/')[2] || entry.name;
        const displayName = manifestMap[flowId] || extractNameFromPath(entry.name) || 'Power Automate Flow';

        flows.push({
          id: flowId,
          displayName,
          definition: definition.properties ? definition.properties.definition || definition : definition,
          connections: definition.properties?.connectionReferences || {},
          parameters: definition.properties?.definition?.parameters || definition.parameters || {},
          rawText: text
        });
      }
    }
    // Parse Solution format
    else if (solutionFlowEntries.length > 0) {
      for (const entry of solutionFlowEntries) {
        const text = await entry.async('text');
        const json = JSON.parse(text);
        const flowData = extractFlowFromJSON(json, extractNameFromPath(entry.name));
        flows.push(flowData);
      }
    } else {
      // Fallback: search any json inside zip that has `$schema` or `triggers` and `actions`
      const jsonEntries = [];
      zip.forEach((path, entry) => {
        if (!entry.dir && path.endsWith('.json')) jsonEntries.push(entry);
      });

      for (const entry of jsonEntries) {
        try {
          const text = await entry.async('text');
          const json = JSON.parse(text);
          if (json.triggers || json.actions || json.properties?.definition?.actions) {
            const flowData = extractFlowFromJSON(json, extractNameFromPath(entry.name));
            flows.push(flowData);
          }
        } catch (e) {
          // ignore non-json or non-flow jsons
        }
      }
    }

    if (flows.length === 0) {
      throw new Error('У ZIP-архіві не знайдено валідного виправленого потоку Power Automate (definition.json не знайдено).');
    }

    return flows;
  }

  throw new Error('Непідтримуваний формат файлу. Будь ласка, завантажте .zip файл або .json');
}

function extractFlowFromJSON(json, fallbackName) {
  let def = json;
  let connections = {};
  let displayName = json.properties?.displayName || json.displayName || fallbackName.replace(/\.json$/i, '');

  if (json.properties) {
    if (json.properties.definition) {
      def = json.properties.definition;
    }
    connections = json.properties.connectionReferences || {};
  }

  return {
    id: json.id || String(Math.random()),
    displayName,
    definition: def,
    connections,
    parameters: def.parameters || {},
    rawText: JSON.stringify(json, null, 2)
  };
}

function extractNameFromPath(path) {
  const parts = path.split('/');
  return parts[parts.length - 1].replace(/\.json$/i, '');
}
