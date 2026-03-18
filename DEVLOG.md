# Strategy Battle — Dev Log

## 2026-03-16 — Session with Caleb Claggett

### Project Overview
- Phaser 3 browser game, turn-based strategy battle (hotseat 2-player)
- Located at `projects/strategy-game/`
- Served via Cloudflare tunnel for remote access

### Architecture
- `index.html` — entry point, loads Phaser + game scripts
- `src/data.js` — attack definitions, roster, damage formulas
- `src/TeamBuilderScene.js` — character/attack draft screen
- `src/BattleScene.js` — main battle logic
- `src/main.js` — Phaser config, scene list

### Features Built Today

**Team Builder (new)**
- Players draft from a roster of 8 characters: Knight, Mage, Cleric, Rogue, Warlock, Paladin, Ranger, Sorcerer
- Each player picks 3 characters (no duplicates between players)
- For each character, pick 3 attacks from their available pool (5-6 options each)
- Player 1 drafts first, then Player 2

**Switching (new)**
- Players can switch their active character instead of attacking
- Switches resolve before any attacks in the round
- Forced swap when active character is KO'd
- Green "⇄ Switch" button appears alongside attack options

**Existing Battle System**
- Turn-based hotseat (P1 picks, then P2, then round resolves)
- Speed stat determines attack order
- Physical attacks scale with ATK/DEF, magic with MAG/RES
- Healing scales with caster's MAG
- Team dots show alive/KO'd status
- Game over → click to restart back at team builder

### Attack Types
- Physical: Slash, Heavy Strike, Quick Slash, Shield Bash, Backstab, Cleave, Hamstring
- Magic: Fireball, Ice Spear, Thunder, Dark Pulse, Holy Smite, Arcane Blast
- Heal: Heal, Prayer

### Hosting Notes
- Python HTTP server on port 8081
- Cloudflare tunnel (`cloudflared`) for external access
- Browser caching can be an issue — hard refresh (Ctrl+Shift+R) after updates

**Stat Allocation (new)**
- After picking attacks, players allocate 50 bonus points across ATK, DEF, MAG, RES, SPD
- Max 20 points per stat
- Visual +/− buttons with bar display

**Stat Buff/Debuff Moves (new)**
- Status-only moves: War Cry, Iron Wall, Meditate, Focus, Quicken (self buffs); Intimidate, Expose, Hex (enemy debuffs)
- Some combat moves have secondary stat effects: Shield Bash (SPD↓), Hamstring (SPD↓), Dark Pulse (RES↓)
- Stacking: +1→×1.5, +2→×2.0, +3→×2.5; -1→×0.67, -2→×0.5, -3→×0.4
- Battle UI shows arrows (↑↓) on modified stats
- Switch menu shows active buffs/debuffs on benched characters

## 2026-03-18 — Session with Caleb Claggett

### Player HP System
- Each player has a health pool of 6 HP (pips displayed at top of screen)
- Player HP is reduced by:
  1. **KO penalty** — lose 1 player HP when a character is KO'd
  2. **Long-range attacks** — Ice Spear, Holy Smite, Arcane Blast can target the player directly (1 HP) instead of the opposing character
  3. **Spread attacks** — Fireball, Thunder hit the opposing character AND deal 1 HP to the opposing player
- **Win conditions**: KO all 3 enemy characters OR reduce opponent's player HP to 0

### Player Actions (new action each turn alongside character move)
- **Block** — absorbs 1 point of incoming player damage (used up after absorbing)
- **Heal** — restore 1 player HP (max 6)
- **Strike** — deal 1 player HP damage directly to opponent
- **Pass** — do nothing

### Protect Move (character move)
- Knight, Cleric, Paladin can pick `Protect` from their pool
- Absorbs 1 incoming player damage this turn (similar to block, from the character side)
- Uses the character's action for the turn (no attack/switch)

### Turn Flow (updated)
1. Player picks their personal action (Block/Heal/Strike/Pass)
2. Player picks their character's action (Attack/Switch)
3. Repeat for Player 2
4. Round resolves: player actions → switches → attacks (by speed)

### Data Externalized to JSON
- All character data, attacks, and player actions now live in `src/data.json`
- `data.js` loads from JSON at startup, formulas remain in JS
- Easy to tweak numbers without touching code

### Player Action Drafting
- Before picking characters, each player selects 3 player actions from a pool
- Pass is always free (no cooldown, always available)
- Available actions:
  - 🛡 Block (CD: 2) — absorb 1 player HP damage
  - 💚 Heal (CD: 2) — restore 1 player HP
  - ⚔ Strike (CD: 1) — deal 1 player HP to opponent
  - 🗡 Slash (CD: 2) — 20 power / 30 ATK physical hit on enemy character
  - ✨ Blast (CD: 2) — 20 power / 30 MAG magic hit on enemy character
  - 🏹 Shot (CD: 2) — 10 power / 30 ATK, can target character or player (1 HP)

### Cooldown System
- Player actions have cooldowns (turns before reuse)
- Cooldowns tick down at end of each round
- Greyed-out actions show remaining cooldown turns
- Pass always available with no cooldown

### Attack Tags
- 🌊 Spread: Fireball, Thunder
- 🎯 Long-range: Ice Spear, Holy Smite, Arcane Blast

### Ideas / Future Work
- Visual upgrades (sprites, animations, effects)
- More characters and attacks
- Balance tuning
- AI opponent option
- Sound effects / music
