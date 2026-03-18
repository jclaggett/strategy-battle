// ── Team Builder Scene ──────────────────────────────────────────────
class TeamBuilderScene extends Phaser.Scene {
  constructor() {
    super('TeamBuilderScene');
  }

  init() {
    this.currentPlayer = 1;
    this.step = 'pickChar';   // 'pickChar' | 'pickAttacks' | 'allocStats' | 'pickPlayerActions'
    this.p1Picks = [];
    this.p2Picks = [];
    this.p1PlayerActions = [];
    this.p2PlayerActions = [];
    this.currentCharKey = null;
    this.selectedAttacks = [];
    this.selectedPlayerActions = [];
    this.statAlloc = {};
    this.usedKeys = new Set();
    this.buttons = [];
    this.playerActionsDrafted = { 1: false, 2: false };
  }

  get currentPicks() { return this.currentPlayer === 1 ? this.p1Picks : this.p2Picks; }
  get pointsUsed() { return Object.values(this.statAlloc).reduce((a, b) => a + b, 0); }
  get pointsLeft() { return STAT_POINTS - this.pointsUsed; }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);
    this.titleText = this.add.text(W / 2, 20, '', { fontSize: '20px', fill: '#e94560', fontFamily: 'monospace' }).setOrigin(0.5, 0);
    this.subtitleText = this.add.text(W / 2, 48, '', { fontSize: '13px', fill: '#aaa', fontFamily: 'monospace' }).setOrigin(0.5, 0);
    this.infoText = this.add.text(W / 2, H - 30, '', { fontSize: '11px', fill: '#666', fontFamily: 'monospace' }).setOrigin(0.5, 0.5);

    // Start with player action selection
    this.showPlayerActionSelect();
  }

  clearButtons() {
    this.buttons.forEach(b => b.destroy());
    this.buttons = [];
  }

  // ── Player Action Selection ────────────────────────────────────
  showPlayerActionSelect() {
    this.clearButtons();
    this.step = 'pickPlayerActions';
    const W = this.scale.width;
    const H = this.scale.height;
    const accent = this.currentPlayer === 1 ? '#53a8b6' : '#e94560';

    this.titleText.setText(`Player ${this.currentPlayer} — Pick Your Actions`);
    this.subtitleText.setText(`Choose ${PLAYER_ACTION_SLOTS} player actions (${this.selectedPlayerActions.length}/${PLAYER_ACTION_SLOTS}). Pass is always available.`);

    // Get all selectable player actions (exclude 'none'/pass — it's always available)
    const actionKeys = Object.keys(PLAYER_ACTIONS).filter(k => k !== 'none');
    const startY = 95;

    actionKeys.forEach((key, i) => {
      const pa = PLAYER_ACTIONS[key];
      const by = startY + i * 52;
      const isSelected = this.selectedPlayerActions.includes(key);

      const bg = this.add.rectangle(W / 2, by, 550, 42, isSelected ? 0x1a4a1a : 0x16213e)
        .setStrokeStyle(1, isSelected ? 0x4ade80 : 0x333333)
        .setInteractive({ useHandCursor: true });

      let label = `${pa.name}`;
      if (pa.cooldown > 0) label += `  [CD: ${pa.cooldown} turns]`;
      if (pa.power) label += `  Pow: ${pa.power}`;
      if (pa.offenseBase) {
        const statName = STAT_LABELS[pa.offenseStat] || pa.offenseStat;
        label += `  ${statName}: ${pa.offenseBase}`;
      }
      if (pa.range === 'long') label += '  🎯';

      const txt = this.add.text(W / 2, by - 6, label, { fontSize: '12px', fill: isSelected ? '#4ade80' : '#ccc', fontFamily: 'monospace' }).setOrigin(0.5);
      const descT = this.add.text(W / 2, by + 12, pa.description, { fontSize: '9px', fill: '#888', fontFamily: 'monospace' }).setOrigin(0.5);

      bg.on('pointerdown', () => {
        if (isSelected) {
          this.selectedPlayerActions = this.selectedPlayerActions.filter(a => a !== key);
        } else if (this.selectedPlayerActions.length < PLAYER_ACTION_SLOTS) {
          this.selectedPlayerActions.push(key);
        }
        this.showPlayerActionSelect();
      });

      this.buttons.push(bg, txt, descT);
    });

    // Confirm button
    if (this.selectedPlayerActions.length === PLAYER_ACTION_SLOTS) {
      const confirmBg = this.add.rectangle(W / 2, H - 60, 220, 40, 0x166534).setStrokeStyle(2, 0x4ade80).setInteractive({ useHandCursor: true });
      const confirmTxt = this.add.text(W / 2, H - 60, '✓ Pick Characters →', { fontSize: '16px', fill: '#4ade80', fontFamily: 'monospace' }).setOrigin(0.5);
      confirmBg.on('pointerover', () => confirmBg.setFillStyle(0x22c55e));
      confirmBg.on('pointerout', () => confirmBg.setFillStyle(0x166534));
      confirmBg.on('pointerdown', () => {
        if (this.currentPlayer === 1) {
          this.p1PlayerActions = [...this.selectedPlayerActions];
        } else {
          this.p2PlayerActions = [...this.selectedPlayerActions];
        }
        this.playerActionsDrafted[this.currentPlayer] = true;
        this.showCharacterSelect();
      });
      this.buttons.push(confirmBg, confirmTxt);
    }

    this.infoText.setText('Pass is always free and has no cooldown.');
  }

  // ── Character Selection ────────────────────────────────────────
  showCharacterSelect() {
    this.clearButtons();
    this.step = 'pickChar';
    const W = this.scale.width;
    const picked = this.currentPicks.length;
    const accent = this.currentPlayer === 1 ? '#53a8b6' : '#e94560';

    this.titleText.setText(`Player ${this.currentPlayer} — Pick Character ${picked + 1} of 3`);
    this.subtitleText.setText('Choose a character for your team');

    const keys = Object.keys(ROSTER).filter(k => !this.usedKeys.has(k));
    const cols = Math.min(keys.length, 4);
    const startX = W / 2 - (cols - 1) * 95;

    keys.forEach((key, i) => {
      const char = ROSTER[key];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = startX + col * 190;
      const by = 110 + row * 160;

      const card = this.add.rectangle(bx, by, 170, 140, 0x16213e).setStrokeStyle(1, 0x333333).setInteractive({ useHandCursor: true });
      const nameT = this.add.text(bx, by - 50, char.name, { fontSize: '15px', fill: accent, fontFamily: 'monospace' }).setOrigin(0.5);
      const statsStr = `HP ${char.hp}  ATK ${char.atk}  DEF ${char.def}\nMAG ${char.mAtk}  RES ${char.mDef}  SPD ${char.spd}`;
      const statsT = this.add.text(bx, by - 15, statsStr, { fontSize: '10px', fill: '#888', fontFamily: 'monospace', align: 'center' }).setOrigin(0.5);
      const poolNames = char.pool.map(a => ATTACKS[a].name).join(', ');
      const poolT = this.add.text(bx, by + 30, poolNames, { fontSize: '9px', fill: '#555', fontFamily: 'monospace', align: 'center', wordWrap: { width: 160 } }).setOrigin(0.5);

      card.on('pointerover', () => card.setStrokeStyle(2, parseInt(accent.replace('#', ''), 16)));
      card.on('pointerout', () => card.setStrokeStyle(1, 0x333333));
      card.on('pointerdown', () => {
        this.currentCharKey = key;
        this.selectedAttacks = [];
        this.showAttackSelect();
      });

      this.buttons.push(card, nameT, statsT, poolT);
    });

    const pickNames = this.currentPicks.map(p => ROSTER[p.key].name).join(', ');
    this.infoText.setText(picked > 0 ? `Team so far: ${pickNames}` : '');
  }

  // ── Attack Selection ───────────────────────────────────────────
  showAttackSelect() {
    this.clearButtons();
    this.step = 'pickAttacks';
    const W = this.scale.width;
    const H = this.scale.height;
    const char = ROSTER[this.currentCharKey];
    const accent = this.currentPlayer === 1 ? '#53a8b6' : '#e94560';

    this.titleText.setText(`Player ${this.currentPlayer} — Attacks for ${char.name}`);
    this.subtitleText.setText(`Pick 3 attacks (${this.selectedAttacks.length}/3 selected)`);

    const statsSummary = this.add.text(W / 2, 80, `HP ${char.hp}  ATK ${char.atk}  DEF ${char.def}  MAG ${char.mAtk}  RES ${char.mDef}  SPD ${char.spd}`, {
      fontSize: '11px', fill: '#888', fontFamily: 'monospace'
    }).setOrigin(0.5);
    this.buttons.push(statsSummary);

    const pool = char.pool;
    const startY = 115;

    pool.forEach((atkKey, i) => {
      const atk = ATTACKS[atkKey];
      const by = startY + i * 48;
      const isSelected = this.selectedAttacks.includes(atkKey);

      const bg = this.add.rectangle(W / 2, by, 550, 38, isSelected ? 0x1a4a1a : 0x16213e)
        .setStrokeStyle(1, isSelected ? 0x4ade80 : 0x333333)
        .setInteractive({ useHandCursor: true });

      let label = `${atk.name}  [${atk.type.toUpperCase()}]`;
      if (atk.power > 0) label += `  Pow: ${atk.power}`;
      if (atk.spread) label += '  🌊';
      if (atk.range === 'long') label += '  🎯';
      if (atk.statFx) {
        const fxStr = atk.statFx.map(fx => {
          const dir = fx.stages > 0 ? '↑' : '↓';
          const tgt = fx.target === 'self' ? 'self' : 'enemy';
          return `${STAT_LABELS[fx.stat] || fx.stat}${dir} (${tgt})`;
        }).join(', ');
        label += `  ${fxStr}`;
      }
      label += `  — ${atk.description}`;

      const txt = this.add.text(W / 2, by, label, { fontSize: '11px', fill: isSelected ? '#4ade80' : '#ccc', fontFamily: 'monospace' }).setOrigin(0.5);

      bg.on('pointerdown', () => {
        if (isSelected) {
          this.selectedAttacks = this.selectedAttacks.filter(a => a !== atkKey);
        } else if (this.selectedAttacks.length < 3) {
          this.selectedAttacks.push(atkKey);
        }
        this.showAttackSelect();
      });

      this.buttons.push(bg, txt);
    });

    if (this.selectedAttacks.length === 3) {
      const confirmBg = this.add.rectangle(W / 2, H - 70, 200, 40, 0x166534).setStrokeStyle(2, 0x4ade80).setInteractive({ useHandCursor: true });
      const confirmTxt = this.add.text(W / 2, H - 70, '✓ Pick Stats →', { fontSize: '16px', fill: '#4ade80', fontFamily: 'monospace' }).setOrigin(0.5);
      confirmBg.on('pointerover', () => confirmBg.setFillStyle(0x22c55e));
      confirmBg.on('pointerout', () => confirmBg.setFillStyle(0x166534));
      confirmBg.on('pointerdown', () => {
        this.statAlloc = {};
        ALLOCATABLE_STATS.forEach(s => this.statAlloc[s] = 0);
        this.showStatAlloc();
      });
      this.buttons.push(confirmBg, confirmTxt);
    }

    const backBg = this.add.rectangle(80, H - 70, 120, 36, 0x333333).setStrokeStyle(1, 0x555555).setInteractive({ useHandCursor: true });
    const backTxt = this.add.text(80, H - 70, '← Back', { fontSize: '13px', fill: '#aaa', fontFamily: 'monospace' }).setOrigin(0.5);
    backBg.on('pointerdown', () => this.showCharacterSelect());
    this.buttons.push(backBg, backTxt);

    this.infoText.setText('');
  }

  // ── Stat Allocation ────────────────────────────────────────────
  showStatAlloc() {
    this.clearButtons();
    this.step = 'allocStats';
    const W = this.scale.width;
    const H = this.scale.height;
    const char = ROSTER[this.currentCharKey];
    const accent = this.currentPlayer === 1 ? '#53a8b6' : '#e94560';

    this.titleText.setText(`Player ${this.currentPlayer} — ${char.name} Stat Points`);
    this.subtitleText.setText(`${this.pointsLeft} / ${STAT_POINTS} points remaining  (max ${STAT_MAX_PER} per stat)`);

    const startY = 110;
    const rowH = 60;

    ALLOCATABLE_STATS.forEach((stat, i) => {
      const by = startY + i * rowH;
      const base = char[stat];
      const bonus = this.statAlloc[stat];
      const total = base + bonus;

      const label = this.add.text(W * 0.15, by, `${STAT_LABELS[stat]}`, { fontSize: '16px', fill: accent, fontFamily: 'monospace' }).setOrigin(0, 0.5);
      const baseT = this.add.text(W * 0.3, by, `${base}`, { fontSize: '14px', fill: '#888', fontFamily: 'monospace' }).setOrigin(0.5);

      const minusBg = this.add.rectangle(W * 0.42, by, 36, 36, bonus > 0 ? 0x5c2a2a : 0x222222)
        .setStrokeStyle(1, bonus > 0 ? 0xe94560 : 0x333333);
      const minusT = this.add.text(W * 0.42, by, '−', { fontSize: '20px', fill: bonus > 0 ? '#e94560' : '#555', fontFamily: 'monospace' }).setOrigin(0.5);
      if (bonus > 0) {
        minusBg.setInteractive({ useHandCursor: true });
        minusBg.on('pointerdown', () => { this.statAlloc[stat]--; this.showStatAlloc(); });
      }

      const bonusColor = bonus > 0 ? '#4ade80' : '#666';
      const bonusT = this.add.text(W * 0.52, by, `+${bonus}`, { fontSize: '16px', fill: bonusColor, fontFamily: 'monospace' }).setOrigin(0.5);

      const canAdd = bonus < STAT_MAX_PER && this.pointsLeft > 0;
      const plusBg = this.add.rectangle(W * 0.62, by, 36, 36, canAdd ? 0x1a4a1a : 0x222222)
        .setStrokeStyle(1, canAdd ? 0x4ade80 : 0x333333);
      const plusT = this.add.text(W * 0.62, by, '+', { fontSize: '20px', fill: canAdd ? '#4ade80' : '#555', fontFamily: 'monospace' }).setOrigin(0.5);
      if (canAdd) {
        plusBg.setInteractive({ useHandCursor: true });
        plusBg.on('pointerdown', () => { this.statAlloc[stat]++; this.showStatAlloc(); });
      }

      const totalT = this.add.text(W * 0.75, by, `= ${total}`, { fontSize: '16px', fill: '#fff', fontFamily: 'monospace' }).setOrigin(0, 0.5);

      const barW = 100;
      const basePct = Math.min(base / 80, 1);
      const totalPct = Math.min(total / 80, 1);
      const barBg = this.add.rectangle(W * 0.88, by, barW, 12, 0x222222);
      const barBase = this.add.rectangle(W * 0.88 - barW / 2 + (barW * basePct) / 2, by, barW * basePct, 12, 0x333333);
      const barTotal = this.add.rectangle(W * 0.88 - barW / 2 + (barW * totalPct) / 2, by, barW * totalPct, 10, bonus > 0 ? 0x4ade80 : 0x53a8b6).setAlpha(0.7);

      this.buttons.push(label, baseT, minusBg, minusT, bonusT, plusBg, plusT, totalT, barBg, barBase, barTotal);
    });

    const confirmBg = this.add.rectangle(W / 2, H - 60, 200, 40, 0x166534).setStrokeStyle(2, 0x4ade80).setInteractive({ useHandCursor: true });
    const confirmTxt = this.add.text(W / 2, H - 60, '✓ Confirm', { fontSize: '16px', fill: '#4ade80', fontFamily: 'monospace' }).setOrigin(0.5);
    confirmBg.on('pointerover', () => confirmBg.setFillStyle(0x22c55e));
    confirmBg.on('pointerout', () => confirmBg.setFillStyle(0x166534));
    confirmBg.on('pointerdown', () => this.confirmCharacter());
    this.buttons.push(confirmBg, confirmTxt);

    const backBg = this.add.rectangle(80, H - 60, 120, 36, 0x333333).setStrokeStyle(1, 0x555555).setInteractive({ useHandCursor: true });
    const backTxt = this.add.text(80, H - 60, '← Back', { fontSize: '13px', fill: '#aaa', fontFamily: 'monospace' }).setOrigin(0.5);
    backBg.on('pointerdown', () => this.showAttackSelect());
    this.buttons.push(backBg, backTxt);

    this.infoText.setText('');
  }

  // ── Confirm & Advance ──────────────────────────────────────────
  confirmCharacter() {
    this.currentPicks.push({
      key: this.currentCharKey,
      attacks: [...this.selectedAttacks],
      bonuses: { ...this.statAlloc },
    });
    this.usedKeys.add(this.currentCharKey);

    if (this.currentPicks.length < 3) {
      this.showCharacterSelect();
    } else if (this.currentPlayer === 1) {
      this.currentPlayer = 2;
      this.selectedPlayerActions = [];
      this.showPlayerActionSelect();
    } else {
      this.scene.start('BattleScene', {
        p1Picks: this.p1Picks,
        p2Picks: this.p2Picks,
        p1PlayerActions: this.p1PlayerActions,
        p2PlayerActions: this.p2PlayerActions,
      });
    }
  }
}
