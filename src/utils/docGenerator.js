/**
 * Generates enterprise-ready, professional Wiki & Report documentation from an analyzed Power Automate flow.
 */

export function generateMarkdownDoc(analyzedFlow) {
  const { displayName, triggers, variables, connectors, summary, actionsList, actionTree } = analyzedFlow;
  const now = new Date();
  const formattedDate = `${now.toLocaleDateString('uk-UA')} ${now.toLocaleTimeString('uk-UA')}`;

  const lines = [];

  // 1. Header & Executive Metadata
  lines.push(`# 📄 Документація бізнес-процесу: ${displayName}`);
  lines.push('');
  lines.push('> **Тип документа:** Регламент автоматизованого бізнес-процесу (Business Process Wiki / Spec)');
  lines.push(`> **Дата формування:** ${formattedDate}`);
  lines.push(`> **Статус автоматизації:** ${summary.hasErrorHandling ? '🟢 Продуктивний (з обробкою помилок)' : '🟡 Базовий (без виділених гілок обробки помилок)'}`);
  lines.push('');

  // 2. Executive Summary Metrics Table
  lines.push('## 📊 1. Загальна характеристика та метрики');
  lines.push('');
  lines.push('| Параметр | Значення | Опис |');
  lines.push('| :--- | :--- | :--- |');
  lines.push(`| **Назва автоматизації** | \`${displayName}\` | Ідентифікатор потоку Power Automate |`);
  lines.push(`| **Запуск (Тригери)** | ${triggers.map(t => `\`${t.typeLabel || t.name}\``).join(', ') || 'Manual'} | Спосіб ініціації бізнес-процесу |`);
  lines.push(`| **Всього кроків (Actions)** | **${summary.totalActions}** дій | Загальна кількість розрахованих кроків |`);
  lines.push(`| **Контроль логіки** | **${summary.controlFlowCount}** структур | Блоки розгалужень (Condition, Switch) та циклів (Foreach, Until) |`);
  lines.push(`| **Змінні процесу** | **${variables.length}** змінних | Внутрішні буфери та лічильники стану |`);
  lines.push(`| **Зовнішні коннектори** | **${connectors.length}** систем | Інтегровані сервіси та бази даних |`);
  lines.push(`| **Надійність (Try-Catch)** | ${summary.hasErrorHandling ? '✅ Присутній захист' : '⚠️ Потребує налаштування'} | Наявність гілок обробки виняткових ситуацій |`);
  lines.push('');

  // 3. Detailed Business Scenario Narrative
  lines.push('## 📖 2. Сценарій та алгоритм виконання бізнес-процесу');
  lines.push('');
  lines.push(generateExecutiveScenario(analyzedFlow));
  lines.push('');

  // 4. Variables & Internal State Registry
  lines.push('## 🔢 3. Реєстр змінних та контексту виконання');
  lines.push('');
  if (variables.length === 0) {
    lines.push('_Внутрішні змінні у даному процесі не ініціалізуються._');
  } else {
    lines.push('| Назва змінної | Тип даних | Початковий стан / Формат | Призначення у процесі |');
    lines.push('| :--- | :---: | :--- | :--- |');
    variables.forEach(v => {
      const valStr = v.initialValue !== undefined ? `\`${JSON.stringify(v.initialValue)}\`` : '_За замовчуванням_';
      const purpose = inferVariablePurpose(v.name, v.type);
      lines.push(`| **\`${v.name}\`** | \`${v.type}\` | ${valStr} | ${purpose} |`);
    });
  }
  lines.push('');

  // 5. Connectors & External Systems
  lines.push('## 🔌 4. Інтегровані системи та коннектори');
  lines.push('');
  if (connectors.length === 0) {
    lines.push('_Процес виконується виключно у внутрішньому контексті без звернення до зовнішніх API._');
  } else {
    lines.push('| Сервіс / Коннектор | Тип взаємодії | Роль у бізнес-процесі |');
    lines.push('| :--- | :---: | :--- |');
    connectors.forEach(conn => {
      lines.push(`| 🔹 **${conn}** | \`API Integration\` | ${inferConnectorRole(conn)} |`);
    });
  }
  lines.push('');

  // 6. Action Registry Table
  lines.push('## ⚙️ 5. Реєстр дій та покрокова специфікація');
  lines.push('');
  lines.push('| № | Крок процесу | Категорія | Залежність (Run After) | Контекст та параметри |');
  lines.push('| :---: | :--- | :---: | :--- | :--- |');

  actionsList.forEach((act, idx) => {
    const runAfterDeps = Object.keys(act.runAfter || {});
    const depStr = runAfterDeps.length > 0 ? runAfterDeps.map(d => `\`${d}\``).join(', ') : '_Початок етапу_';

    let extraInfo = [];
    if (act.runsOnFailure) extraInfo.push('🔴 **Обробка помилки (Fallback)**');
    if (act.expression) extraInfo.push(`Умова: \`${act.expression}\``);
    if (act.foreachArray) extraInfo.push(`Ітерація по: \`${act.foreachArray}\``);
    if (act.branches?.length > 0) {
      const bNames = act.branches.map(b => b.name).join(', ');
      extraInfo.push(`Гілки: ${bNames}`);
    }

    const extraStr = extraInfo.length > 0 ? extraInfo.join('<br/>') : '-';
    lines.push(`| ${idx + 1} | **${act.name}** | \`${act.type}\` | ${depStr} | ${extraStr} |`);
  });
  lines.push('');

  // 7. Structural Tree View
  lines.push('## 🌳 6. Ієрархічна структура бізнес-логіки');
  lines.push('');
  lines.push('```text');
  buildTextTree(actionTree, lines, '');
  lines.push('```');
  lines.push('');

  // 8. Quality & Reliability Recommendations
  lines.push('## 🛡️ 7. Оцінка надійності та рекомендації');
  lines.push('');
  if (summary.hasErrorHandling) {
    lines.push('> [!NOTE]');
    lines.push('> **Оцінка надійності:** 🟢 **Висока**. У процесі наявна обробка помилок (Try-Catch / RunAfter). Потік спроможний коректно реагувати на збої у зовнішніх сервісах.');
  } else {
    lines.push('> [!WARNING]');
    lines.push('> **Оцінка надійності:** 🟡 **Потребує покращення**. У процесі відсутні явні гілки обробки помилок. Рекомендується додати блоки `Scope (Try/Catch)` або налаштувати умову `RunAfter: HasFailed` для критичних кроків надсилання листів та запитів до баз даних.');
  }
  lines.push('');

  lines.push('---');
  lines.push('_Документ згенеровано автоматично за допомогою модуля **Power Automate Enterprise Documentation Generator**._');

  return lines.join('\n');
}

