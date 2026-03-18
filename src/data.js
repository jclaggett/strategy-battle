// ── Data Layer — loads from data.json, exposes globals ──────────────
// DATA is populated by loadGameData() before Phaser starts.

let ATTACKS = {};
let ROSTER = {};
let PLAYER_ACTIONS = {};
let STAT_POINTS = 50;
let STAT_MAX_PER = 20;
let MAX_PLAYER_HP = 6;
let PLAYER_ACTION_SLOTS = 3;
let ALLOCATABLE_STATS = ['atk', 'def', 'mAtk', 'mDef', 'spd'];
let STAT_LABELS = { atk: 'ATK', def: 'DEF', mAtk: 'MAG', mDef: 'RES', spd: 'SPD' };

async function loadGameData() {
  const resp = await fetch('src/data.json?v=' + Date.now());
  const data = await resp.json();

  ATTACKS = data.attacks;
  ROSTER = data.roster;
  PLAYER_ACTIONS = data.playerActions;

  const cfg = data.config;
  STAT_POINTS = cfg.statPoints;
  STAT_MAX_PER = cfg.statMaxPer;
  MAX_PLAYER_HP = cfg.maxPlayerHp;
  PLAYER_ACTION_SLOTS = cfg.playerActionSlots;
  ALLOCATABLE_STATS = cfg.allocatableStats;
  STAT_LABELS = cfg.statLabels;
}

// ── Formulas (kept in JS — they need logic) ─────────────────────────

function stageMultiplier(stage) {
  if (stage >= 0) return 1 + 0.5 * stage;
  return 1 / (1 + 0.5 * Math.abs(stage));
}

function effectiveStat(char, stat) {
  const base = char[stat];
  const stage = (char.stages && char.stages[stat]) || 0;
  return Math.round(base * stageMultiplier(stage));
}

function calcDamage(attack, attacker, defender) {
  const atk = ATTACKS[attack];
  if (atk.type === 'heal') {
    return -Math.round(atk.power * (effectiveStat(attacker, 'mAtk') / 30));
  }
  if (atk.type === 'status' || atk.type === 'protect') {
    return 0;
  }
  const offense = atk.type === 'physical' ? effectiveStat(attacker, 'atk') : effectiveStat(attacker, 'mAtk');
  const defense = atk.type === 'physical' ? effectiveStat(defender, 'def') : effectiveStat(defender, 'mDef');
  return Math.max(1, Math.round(atk.power * (offense / defense)));
}

// Player action attack damage — uses fixed stats from the action definition
function calcPlayerActionDamage(actionDef, defender) {
  const offense = actionDef.offenseBase;
  const defStat = actionDef.offenseStat === 'atk' ? 'def' : 'mDef';
  const defense = effectiveStat(defender, defStat);
  return Math.max(1, Math.round(actionDef.power * (offense / defense)));
}
