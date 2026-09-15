import fs from 'node:fs/promises';

const replaceOnce = (source, from, to, label) => {
  const first = source.indexOf(from);
  if (first < 0) throw new Error(`Missing replacement target: ${label}`);
  if (source.indexOf(from, first + from.length) >= 0) throw new Error(`Replacement target is not unique: ${label}`);
  return source.slice(0, first) + to + source.slice(first + from.length);
};

const read = (path) => fs.readFile(path, 'utf8');
const write = (path, content) => fs.writeFile(path, content);

const en = `export const en = {
  appTitle: 'Signal 2000',
  gameCanvasLabel: 'Signal 2000 game area',
  rotateDevice: 'Rotate your device',
  startup: {
    heading: 'PREPARING DROP',
    status: 'STABILIZING SIGNAL...',
    failedHeading: 'SIGNAL LOST',
    failedStatus: 'Startup stalled. Reload to retry.',
    progressLabel: 'Game loading progress',
  },
  opening: {
    collection: 'Collection →',
    drop: 'DROP',
    pouch: 'POUCH',
    dropSwitchError: 'Could not switch Drop. Try again.',
    nextDrop: 'NEXT DROP →',
    tearHint: 'Drag the star to tear →',
    resultLocked: 'Result locked',
    tapToSpeedUp: 'Tap to speed up',
    tapCollect: 'Tap to collect',
    tapNext: 'Tap for next pouch',
    swipeItems: 'Swipe items',
    saveLoadError: 'Save data could not be loaded. Reload to retry.',
    saveStageError: 'Could not save the reward. Try the tear again.',
    saveConfirmError: 'Reward shown, but save could not be confirmed. Reload to recover it safely.',
    newItem: 'NEW',
    duplicate: 'DUPLICATE',
    recycled: 'RECYCLED',
    chips: 'CHIPS',
    basicPouch: 'BASIC',
    chargedPouch: 'CHARGED',
    free: 'FREE',
    dropRates: 'DROP RATES',
    secretOdds: 'SECRET*',
    fromFourthOpen: '* FROM OPEN 4',
    reward: 'REWARD',
    ready: 'READY',
    max: 'MAX',
    chargedReady: 'CHARGED POUCH READY',
    signal: 'SIGNAL',
    signalLock: 'SIGNAL LOCK',
    signalLockReady: 'SIGNAL LOCK READY',
    signalLockRetained: 'SIGNAL LOCK RETAINED',
    signalLockConsumed: 'SIGNAL LOCK CONSUMED',
    signalCharged: 'SIGNAL LOCK · CHARGED',
    onboardingSignalGain: 'Duplicates charge Signal',
    onboardingSignalReady: 'Signal charged — the next eligible pouch guarantees something new',
    signalWaitingCharged: 'Signal is waiting for Charged',
    overcharge: 'OVERCHARGE',
    overchargeMax: 'OVERCHARGE MAX',
    total: 'TOTAL',
    raw: 'RAW',
    addedToCollection: 'ADDED TO COLLECTION',
    locked: 'LOCKED',
    chipCache: 'CHIP CACHE',
    bigCache: 'BIG CACHE',
    megaCache: 'MEGA CACHE',
    hiddenPocket: 'HIDDEN POCKET!',
    secretDiscovered: 'SECRET DISCOVERED',
    secretDuplicate: 'SECRET DUPLICATE',
    milestoneStandardsHalf: 'STANDARD SET · HALFWAY',
    milestoneStandardsComplete: 'STANDARD SET COMPLETE',
    milestoneFirstSecret: 'FIRST SECRET FOUND',
    milestoneSecretsComplete: 'ALL SECRETS FOUND',
    milestoneCollected: 'COLLECTED',
    nearCompletionStandardSet: 'STANDARD SET',
    nearCompletionOneLeft: '1 LEFT',
  },
  collection: {
    title: 'Collection',
    shelf: 'Shelf',
    library: 'Library',
    standards: 'Standard',
    secrets: 'Secrets',
    bestOwned: 'Best owned',
    undiscovered: 'Undiscovered',
    openMore: '← Open more',
    emptyShelf: 'Open this gadget family to place it on the shelf',
    secret: 'SECRET',
    loadError: 'Collection data could not be loaded. Reload to retry.',
    nearCompletionOneLeft: '1 LEFT',
    lastStandard: 'LAST STANDARD',
  },
  drops: {
    'y2k-essentials': 'Y2K Essentials',
    'video-link': 'Video Link',
    'pocket-office': 'Pocket Office',
    'pocket-audio': 'Pocket Audio',
    'game-zone': 'Game Zone',
    'analog-nights': 'Analog Nights',
    airwaves: 'Airwaves',
  },
  audio: {
    mute: 'Sound off',
    unmute: 'Sound on',
  },
  rarity: {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
    secret: 'Secret',
  },
} as const;
`;