/**
 * Generates clean, executive-ready narrative business scenarios.
 */
function generateExecutiveScenario(analyzedFlow) {
  const { triggers, connectors, variables, actionsList } = analyzedFlow;
  const sections = [];

  // Phase 1: Initiation
  let initText = '**Етап 1. Ініціація бізнес-процесу:**\n';
  if (triggers.length > 0) {
    const trg = triggers[0];
    if (trg.recurrence) {
      initText += `Процес запускається автоматично за регламентним розкладом з періодичністю **${trg.recurrence.interval} ${trg.recurrence.frequency}**.`;
    } else if (trg.type === 'Request') {
      initText += `Процес активується за зовнішнім подійним HTTP-сигналом (Webhook / API запит) або запускається користувачем за потреби.`;
    } else {
      initText += `Процес ініціюється автоматично при виникненні події у сервісі **${trg.typeLabel || trg.name}**.`;
    }
  } else {
    initText += `Процес запускається у ручному режимі оператором.`;
  }
  sections.push(initText);

  // Phase 2: State Setup
  if (variables.length > 0) {
    let varText = '**Етап 2. Підготовка контексту та змінних:**\n';
    varText += `Система виконує ініціалізацію **${variables.length}** внутрішніх змінних для накопичення та форматування даних. `;
    const importantVars = variables.slice(0, 5).map(v => `\`${v.name}\``).join(', ');
    varText += `Зокрема налаштовуються змінні: ${importantVars}.`;
    sections.push(varText);
  }

  // Phase 3: Data Fetching
  const getActions = actionsList.filter(a => 
    a.name.toLowerCase().includes('list') || 
    a.name.toLowerCase().includes('get') ||
    a.name.toLowerCase().includes('fetch') ||
    a.name.toLowerCase().includes('select')
  );
  if (getActions.length > 0) {
    let dataText = '**Етап 3. Вибірка та консолідація даних:**\n';
    const connNames = connectors.length > 0 ? `сервісів **${connectors.join(', ')}**` : 'інформаційних джерел';
    dataText += `Здійснюється запит до ${connNames} для отримання актуального масиву записів. `;
    dataText += `Ключові кроки вибірки: ${getActions.slice(0, 3).map(a => `\`${a.name}\``).join(', ')}.`;
    sections.push(dataText);
  }

  // Phase 4: Business Logic & Processing
  const loops = actionsList.filter(a => a.type === 'Foreach' || a.type === 'Until');
  const conditions = actionsList.filter(a => a.type === 'If' || a.type === 'Switch');
  if (loops.length > 0 || conditions.length > 0) {
    let procText = '**Етап 4. Аналіз, перевірка умов та ітеративна обробка:**\n';
    if (loops.length > 0) {
      procText += `Виконується циклічний перебір отриманих даних (${loops.map(l => `\`${l.name}\``).join(', ')}). `;
    }
    if (conditions.length > 0) {
      procText += `Застосовуються правила бізнес-валідації та розгалуження процесів (${conditions.map(c => `\`${c.name}\``).join(', ')}).`;
    }
    sections.push(procText);
  }

  // Phase 5: Output & Notifications
  const outputActions = actionsList.filter(a => 
    a.name.toLowerCase().includes('email') || 
    a.name.toLowerCase().includes('send') || 
    a.name.toLowerCase().includes('post') || 
    a.name.toLowerCase().includes('create') ||
    a.name.toLowerCase().includes('response')
  );
  if (outputActions.length > 0) {
    let outText = '**Етап 5. Формування результатів та інформування:**\n';
    outText += `Завершальна стадія включає збереження результатів та розсилку підсумкових звітів / сповіщень. `;
    outText += `Використовуються дії: ${outputActions.slice(0, 3).map(a => `\`${a.name}\``).join(', ')}.`;
    sections.push(outText);
  }

  return sections.join('\n\n');
}

function inferVariablePurpose(name, type) {
  const lower = name.toLowerCase();
  if (lower.includes('html') || lower.includes('table')) return 'Збереження структурованої HTML-таблиці для звіту';
  if (lower.includes('time') || lower.includes('date')) return 'Фіксація міток часу виконання або періоду';
  if (lower.includes('count') || lower.includes('total')) return 'Лічильник оброблених записів';
  if (lower.includes('error') || lower.includes('msg')) return 'Буфер текстових повідомлень про помилки';
  if (lower.includes('user') || lower.includes('role')) return 'Тимчасовий буфер даних про користувача / ролі';
  return `Змінна типу ${type} для збереження стану`;
}

function inferConnectorRole(conn) {
  const lower = conn.toLowerCase();
  if (lower.includes('commondataservice') || lower.includes('dataverse')) return 'Зчитування та оновлення об\'єктів Dataverse (Common Data Service)';
  if (lower.includes('office365') || lower.includes('mail') || lower.includes('outlook')) return 'Відправка повідомлень та листів поштою Office 365 Outlook';
  if (lower.includes('sharepoint')) return 'Взаємодія зі списками та документами SharePoint';
  if (lower.includes('teams')) return 'Публікація сповіщень у канали чи чати Microsoft Teams';
  return 'Зовнішній API сервіс для обміну даними';
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
