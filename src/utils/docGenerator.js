/**
 * Generates rich structured Markdown documentation from an analyzed Power Automate flow.
 */

export function generateMarkdownDoc(analyzedFlow) {
  const { displayName, triggers, variables, connectors, summary, actionsList } = analyzedFlow;

  const lines = [];

  // Title
  lines.push(`# 📋 Опис та документація потоку: ${displayName}`);
  lines.push('');
  lines.push(`> **Дата створення звіту:** ${new Date().toLocaleDateString('uk-UA')} ${new Date().toLocaleTimeString('uk-UA')}`);
  lines.push('');

  // Summary Metrics Table
  lines.push('## 📊 Загальне зведення');
  lines.push('');
  lines.push('| Метрика | Значення |');
  lines.push('| :--- | :--- |');
  lines.push(`| **Назва потоку** | \`${displayName}\` |`);
  lines.push(`| **Кількість тригерів** | ${triggers.length} |`);
  lines.push(`| **Всього дій (Actions)** | ${summary.totalActions} |`);
  lines.push(`| **Блоків управління (Control Flow)** | ${summary.controlFlowCount} (Condition, Switch, Loops) |`);
  lines.push(`| **Використовуваних змінних** | ${variables.length} |`);
  lines.push(`| **Зовнішніх коннекторів** | ${connectors.length} |`);
  lines.push(`| **Наявність обробки помилок (Try-Catch / RunAfter)** | ${summary.hasErrorHandling ? '✅ Так (наявні блоки при помилках)' : '⚠️ Ні (відсутні специфічні гілки помилок)'} |`);
  lines.push('');

  // Triggers Section
  lines.push('## ⚡ Тригери (Початок потоку)');
  lines.push('');
  if (triggers.length === 0) {
    lines.push('_Тригери не вказані або потік запускається вручну._');
  } else {
    lines.push('| Назва тригеру | Тип | Деталі / Розклад |');
    lines.push('| :--- | :--- | :--- |');
    triggers.forEach(trg => {
      let details = '-';
      if (trg.recurrence) {
        details = `Кожні ${trg.recurrence.interval} ${trg.recurrence.frequency}`;
      } else if (trg.type === 'Request') {
        details = 'Очікує HTTP POST запит';
      }
      lines.push(`| **${trg.name}** | \`${trg.typeLabel || trg.type}\` | ${details} |`);
    });
  }
  lines.push('');

  // Connectors & Integrations Section
  lines.push('## 🔌 Використовувані Коннектори та Сервіси');
  lines.push('');
  if (connectors.length === 0) {
    lines.push('_Зовнішні коннектори не виявлені (використовуються лише внутрішні операції з даними)._');
  } else {
    connectors.forEach(conn => {
      lines.push(`- 🔹 **${conn}**`);
    });
  }
  lines.push('');

  // Variables Section
  lines.push('## 🔢 Змінні (Variables)');
  lines.push('');
  if (variables.length === 0) {
    lines.push('_У потоці немає ініціалізованих змінних._');
  } else {
    lines.push('| Назва змінної | Тип даних | Початкове значення |');
    lines.push('| :--- | :--- | :--- |');
    variables.forEach(v => {
      const valStr = v.initialValue !== undefined ? `\`${JSON.stringify(v.initialValue)}\`` : '_не вказано_';
      lines.push(`| **\`${v.name}\`** | \`${v.type}\` | ${valStr} |`);
    });
  }
  lines.push('');

  // Detailed Actions Table
  lines.push('## ⚙️ Детальний покроковий опис дій (Step-by-Step Actions)');
  lines.push('');
  lines.push('| № | Назва дії (Action Name) | Тип операції | Залежність (Run After) | Особливості / Гілки |');
  lines.push('| :---: | :--- | :--- | :--- | :--- |');

  actionsList.forEach((act, idx) => {
    const runAfterDeps = Object.keys(act.runAfter || {});
    const depStr = runAfterDeps.length > 0 ? runAfterDeps.map(d => `\`${d}\``).join(', ') : '_Початок гілки_';

    let extraInfo = [];
    if (act.runsOnFailure) extraInfo.push('🔴 **Обробка помилки**');
    if (act.expression) extraInfo.push(`Умова: \`${act.expression}\``);
    if (act.foreachArray) extraInfo.push(`Цикл по: \`${act.foreachArray}\``);
    if (act.branches?.length > 0) {
      const bNames = act.branches.map(b => b.name).join(', ');
      extraInfo.push(`Гілки: ${bNames}`);
    }

    const extraStr = extraInfo.length > 0 ? extraInfo.join('<br/>') : '-';
    lines.push(`| ${idx + 1} | **${act.name}** | \`${act.type}\` | ${depStr} | ${extraStr} |`);
  });
  lines.push('');

  // Structural Tree View
  lines.push('## 🌳 Ієрархічне дерево бізнес-логіки');
  lines.push('');
  lines.push('```text');
  buildTextTree(analyzedFlow.actionTree, lines, '');
  lines.push('```');
  lines.push('');

  lines.push('---');
  lines.push('_Документація згенерована автоматично за допомогою **Power Automate Flow Visualizer**._');

  return lines.join('\n');
}

function buildTextTree(actions, lines, indent) {
  actions.forEach((act, idx) => {
    const isLast = idx === actions.length - 1;
    const prefix = indent + (isLast ? '└── ' : '├── ');
    
    let label = `${act.name} (${act.type})`;
    if (act.runsOnFailure) label += ' [🔴 On Error]';

    lines.push(`${prefix}${label}`);

    const childIndent = indent + (isLast ? '    ' : '│   ');

    if (act.branches && act.branches.length > 0) {
      act.branches.forEach(b => {
        lines.push(`${childIndent}├── 🔀 ${b.name}`);
        buildTextTree(b.actions, lines, childIndent + '│   ');
      });
    }

    if (act.children && act.children.length > 0) {
      lines.push(`${childIndent}├── 🔁 Всередині циклу / Scope:`);
      buildTextTree(act.children, lines, childIndent + '│   ');
    }
  });
}