const ru = `export const ru = {
  appTitle: 'Сигнал 2000',
  gameCanvasLabel: 'Игровое поле «Сигнал 2000»',
  rotateDevice: 'Поверните устройство горизонтально',
  startup: {
    heading: 'ПОДГОТОВКА НАБОРА',
    status: 'НАСТРАИВАЕМ СИГНАЛ...',
    failedHeading: 'СИГНАЛ ПОТЕРЯН',
    failedStatus: 'Запуск прерван. Перезагрузите игру и попробуйте снова.',
    progressLabel: 'Загрузка игры',
  },
  opening: {
    collection: 'Коллекция →',
    drop: 'НАБОР',
    pouch: 'ПАКЕТ',
    dropSwitchError: 'Не удалось переключить набор. Попробуйте ещё раз.',
    nextDrop: 'СЛЕДУЮЩИЙ НАБОР →',
    tearHint: 'Потяни звезду вправо →',
    resultLocked: 'Награда зафиксирована',
    tapToSpeedUp: 'Нажми, чтобы ускорить',
    tapCollect: 'Нажми, чтобы забрать',
    tapNext: 'Нажми для нового пакета',
    swipeItems: 'Листай предметы',
    saveLoadError: 'Не удалось загрузить сохранение. Перезагрузите игру и попробуйте снова.',
    saveStageError: 'Не удалось сохранить награду. Попробуйте открыть пакет ещё раз.',
    saveConfirmError: 'Награда показана, но сохранение не подтверждено. Перезагрузите игру, чтобы безопасно её восстановить.',
    newItem: 'НОВИНКА',
    duplicate: 'ДУБЛИКАТ',
    recycled: 'ПЕРЕРАБОТАНО',
    chips: 'ЧИПЫ',
    basicPouch: 'ОБЫЧНЫЙ',
    chargedPouch: 'ЗАРЯЖЕННЫЙ',
    free: 'БЕСПЛАТНО',
    dropRates: 'ШАНСЫ',
    secretOdds: 'СЕКРЕТ*',
    fromFourthOpen: '* С 4-ГО ОТКРЫТИЯ',
    reward: 'НАГРАДА',
    ready: 'ГОТОВО',
    max: 'МАКС.',
    chargedReady: 'ЗАРЯЖЕННЫЙ ПАКЕТ ГОТОВ',
    signal: 'СИГНАЛ',
    signalLock: 'ГАРАНТИЯ',
    signalLockReady: 'ГАРАНТИЯ ГОТОВА',
    signalLockRetained: 'ГАРАНТИЯ СОХРАНЕНА',
    signalLockConsumed: 'ГАРАНТИЯ ИСПОЛЬЗОВАНА',
    signalCharged: 'ГАРАНТИЯ · ЗАРЯЖЕННЫЙ',
    onboardingSignalGain: 'Дубликаты заряжают сигнал',
    onboardingSignalReady: 'Сигнал заряжен — следующий подходящий пакет гарантирует новый предмет',
    signalWaitingCharged: 'Сигнал ждёт заряженный пакет',
    overcharge: 'ПЕРЕЗАРЯД',
    overchargeMax: 'ПЕРЕЗАРЯД МАКС.',
    total: 'ИТОГО',
    raw: 'ДО БОНУСА',
    addedToCollection: 'ДОБАВЛЕНО В КОЛЛЕКЦИЮ',
    locked: 'ЗАФИКСИРОВАНО',
    chipCache: 'ТАЙНИК ЧИПОВ',
    bigCache: 'БОЛЬШОЙ ТАЙНИК',
    megaCache: 'МЕГА-ТАЙНИК',
    hiddenPocket: 'ТАЙНЫЙ КАРМАН!',
    secretDiscovered: 'СЕКРЕТ НАЙДЕН',
    secretDuplicate: 'ДУБЛИКАТ СЕКРЕТА',
    milestoneStandardsHalf: 'ОСНОВНЫЕ · ПОЛОВИНА',
    milestoneStandardsComplete: 'ОСНОВНЫЕ СОБРАНЫ',
    milestoneFirstSecret: 'ПЕРВЫЙ СЕКРЕТ НАЙДЕН',
    milestoneSecretsComplete: 'ВСЕ СЕКРЕТЫ НАЙДЕНЫ',
    milestoneCollected: 'СОБРАНО',
    nearCompletionStandardSet: 'ОСНОВНЫЕ',
    nearCompletionOneLeft: 'ОСТАЛСЯ 1',
  },
  collection: {
    title: 'Коллекция',
    shelf: 'Полка',
    library: 'Каталог',
    standards: 'Основные',
    secrets: 'Секреты',
    bestOwned: 'Лучшая версия',
    undiscovered: 'Не найдено',
    openMore: '← Открывать дальше',
    emptyShelf: 'Открой гаджет этого типа, чтобы он появился на полке',
    secret: 'СЕКРЕТ',
    loadError: 'Не удалось загрузить коллекцию. Перезагрузите игру и попробуйте снова.',
    nearCompletionOneLeft: 'ОСТАЛСЯ 1',
    lastStandard: 'ПОСЛЕДНИЙ',
  },
  drops: {
    'y2k-essentials': 'Хиты нулевых',
    'video-link': 'Видеосвязь',
    'pocket-office': 'Карманный офис',
    'pocket-audio': 'Карманное аудио',
    'game-zone': 'Игровая зона',
    'analog-nights': 'Аналоговые ночи',
    airwaves: 'Радиоволны',
  },
  audio: {
    mute: 'Выключить звук',
    unmute: 'Включить звук',
  },
  rarity: {
    common: 'Обычная',
    rare: 'Редкая',
    epic: 'Эпическая',
    legendary: 'Легендарная',
    secret: 'Секретная',
  },
} as const;
`;

