const fs = require('node:fs');

function replace(file, from, to, expected = 1) {
  const source = fs.readFileSync(file, 'utf8');
  const count = source.split(from).length - 1;
  if (count !== expected) throw new Error(`${file}: expected ${expected} matches for ${JSON.stringify(from)}, found ${count}`);
  fs.writeFileSync(file, source.split(from).join(to));
}

const ru = 'src/i18n/ru.ts';
replace(ru, "recycled: 'ПЕРЕРАБОТАНО'", "recycled: 'ЗА ДУБЛИКАТ'");
replace(ru, "milestoneStandardsHalf: 'ОСНОВНЫЕ · ПОЛОВИНА'", "milestoneStandardsHalf: 'ПОЛОВИНА НАБОРА СОБРАНА!'");
replace(ru, "emptyShelf: 'Открой гаджет этого типа, чтобы он появился на полке'", "emptyShelf: 'Найди предмет этого типа, и он появится на полке'");
replace(ru, "openMore: '← Открывать дальше'", "openMore: '← К ПАКЕТАМ'");

const opening = 'src/game/scenes/OpeningScene.ts';
const collection = 'src/game/scenes/CollectionScene.ts';
replace(opening, "import { getMessages } from '../../i18n';", "import { getMessages } from '../../i18n';\nimport { formatBaseChipReward, formatChipAmount, formatChipGain, formatDuplicateReward, getRarityBadge } from '../../i18n/format';");
replace(collection, "import { getMessages } from '../../i18n';", "import { getMessages } from '../../i18n';\nimport { getRarityBadge } from '../../i18n/format';");

// Only amount-bearing labels are inflected; the standalone HUD title stays CHIPS.
replace(opening, '${cost} ${messages.opening.chips}', '${formatChipAmount(cost, getPlatformRuntime().language)}');
replace(opening, '${this.saveState.chips}/${cost} ${messages.opening.chips}', '${this.saveState.chips}/${formatChipAmount(cost, getPlatformRuntime().language)}');

// Standalone rarity tiers in the result and catalog; the shelf keeps adjectives.
replace(opening, 'rarity: messages.rarity.secret,', "rarity: getRarityBadge(language, 'secret'),");
replace(opening, 'rarity: messages.rarity[pending.standard.rarity],', 'rarity: getRarityBadge(language, pending.standard.rarity),');
replace(collection, 'messages.rarity[entry.rarity]', 'getRarityBadge(getPlatformRuntime().language, entry.rarity)');

// Only presentation copy, not reward arithmetic or durable state.
replace(opening, '${messages.opening.recycled} +${pending.chips.recycle}', '${formatDuplicateReward(pending.chips.recycle, getPlatformRuntime().language)}', 2);
replace(opening, '${messages.opening.chips} +${pending.chips.base}', '${formatBaseChipReward(pending.chips.base, getPlatformRuntime().language)}');
replace(opening, '+${pending.chips.secretBonus} ${messages.opening.chips}', '${formatChipGain(pending.chips.secretBonus, getPlatformRuntime().language)}');
replace(opening, '+${animatedTotalStart} ${messages.opening.chips}', '${formatChipGain(animatedTotalStart, getPlatformRuntime().language)}');
replace(opening, '+${standardTotal} ${messages.opening.chips}', '${formatChipGain(standardTotal, getPlatformRuntime().language)}');
replace(opening, '+${Math.round(counter.value)} ${messages.opening.chips}', '${formatChipGain(Math.round(counter.value), getPlatformRuntime().language)}');

const updated = fs.readFileSync(opening, 'utf8');
if (/\+\$\{[^}]+\}\s+\$\{messages\.opening\.chips\}/.test(updated)) {
  throw new Error('Uninflected chip amounts remain in OpeningScene');
}

// This one-shot patch runner must leave no CI/infrastructure churn in the PR.
fs.unlinkSync('.github/workflows/ru-copy-one-shot.yml');
fs.unlinkSync('scripts/ru-copy-patch.cjs');
console.log('RU copy patched; temporary runner removed');