await write('src/i18n/en.ts', en);
await write('src/i18n/ru.ts', ru);

let html = await read('index.html');
html = replaceOnce(html, '<html lang="en">', '<html lang="ru">', 'html default language');
html = replaceOnce(html, '<title>Mystery Pocket Tech</title>', '<title>Сигнал 2000</title>', 'html title');
html = replaceOnce(html, 'aria-label="Mystery Pocket Tech game canvas"', 'aria-label="Игровое поле «Сигнал 2000»"', 'canvas aria label');
html = replaceOnce(html, '>PREPARING DROP</p>', '>ПОДГОТОВКА НАБОРА</p>', 'startup heading');
html = replaceOnce(html, '>STABILIZING SIGNAL...</div>', '>НАСТРАИВАЕМ СИГНАЛ...</div>', 'startup status');
html = replaceOnce(html, 'aria-label="Startup progress"', 'aria-label="Загрузка игры"', 'startup progress label');
html = replaceOnce(html, '>Rotate your device</div>', '>Поверните устройство горизонтально</div>', 'orientation gate');
await write('index.html', html);

let preload = await read('src/app/startupPreload.ts');
preload = replaceOnce(
  preload,
  `  failedStatus: string;\n}`,
  `  failedStatus: string;\n  progressLabel: string;\n}`,
  'startup copy progress label type',
);
preload = replaceOnce(
  preload,
  `const DEFAULT_COPY: StartupPreloadCopy = {\n  heading: 'PREPARING DROP',\n  status: 'STABILIZING SIGNAL...',\n  failedHeading: 'SIGNAL LOST',\n  failedStatus: 'Startup stalled. Reload to retry.',\n};`,
  `const DEFAULT_COPY: StartupPreloadCopy = {\n  heading: 'ПОДГОТОВКА НАБОРА',\n  status: 'НАСТРАИВАЕМ СИГНАЛ...',\n  failedHeading: 'СИГНАЛ ПОТЕРЯН',\n  failedStatus: 'Запуск прерван. Перезагрузите игру и попробуйте снова.',\n  progressLabel: 'Загрузка игры',\n};`,
  'startup safe default copy',
);
preload = replaceOnce(
  preload,
  `      progressBar.setAttribute('aria-valuenow', String(percent));`,
  `      progressBar.setAttribute('aria-label', snapshot.copy.progressLabel);\n      progressBar.setAttribute('aria-valuenow', String(percent));`,
  'startup progress aria localization',
);
await write('src/app/startupPreload.ts', preload);

let main = await read('src/main.ts');
main = replaceOnce(
  main,
  `  document.documentElement.lang = platform.language;\n  document.title = messages.appTitle;`,
  `  document.documentElement.lang = platform.language;\n  document.title = messages.appTitle;\n  document.querySelector<HTMLElement>('#game')?.setAttribute('aria-label', messages.gameCanvasLabel);`,
  'runtime canvas aria localization',
);
await write('src/main.ts', main);

let opening = await read('src/game/scenes/OpeningScene.ts');
opening = replaceOnce(opening, `const sectionLabel = this.add.text(railX + 2, labelY, 'POUCH', {`, `const sectionLabel = this.add.text(railX + 2, labelY, messages.opening.pouch, {`, 'pouch section label');
opening = replaceOnce(opening, "`${formatOverchargeMultiplier(overcharge)}${overchargeMax ? ' · MAX' : ''}`", "`${formatOverchargeMultiplier(overcharge)}${overchargeMax ? ` · ${messages.opening.max}` : ''}`", 'overcharge max label');
opening = replaceOnce(opening, `const rarityCode = secretSelected ? 'SECRET' : pending.standard.rarity.toUpperCase();`, `const rarityCode = messages.rarity[secretSelected ? 'secret' : pending.standard.rarity].toUpperCase();`, 'reward rarity label');
opening = replaceOnce(opening, `const header = this.add.text(textX, 9, 'REWARD', {`, `const header = this.add.text(textX, 9, messages.opening.reward, {`, 'reward heading');
opening = replaceOnce(opening, `const maxSuffix = pending.overcharge.afterHundredths >= LITE_V2_BALANCE.overchargeCapHundredths ? ' MAX' : '';`, `const maxSuffix = pending.overcharge.afterHundredths >= LITE_V2_BALANCE.overchargeCapHundredths ? \` ${messages.opening.max}\` : '';`, 'retained max label');
opening = replaceOnce(opening, `.text(width - 12, compact ? 9 : 10, 'READY', {`, `.text(width - 12, compact ? 9 : 10, getMessages(getPlatformRuntime().language).opening.ready, {`, 'charged ready badge');
await write('src/game/scenes/OpeningScene.ts', opening);

const test = `import fs from 'node:fs';\nimport { describe, expect, it } from 'vitest';\n\nimport { GAME_REGISTRY } from '../src/game/data/collectibles';\nimport { ru } from '../src/i18n/ru';\n\nconst flattenStrings = (value: unknown): string[] => {\n  if (typeof value === 'string') return [value];\n  if (typeof value !== 'object' || value === null) return [];\n  return Object.values(value).flatMap(flattenStrings);\n};\n\nconst forbiddenGameplayEnglish = /\\b(?:DROP|SIGNAL|CHIPS|OVERCHARGE|CHARGED|POUCH|REWARD|READY|LOCK|SECRET|COMMON|RARE|EPIC|LEGENDARY)\\b|Y2K Essentials|Mystery Pocket Tech/i;\n\ndescribe('Russian moderation localization', () => {\n  it('keeps the Russian message catalog free of gameplay-significant English labels', () => {\n    const violations = flattenStrings(ru).filter((text) => forbiddenGameplayEnglish.test(text));\n    expect(violations).toEqual([]);\n  });\n\n  it('provides Russian names for every collectible family', () => {\n    for (const family of GAME_REGISTRY.families) {\n      expect(family.name.ru.trim().length, family.id).toBeGreaterThan(0);\n    }\n  });\n\n  it('uses a Russian-safe pre-module shell before Yandex locale detection finishes', () => {\n    const html = fs.readFileSync('index.html', 'utf8');\n    expect(html).toContain('<html lang="ru">');\n    expect(html).toContain('<title>Сигнал 2000</title>');\n    expect(html).toContain('ПОДГОТОВКА НАБОРА');\n    expect(html).toContain('НАСТРАИВАЕМ СИГНАЛ...');\n    expect(html).toContain('Поверните устройство горизонтально');\n    expect(html).not.toMatch(/PREPARING DROP|STABILIZING SIGNAL|Rotate your device|Mystery Pocket Tech/);\n  });\n\n  it('does not leave known hardcoded English gameplay labels in OpeningScene', () => {\n    const source = fs.readFileSync('src/game/scenes/OpeningScene.ts', 'utf8');\n    expect(source).not.toContain("'POUCH'");\n    expect(source).not.toContain("'REWARD'");\n    expect(source).not.toContain("'READY'");\n    expect(source).not.toContain("' · MAX'");\n    expect(source).not.toContain("' MAX'");\n  });\n});\n`;
await write('tests/russian-localization.test.ts', test);

console.log('Russian localization patch applied.');
