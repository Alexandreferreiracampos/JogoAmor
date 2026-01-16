/**
 * JOGO PHASER - REORGANIZADO E CORRIGIDO V2
 * -------------------------
 * Ajustes realizados:
 * 1. Player para de andar ao enviar mensagem.
 * 2. Troca automática para a personagem 'ela' após o envio.
 * 3. Personagem 'ela' torna-se visível novamente.
 * 4. Sistema de recebimento de mensagem ajustado para a Ana.
 */

// --- 1. CONFIGURAÇÕES E CONSTANTES ---

const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 720,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: { preload, create, update }
};

const FRAMES = {
  ela: {
    down: [61, 65, 69],
    left: [60, 64, 68],
    right: [63, 67, 71],
    up: [62, 66, 70],
    idle: 61
  },
  ele: {
    down: [1, 5, 9],
    left: [0, 4, 8],
    right: [3, 7, 11],
    up: [2, 6, 10],
    idle: 2
  }
};

const direcaoOposta = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left'
};

// --- 2. ESTADO DO JOGO ---

let cursors;
const gameState = {
  personagemAtual: 'ela',
  missaoAtual: 'irParaEscola',
  subMissao: null,
  dialogoAtivo: false,
  conheceu: false,
  temSinal: false,
  sinalAtivo: false,
  temMensagemPendente: false,
  love: 0,

  encontroAtivado: false,
  jogoFinalizado: false // Nova flag para evitar loops no fim
};

new Phaser.Game(config);

// --- 3. FUNÇÕES PRINCIPAIS ---

function preload() {
  this.load.image('tiles', 'assets/tiles.png');
  this.load.tilemapTiledJSON('mapa', 'assets/cidade.json');

  this.load.image('marcadorMissao', 'assets/marcador.png');

  this.load.spritesheet('playerEla', 'assets/personagem.png', {
    frameWidth: 32,
    frameHeight: 32
  });

  this.load.spritesheet('playerEle', 'assets/personagem.png', {
    frameWidth: 32,
    frameHeight: 32
  });

}

function create() {
  // 1. Atalhos de Desenvolvimento
  this.input.keyboard.on('keydown-ONE', () => iniciarMissaoSala.call(this));
  this.input.keyboard.on('keydown-TWO', () => pularParaConversa.call(this));
  this.input.keyboard.on('keydown-THREE', () => iniciarMissaoPizzaria.call(this));
  this.input.keyboard.on('keydown-FOUR', () => pularParaCasa.call(this));
  this.input.keyboard.on('keydown-FIVE', () => pularescola.call(this));

  // 2. Configuração do Mapa (APENAS UMA VEZ)
  const map = this.make.tilemap({ key: 'mapa' });
  const tileset = map.addTilesetImage(map.tilesets[0].name, 'tiles');
  const layer = map.createLayer(0, tileset, 0, 0);
  layer.setCollisionByProperty({ collides: true });

  // 4. Configurações de Mundo e Câmera
  this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  this.cameras.main.setBackgroundColor('#84C669');

  // 5. Inicialização dos Jogadores
  this.playerEla = this.physics.add.sprite(2342, 682, 'playerEla', FRAMES.ela.idle);
  this.playerEle = this.physics.add.sprite(2982, 580, 'playerEle', FRAMES.ele.idle);

  this.playerEla.setCollideWorldBounds(true);
  this.playerEle.setCollideWorldBounds(true);

  this.physics.add.collider(this.playerEla, layer);
  this.physics.add.collider(this.playerEle, layer);

  criarAnimacoes(this);

  // 6. Controles e Câmera
  cursors = this.input.keyboard.createCursorKeys();
  this.cameras.main.startFollow(this.playerEla);

  // 7. Configuração de Zonas e Colisões de Missão
  configurarZonas.call(this);

  this.zonasSinal = [
    criarZonaSinal(this, 2920, 558),
    criarZonaSinal(this, 874, 1042),
    criarZonaSinal(this, 992, 1850),
    criarZonaSinal(this, 52, 1920),
  ];


  // 8. HUD - Coração
  this.hud = {};
  this.hud.x = 20;
  this.hud.y = 20;
  this.hud.width = 200;
  this.hud.height = 20;
  this.hud.bg = this.add.graphics();
  this.hud.fill = this.add.graphics();
  this.hud.bg.setScrollFactor(0);
  this.hud.fill.setScrollFactor(0);

  this.hud.text = this.add.text(20, 45, '❤️ Amor', {
    fontFamily: 'monospace',
    fontSize: '22px',
    fontStyle: 'bold',
    color: '#ffffff'
  });
  this.hud.text.setScrollFactor(0);

  // 9. Inicialização de UI
  atualizarHud.call(this);
  inicializarHudSinal(this);
  criarDialogo.call(this);

  atualizarMarcadorMissao.call(this);

  inicializarTextoObjetivo(this);
  mostrarObjetivo.call(this, "Vá até a escola", 4000);

}

function inicializarTextoObjetivo(scene) {
  scene.textoObjetivo = scene.add.text(scene.cameras.main.centerX, 80, '', {
    fontSize: '28px',
    fontStyle: 'bold',
    color: '#ffffff',
    backgroundColor: '#00000088',
    padding: { x: 15, y: 8 },
    align: 'center'
  })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(10000)
    .setAlpha(0);
}

function mostrarObjetivo(mensagem, duracao = 3000) {
  if (!this.textoObjetivo) return;

  this.textoObjetivo.setText(`🎯 OBJETIVO: ${mensagem}`);

  // Animação de Fade In
  this.tweens.add({
    targets: this.textoObjetivo,
    alpha: 1,
    duration: 500,
    onComplete: () => {
      if (duracao > 0) {
        this.time.delayedCall(duracao, () => {
          this.tweens.add({ targets: this.textoObjetivo, alpha: 0, duration: 500 });
        });
      }
    }
  });
}


function update() {
  if (gameState.dialogoAtivo) return;

  // 1. Identificar quem é quem
  const player = getPersonagemAtivo(this);
  const npc = getNpc(this);

  // 2. Definir o tipo do NPC para as animações
  const tipoNpc = gameState.personagemAtual === 'ela' ? 'ele' : 'ela';
  const speed = 120;

  // Atualizar Status de Sinal
  atualizarStatusSinal(this);

  if (gameState.dialogoAtivo) return;

  // 3. Lógica de Seguimento
  const missoesDeSeguir = ['levarParaCasa', 'irPizzaria', 'elaSegueEle'];

  if (npc && (missoesDeSeguir.includes(gameState.missaoAtual) || missoesDeSeguir.includes(gameState.subMissao))) {
    const distancia = Phaser.Math.Distance.Between(npc.x, npc.y, player.x, player.y);

    if (distancia > 30) {
      this.physics.moveToObject(npc, player, 110);

      const dx = player.x - npc.x;
      const dy = player.y - npc.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        npc.anims.play(`${tipoNpc}-${dx > 0 ? 'right' : 'left'}`, true);
      } else {
        npc.anims.play(`${tipoNpc}-${dy > 0 ? 'down' : 'up'}`, true);
      }
    } else {
      npc.setVelocity(0);
      npc.anims.stop();
    }
  }

  // 4. Movimentação do Jogador Ativo
  player.setVelocity(0);

  if (cursors.left.isDown) {
    player.setVelocityX(-speed);
    player.anims.play(`${gameState.personagemAtual}-left`, true);
    player.direction = 'left';
  } else if (cursors.right.isDown) {
    player.setVelocityX(speed);
    player.anims.play(`${gameState.personagemAtual}-right`, true);
    player.direction = 'right';
  } else if (cursors.up.isDown) {
    player.setVelocityY(-speed);
    player.anims.play(`${gameState.personagemAtual}-up`, true);
    player.direction = 'up';
  } else if (cursors.down.isDown) {
    player.setVelocityY(speed);
    player.anims.play(`${gameState.personagemAtual}-down`, true);
    player.direction = 'down';
  } else {
    player.anims.stop();
  }

  // 5. Ajuste de Profundidade (Y-sorting)
  this.playerEla.setDepth(this.playerEla.y);
  this.playerEle.setDepth(this.playerEle.y);

  console.log(
    `${Math.floor(this.playerEla.x)}, ${Math.floor(this.playerEla.y)}`
  );
}


// --- SISTEMA DE SINAL ---
function inicializarHudSinal(scene) {
  scene.hudSinal = scene.add.text(scene.cameras.main.width - 20, 20, '❌ Sem sinal', {
    fontSize: '24px', fontStyle: 'bold', color: '#ff4d4d', backgroundColor: '#00000088', padding: { x: 10, y: 5 }
  }).setOrigin(1, 0).setScrollFactor(0).setDepth(10000);

  scene.notificacaoMsg = scene.add.text(scene.cameras.main.width - 20, 60, '📩 Nova Mensagem!', {
    fontSize: '20px', fontStyle: 'bold', color: '#ffff00', backgroundColor: '#000000aa', padding: { x: 10, y: 5 }
  }).setOrigin(1, 0).setScrollFactor(0).setDepth(10000).setVisible(false);
}

function atualizarStatusSinal(scene) {
  const player = getPersonagemAtivo(scene);
  let temSinalAgora = false;

  scene.zonasSinal.forEach(zona => {
    if (scene.physics.overlap(player, zona)) temSinalAgora = true;
  });

  gameState.sinalAtivo = temSinalAgora;

  if (temSinalAgora) {
    scene.hudSinal.setText('📶 Sinal').setColor('#00ff00');
    // Se a personagem atual for 'ela' e houver mensagem pendente, notifica
    if (gameState.temMensagemPendente && gameState.personagemAtual === 'ela') {
      scene.notificacaoMsg.setVisible(true);
      verificarMensagemMissao.call(scene);
    }
  } else {
    scene.hudSinal.setText('❌ Sem sinal').setColor('#ff4d4d');
    scene.notificacaoMsg.setVisible(false);
  }
}

function criarZonaSinal(scene, x, y, largura = 230, altura = 230) {
  const zona = scene.add.zone(x, y, largura, altura);
  scene.physics.world.enable(zona);
  zona.body.setAllowGravity(false);
  zona.body.setImmovable(true);
  return zona;
}

// --- 4. SISTEMA DE DIÁLOGOS ---

function criarDialogo() {
  this.dialogo = {};
  const largura = this.cameras.main.width - 40;
  const altura = 120;
  const x = 20;
  const y = this.cameras.main.height - altura - 20;

  this.dialogo.bg = this.add.graphics()
    .fillStyle(0x000000, 0.8)
    .fillRoundedRect(x, y, largura, altura, 10)
    .setScrollFactor(0)
    .setDepth(9999)
    .setVisible(false);

  this.dialogo.nome = this.add.text(x + 20, y + 10, '', {
    fontSize: '30px',
    fontStyle: 'bold',
    color: '#ffd166'
  }).setScrollFactor(0).setDepth(10000).setVisible(false);

  this.dialogo.texto = this.add.text(x + 20, y + 35, '', {
    fontSize: '30px',
    wordWrap: { width: largura - 40 }
  }).setScrollFactor(0).setDepth(10000).setVisible(false);

  this.input.keyboard.on('keydown-SPACE', () => {
    if (gameState.dialogoAtivo) avancarDialogo.call(this);
  });
}

function iniciarDialogo(falas, aoFinal = null) {
  if (!falas || falas.length === 0) return;

  gameState.dialogoAtivo = true;
  this.dialogo.falas = falas;
  this.dialogo.indice = 0;
  this.dialogo.aoFinal = aoFinal;
  pararPersonagens.call(this);
  this.dialogo.bg.setVisible(true);
  this.dialogo.nome.setVisible(true);
  this.dialogo.texto.setVisible(true);

  exibirFala.call(this);
}

function exibirFala() {
  const fala = this.dialogo.falas[this.dialogo.indice];
  this.dialogo.nome.setText(fala.nome);
  this.dialogo.texto.setText('');

  let i = 0;
  if (this.dialogo.timer) this.dialogo.timer.remove();

  this.dialogo.timer = this.time.addEvent({
    delay: 30,
    repeat: fala.texto.length - 1,
    callback: () => {
      this.dialogo.texto.setText(fala.texto.substring(0, i + 1));
      i++;
    }
  });
}

function avancarDialogo() {
  // Se ainda estiver digitando, mostra o texto completo
  const falaAtual = this.dialogo.falas[this.dialogo.indice];
  if (this.dialogo.texto.text.length < falaAtual.texto.length) {
    this.dialogo.timer.remove();
    this.dialogo.texto.setText(falaAtual.texto);
    return;
  }

  this.dialogo.indice++;
  if (this.dialogo.indice < this.dialogo.falas.length) {
    exibirFala.call(this);
  } else {
    finalizarDialogo.call(this);
  }
}

function finalizarDialogo() {
  gameState.dialogoAtivo = false;
  this.dialogo.bg.setVisible(false);
  this.dialogo.nome.setVisible(false);
  this.dialogo.texto.setVisible(false);

  if (this.dialogo.aoFinal) {
    const callback = this.dialogo.aoFinal;
    this.dialogo.aoFinal = null;
    callback.call(this);
  }
}

// --- 5. SISTEMA DE MISSÕES E EVENTOS ---

function configurarZonas() {
  // Zona Escola
  this.zonaEscola = this.add.zone(2930, 450, 200, 10);
  this.physics.world.enable(this.zonaEscola);
  this.zonaEscola.body.setAllowGravity(false);

  this.physics.add.overlap(this.playerEla, this.zonaEscola, () => {
    if (gameState.missaoAtual === 'irParaEscola') trocarParaEle.call(this);
  });

  // Zona Sala
  this.zonaSala = this.add.zone(2930, 290, 64, 64);
  this.physics.world.enable(this.zonaSala);
  this.zonaSala.body.setAllowGravity(false);

  this.physics.add.overlap(this.playerEle, this.zonaSala, () => {
    if (gameState.missaoAtual === 'irParaSala' && gameState.subMissao === 'eleVai') {
      eleChegouNaSala.call(this);
    }
  });

  this.physics.add.overlap(this.playerEla, this.zonaSala, () => {
    if (gameState.missaoAtual === 'irParaSala' && gameState.subMissao === 'elaVai') {
      ambosNaSala.call(this);
    }
  });

  // Zona Pizzaria
  this.zonaPizzaria = this.add.zone(2364, 660, 40, 20);
  this.physics.world.enable(this.zonaPizzaria);
  this.zonaPizzaria.body.setAllowGravity(false);

  this.physics.add.overlap(this.playerEla, this.zonaPizzaria, () => {
    if (gameState.missaoAtual === 'irPizzaria' && gameState.subMissao === 'elaSegueEle' && !gameState.dialogoAtivo) {
      iniciarDialogoPizza.call(this);
    }
  });

  // Zona Casa da Ana
  this.zonaCasa = this.add.zone(520, 1892, 100, 100);
  this.physics.world.enable(this.zonaCasa);
  this.zonaCasa.body.setAllowGravity(false);


  this.physics.add.overlap(this.playerEle, this.zonaCasa, () => {
    if (gameState.missaoAtual === 'levarParaCasa' && !gameState.dialogoAtivo) {
      chegouNaCasa.call(this);
    }
  });

  // Zona porta casa ana
  this.zonaPortaCasa = this.add.zone(576, 1708, 20, 20);
  this.physics.world.enable(this.zonaPortaCasa);
  this.zonaPortaCasa.body.setAllowGravity(false);

  // Zona enviar mensagem
  this.zonaEnviarMensagem = this.add.zone(2936, 680, 130, 130);
  this.physics.world.enable(this.zonaEnviarMensagem);
  this.zonaEnviarMensagem.body.setAllowGravity(false);

  this.physics.add.overlap(this.playerEle, this.zonaEnviarMensagem, () => {
    if (gameState.missaoAtual === 'enviaMensagem' && !gameState.dialogoAtivo) {
      enviarMensagemAna.call(this);
    }
  });

  // Zona trabalho ana
  this.zonaTrabalhoAna = this.add.zone(2204, 180, 20, 20);
  this.physics.world.enable(this.zonaTrabalhoAna);
  this.zonaTrabalhoAna.body.setAllowGravity(false);

  this.physics.add.overlap(this.playerEla, this.zonaTrabalhoAna, () => {
    if (gameState.missaoAtual === 'irAoTrabalho' && !gameState.dialogoAtivo) {
      iniciarTrabalho.call(this);
    }
  });

  // MARCA NO MAPA
  this.debugZonaCasa = marcarZonaNoMapa(this, this.zonaTrabalhoAna, 0x00ff00);


  // Colisões entre Personagens
  this.physics.add.overlap(this.playerEle, this.playerEla, () => {
    if (gameState.missaoAtual === 'conhecer' && !gameState.encontroAtivado) {
      iniciarEncontro.call(this);
    } else if (gameState.missaoAtual === 'falarComEla' && !gameState.dialogoAtivo) {
      iniciarConvitePizza.call(this);
    }
  });
}

function atualizarMarcadorMissao() {
  if (this.marcadorSprite) {
    this.marcadorSprite.destroy();
    this.marcadorSprite = null;
  }

  let zonaAlvo = null;
  if (gameState.missaoAtual === 'irParaEscola') zonaAlvo = this.zonaEscola;
  else if (gameState.missaoAtual === 'irParaSala') zonaAlvo = this.zonaSala;
  else if (gameState.missaoAtual === 'irPizzaria') zonaAlvo = this.zonaPizzaria;
  else if (gameState.missaoAtual === 'levarParaCasa') zonaAlvo = this.zonaCasa;
  else if (gameState.missaoAtual === 'enviaMensagem') zonaAlvo = this.zonaEnviarMensagem;
  else if (gameState.missaoAtual === 'irAoTrabalho') zonaAlvo = this.zonaTrabalhoAna;

  if (!zonaAlvo) return;

  this.marcadorSprite = this.add.sprite(zonaAlvo.x, zonaAlvo.y - 30, 'marcadorMissao');
  this.marcadorSprite.setDepth(10000);

  this.tweens.add({
    targets: this.marcadorSprite,
    y: zonaAlvo.y - 10,
    duration: 800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
}

function marcarZonaNoMapa(scene, zona, cor = 0xff0000) {
  const g = scene.add.graphics();
  g.lineStyle(2, cor, 1);
  g.strokeRect(zona.x - zona.width / 2, zona.y - zona.height / 2, zona.width, zona.height);
  g.fillStyle(cor, 0.2);
  g.fillRect(zona.x - zona.width / 2, zona.y - zona.height / 2, zona.width, zona.height);
  g.setDepth(5);
  g.setScrollFactor(1);
  return g;
}

function mudarCameraDePlayer(camera, target, scene) {

  gameState.personagemAtual = target === scene.playerEle ? 'ele' : 'ela';
  camera.stopFollow();

  scene.tweens.add({
    targets: camera,
    scrollX: target.x - camera.width / 2,
    scrollY: target.y - camera.height / 2,
    duration: 700,
    ease: 'Sine.easeInOut',
    onComplete: () => {
      camera.startFollow(target, true, 0.06, 0.06);
      target.body.moves = true;
      target.setVisible(true);
    }
  });
}


function trocarParaEle() {

  gameState.missaoAtual = 'conhecer';
  this.playerEla.body.moves = false;
  this.playerEle.body.moves = false;
  pararPersonagens.call(this);
  mudarCameraDePlayer(this.cameras.main, this.playerEle, this);
  mostrarObjetivo.call(this, "Vá falar com a Ana", 2500);
  atualizarMarcadorMissao.call(this);
}

function iniciarEncontro() {
  gameState.encontroAtivado = true;
  gameState.conheceu = true;

  olharUmParaOutro.call(this, getPersonagemAtivo(this), getNpc(this));

  iniciarDialogo.call(this, [
    { nome: 'Ana', texto: 'O que você está olhando?' },
    { nome: 'Alexandre', texto: 'Nada… é que eu achei lindo o seu arquinho.' },
    { nome: 'Ana', texto: 'Obrigada!' },
    { nome: 'Alexandre', texto: 'Prazer, me chamo Alexandre.' },
    { nome: 'Ana', texto: 'Huum… eu sou a Ana Paula.' },
    { nome: 'Alexandre', texto: 'Prazer, Paulinha 😊' },
    { nome: 'Ana', texto: 'Detesto que me chamem de Paulinha 😒' },
    { nome: 'Alexandre', texto: 'Foi mal 🥲' },
    { nome: 'Ana', texto: 'Você é parente do Edinho?' },
    { nome: 'Alexandre', texto: 'Sim, ele é meu tio. Por quê?' },
    { nome: 'Ana', texto: 'Que legal… achei vocês bem parecidos. Quando cheguei, até pensei que fosse ele. Talvez a gente se veja mais por aqui.' },
    { nome: 'Alexandre', texto: 'Então você me viu quando chegou, rsrs' },
    { nome: 'Ana', texto: 'Vi sim, rsrs' },
    { nome: 'Alexandre', texto: 'Já vão começar as aulas! Você está em qual série?' },
    { nome: 'Ana', texto: 'Segundo ano. E você?' },
    { nome: 'Alexandre', texto: 'Que coincidência, eu também! Talvez seja o destino 😍' },
    { nome: 'Ana', texto: 'Sei não, hein… rsrs' },
  ], iniciarMissaoSala);

  gameState.love += 5;
  atualizarHud.call(this);
}

function iniciarMissaoSala() {
  gameState.missaoAtual = 'irParaSala';
  gameState.subMissao = 'eleVai';
  atualizarMarcadorMissao.call(this);
  mostrarObjetivo.call(this, "O Sinal já bateu, vai para sala de aula", 3000);
}

function eleChegouNaSala() {
  gameState.subMissao = 'elaVai';
  this.playerEle.setVelocity(0);
  this.playerEle.anims.stop();
  this.playerEle.setVisible(false);
  mudarCameraDePlayer(this.cameras.main, this.playerEla, this);
}

function ambosNaSala() {
  gameState.subMissao = 'aulaFinalizada';
  pararPersonagens.call(this);
  gameState.missaoAtual = 'null';
  atualizarMarcadorMissao.call(this);
  this.cameras.main.fadeOut(600, 0, 0, 0);
  this.time.delayedCall(650, () => {
    this.cameras.main.fadeIn(1, 0, 0, 0);
    mostrarRelogioAnimado.call(this);
  });
}

function mostrarRelogioAnimado() {
  this.playerEla.setPosition(2964, 734);
  this.playerEle.setPosition(2932, 340);
  this.playerEle.setVisible(true);
  mudarCameraDePlayer(this.cameras.main, this.playerEle, this);

  const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
    .setOrigin(0).setScrollFactor(0).setDepth(9000).setAlpha(1);

  const x = this.scale.width / 2 - 160;
  const y = this.scale.height / 2 - 60;

  const bg = this.add.graphics().fillStyle(0x000000, 0.85).fillRoundedRect(x, y, 320, 120, 16).setScrollFactor(0).setDepth(9100);
  const texto = this.add.text(x + 70, y + 35, '🕒 13:00', { fontSize: '32px', fontStyle: 'bold', color: '#ffffff' })
    .setScrollFactor(0).setDepth(9200);

  let hora = 13;
  this.time.addEvent({
    delay: 600,
    repeat: 4,
    callback: () => {
      hora++;
      texto.setText(`🕒 ${hora}:00`);
    }
  });

  this.time.delayedCall(3500, () => {
    bg.destroy();
    texto.destroy();
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        overlay.destroy();
        finalizarAula.call(this);
      }
    });
  });
}

function finalizarAula() {
  gameState.dialogoAtivo = false;
  gameState.missaoAtual = 'falarComEla';
  gameState.subMissao = null;
  pararEmIdle(this.playerEla, 'ela');
  pararEmIdle(this.playerEle, 'ele');
  mostrarObjetivo.call(this, "Encontre a Ana e a chame para sair", 3000);
}

function iniciarConvitePizza() {
  pararPersonagens.call(this);
  olharUmParaOutro.call(this, getPersonagemAtivo(this), getNpc(this));

  iniciarDialogo.call(this, [
    { nome: 'Alexandre', texto: 'Oi… aula longa, né?' },
    { nome: 'Ana', texto: 'Sério? Nem achei tão ruim assim.' },
    { nome: 'Alexandre', texto: 'É que eu estava com a cabeça em outra coisa… rsrs' },
    { nome: 'Ana', texto: 'Hmmm… em quê?' },
    { nome: 'Alexandre', texto: 'Pensando em chamar alguém que eu gostei muito pra comer uma pizza 😁' },
    { nome: 'Ana', texto: 'E quem seria essa pessoa? Já criou coragem de chamar?' },
    { nome: 'Alexandre', texto: 'Na verdade… acabei de convidar.' },
    { nome: 'Ana', texto: 'Ahhh… então seria eu? kkkkk' },
    { nome: 'Alexandre', texto: 'Quem mais poderia ser?' },
    { nome: 'Alexandre', texto: 'E aí… topa?' },
    { nome: 'Ana', texto: 'Topo sim! Só não posso chegar muito tarde.' },
    { nome: 'Alexandre', texto: 'Prometo te levar cedo para casa. Vamos 😄' }
  ], iniciarMissaoPizzaria);
}

function iniciarMissaoPizzaria() {
  gameState.missaoAtual = 'irPizzaria';
  gameState.subMissao = 'elaSegueEle';
  mudarCameraDePlayer(this.cameras.main, this.playerEle, this);
  atualizarMarcadorMissao.call(this);
  mostrarObjetivo.call(this, "Vá até a pizzaria do Paulo", 2000);
}

function iniciarDialogoPizza() {
  gameState.subMissao = 'comendoPizza';
  gameState.missaoAtual = null;
  atualizarMarcadorMissao.call(this);
  pararPersonagens.call(this);

  this.playerEla.setPosition(2342, 682);
  this.playerEle.setPosition(2384, 682);

  forcarDirecao(this.playerEle, 'ele', 'left');
  forcarDirecao(this.playerEla, 'ela', 'right');

  iniciarDialogo.call(this, [
    { nome: 'Alexandre', texto: 'Bora pedir uma pizza então? 😄 Qual sabor você curte?' },
    { nome: 'Ana', texto: 'Ah, eu gosto de quatro queijos, pizza doce, frango com catupiry… na verdade gosto de quase tudo 😂' },
    { nome: 'Alexandre', texto: 'Boa! Eu gosto de calabresa. Como diz meu amigo Netinho: “pizza de colobreza” 😂🍕' },
    { nome: 'Ana', texto: 'Hahaha! Então fechou: meio calabresa e meio quatro queijos 😋' }
  ], finalizarPizza);
}

function finalizarPizza() {
  gameState.dialogoAtivo = false;
  this.cameras.main.fadeOut(600, 0, 0, 0);
  this.time.delayedCall(650, () => {
    this.cameras.main.fadeIn(1, 0, 0, 0);
    mostrarTextoTempo.call(this);
  });
}

function mostrarTextoTempo() {
  this.playerEla.setPosition(2342, 682);
  this.playerEle.setPosition(2384, 682);
  mudarCameraDePlayer(this.cameras.main, this.playerEla, this);

  const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
    .setOrigin(0).setScrollFactor(0).setDepth(9000).setAlpha(1);

  const x = this.scale.width / 2 - 160;
  const y = this.scale.height / 2 - 60;

  const bg = this.add.graphics().fillStyle(0x000000, 0.85).fillRoundedRect(x, y, 320, 120, 16).setScrollFactor(0).setDepth(9100);
  const texto = this.add.text(x + 65, y + 35, 'Algum tempo depois...', { fontSize: '32px', fontStyle: 'bold', color: '#ffffff' })
    .setScrollFactor(0).setDepth(9200);

  this.time.delayedCall(3500, () => {
    bg.destroy();
    texto.destroy();
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        overlay.destroy();
        iniciarDialogoFinalPizza.call(this);
      }
    });
  });
}

function iniciarDialogoFinalPizza() {
  pararPersonagens.call(this);
  forcarDirecao(this.playerEle, 'ele', 'left');
  forcarDirecao(this.playerEla, 'ela', 'right');

  gameState.love += 5;
  atualizarHud.call(this);

  iniciarDialogo.call(this, [
    { nome: 'Alexandre', texto: 'Nossa, a pizza estava muito boa. Nunca tinha vindo aqui.' },
    { nome: 'Ana', texto: 'Boa mesmo! Você é de onde?' },
    { nome: 'Alexandre', texto: 'Sou de Campo Novo. Na verdade, eu morava em Goiânia, mas faz um ano que me mudei pra cá. Hoje trabalho na Fazenda Bom Jesus.' },
    { nome: 'Ana', texto: 'Ahh, então é por isso que eu nunca tinha te visto por aqui. Eu também morava em Campo Novo, mas me mudei recentemente pra casa da minha mãe.' },
    { nome: 'Alexandre', texto: 'Então era pra gente se encontrar mesmo… não deu certo em Campo Novo, mas acabamos nos conhecendo aqui.' },
    { nome: 'Ana', texto: 'Verdade, né? rsrs' },
    { nome: 'Ana', texto: 'Agora eu preciso ir… minha mãe já deve estar preocupada.' },
    { nome: 'Alexandre', texto: 'Então vamos, eu te levo.' },
    { nome: 'Ana', texto: 'Imagina, não precisa.' },
    { nome: 'Alexandre', texto: 'Eu faço questão. E, no fim das contas, é mais uma desculpa pra ficar um pouco mais com você 😄' },
    { nome: 'Ana', texto: 'Haha, é… então vamos.' }
  ], iniciarMissaoCasa);
}

function iniciarMissaoCasa() {
  gameState.missaoAtual = 'levarParaCasa';
  atualizarMarcadorMissao.call(this);
  gameState.subMissao = null;
  mudarCameraDePlayer(this.cameras.main, this.playerEla, this);
  mostrarObjetivo.call(this, "Volte para a casa.", 3000);
}


function chegouNaCasa() {
  gameState.dialogoAtivo = true;
  pararPersonagens.call(this);
  gameState.missaoAtual = null;
  atualizarMarcadorMissao.call(this);
  this.playerEla.setPosition(520, 1870);
  this.playerEle.setPosition(550, 1870);

  forcarDirecao(this.playerEle, 'ele', 'left');
  forcarDirecao(this.playerEla, 'ela', 'right');

  iniciarDialogo.call(this, [
    { nome: 'Ana', texto: 'Obrigada por me trazer em casa, Alexandre. A noite foi ótima!' },
    { nome: 'Alexandre', texto: 'Gostei muito também, Ana. A gente se vê na escola?' },
    { nome: 'Ana', texto: 'Com certeza! 😊' }
  ], () => {
    mostrarOpcoesConverCasa.call(this);
  });
}

function mostrarOpcoesConverCasa() {
  gameState.dialogoAtivo = true;
  gameState.missaoAtual = 'novaMissao';
  pararPersonagens.call(this);
  forcarDirecao(this.playerEle, 'ele', 'left');
  forcarDirecao(this.playerEla, 'ela', 'right');

  if (this.dialogo) {
    if (this.dialogo.timer) this.dialogo.timer.remove();
    this.dialogo.bg.setVisible(false);
    this.dialogo.nome.setVisible(false);
    this.dialogo.texto.setVisible(false);
    this.dialogo.texto.setText('');
  }

  if (this.botoesOpcoes) {
    this.botoesOpcoes.forEach(b => {
      if (b.bg) b.bg.destroy();
      if (b.txt) b.txt.destroy();
    });
  }
  this.botoesOpcoes = [];

  const opcoes = [
    { texto: 'Pedir o telefone', acao: escolherTelefone },
    { texto: 'Tentar beijá-la', acao: escolherBeijo },
    { texto: 'Dar tchau e ir embora', acao: escolherIrEmbora }
  ];

  const larguraBotao = 400;
  const alturaBotao = 50;
  const espacamento = 20;
  const inicioY = (this.scale.height / 2) - ((opcoes.length * (alturaBotao + espacamento)) / 2);

  opcoes.forEach((opcao, index) => {
    const x = this.scale.width / 2;
    const y = inicioY + index * (alturaBotao + espacamento);

    const bg = this.add.rectangle(x, y, larguraBotao, alturaBotao, 0x000000, 0.8)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(10000);

    const txt = this.add.text(x, y, opcao.texto, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10001);

    bg.on('pointerover', () => bg.setFillStyle(0x444444, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x000000, 0.8));

    bg.on('pointerdown', () => {
      this.botoesOpcoes.forEach(b => { b.bg.destroy(); b.txt.destroy(); });
      this.botoesOpcoes = [];
      opcao.acao.call(this);
    });

    this.botoesOpcoes.push({ bg, txt });
  });
}

function escolherBeijo() {
  iniciarDialogo.call(this, [
    { nome: 'Alexandre', texto: '(Você tenta se aproximar para um beijo)' },
    { nome: 'Ana', texto: 'Ei, calma lá! rsrs. A gente acabou de se conhecer, Alexandre.' },
    { nome: 'Ana', texto: 'Quem sabe em um próximo encontro? 😉' },
    { nome: 'Alexandre', texto: 'Desculpe, acho que me emplguei um pouco rsrsr' },
    { nome: 'Ana', texto: 'Relaxa 😊' }
  ], () => {
    this.time.delayedCall(100, () => { mostrarOpcoesConverCasa.call(this); });
  });
}

function escolherIrEmbora() {
  iniciarDialogo.call(this, [
    { nome: 'Alexandre', texto: 'Vou deixar você entrar. Boa noite, Ana!' },
    { nome: 'Ana', texto: 'Ué, já vai? Você não está esquecendo de me pedir nada não? rsrs' }
  ], () => {
    this.time.delayedCall(100, () => { mostrarOpcoesConverCasa.call(this); });
  });
}

function escolherTelefone() {
  gameState.dialogoAtivo = true;
  mudarCameraDePlayer(this.cameras.main, this.playerEle, this);
  this.playerEle.body.enable = false;

  iniciarDialogo.call(this, [
    { nome: 'Alexandre', texto: 'Gostei muito de te conhecer… será que eu poderia anotar seu telefone?' },
    { nome: 'Ana', texto: 'Claro! Anota aí: 65 996266905. Me manda um “oi” depois, tá?' },
    { nome: 'Ana', texto: 'Talvez eu demore um pouco pra responder, porque o sinal aqui é bem ruim… só funciona em alguns lugares.' },
    { nome: 'Alexandre', texto: 'Oque vai fazer amanhã?' },
    { nome: 'Ana', texto: 'Vou trabalhar até meio dia, depois não sei ainda oque vou fazer 😊' },
    { nome: 'Alexandre', texto: 'Ta ok, qualquer coisa, me liga se tiver um tempo, vou gostar de ver você novamete 😉' },
    { nome: 'Ana', texto: 'Me manda mensagem depois, ai salvo o seu numero também.' },
    { nome: 'Alexandre', texto: 'Pode deixar! Boa noite, Ana.' },
    { nome: 'Ana', texto: 'Tchau! Boia noite 😘' }
  ], () => {
    moverPlayer.call(this, {
      personagem: this.playerEla,
      tipo: 'ela',
      x: 274,
      y: 1808,
      onFinish: () => {
        gameState.dialogoAtivo = false;
        enviarmensagemparaana.call(this);
        gameState.love += 10;
        atualizarHud.call(this);
      }
    });
  });
}

function moverPlayer({ personagem, tipo, x, y, onFinish }) {
  const cena = this;
  personagem.body.setVelocity(0, 0);
  personagem.body.enable = false;

  cena.tweens.add({
    targets: personagem,
    x: x,
    duration: 2000,
    ease: 'Linear',
    onStart: () => {
      const anim = personagem.x > x ? `${tipo}-left` : `${tipo}-right`;
      personagem.anims.play(anim, true);
    },
    onComplete: () => {
      cena.tweens.add({
        targets: personagem,
        y: y,
        duration: 1000,
        ease: 'Linear',
        onStart: () => {
          personagem.anims.play(`${tipo}-up`, true);
        },
        onComplete: () => {
          personagem.anims.stop();
          personagem.setVisible(false);
          this.playerEle.body.enable = true;
          personagem.body.enable = true;

          if (onFinish) onFinish();
        }
      });
    }
  });
}

function enviarmensagemparaana() {
  gameState.missaoAtual = 'enviaMensagem';
  mudarCameraDePlayer(this.cameras.main, this.playerEle, this);
  atualizarMarcadorMissao.call(this);
  mostrarObjetivo.call(this, "Vá até a escola para enviar uma mensagem", 3000);
}

function enviarMensagemAna() {
  if (gameState.missaoAtual === 'enviaMensagem' && gameState.sinalAtivo) {
    // 1. Para o movimento do player imediatamente
    pararPersonagens.call(this);
    this.playerEle.body.moves = false;
    gameState.dialogoAtivo = true;

    // 2. Envia a mensagem (isso seta temMensagemPendente = true)
    enviarMensagem.call(this, "Oi Ana, já cheguei em casa! Obrigada por hoje.", "Alexandre");

    // 3. Finaliza a missão de envio
    gameState.missaoAtual = null;
    atualizarMarcadorMissao.call(this);
    mostrarObjetivo.call(this, "📱 Mensagem enviada com sucesso!", 3000);



    iniciarDialogo.call(this, [
      { nome: 'Alexandre', texto: 'Ainda bem que consegui sinal 😎. Agora posso ir para casa tranquilo.' },
    ], finalizarDia);

  }
}

function finalizarDia() {
  // 4. Troca para a personagem 'ela' e a torna visível
  this.time.delayedCall(1000, () => {
    gameState.dialogoAtivo = false;
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(650, () => {
      this.cameras.main.fadeIn(1, 0, 0, 0);
      this.playerEle.setVisible(false);
      segundoDia.call(this);
    });
  });
}

// --- FUNÇÃO PARA ENVIAR MENSAGEM ---
function enviarMensagem(texto, remetente) {
  gameState.temMensagemPendente = true;
  console.log(`Mensagem enviada por ${remetente}: ${texto}`);

  if (gameState.sinalAtivo) {
    mostrarObjetivo.call(this, "Mensagem enviada!", 3000);
  }
}

function segundoDia() {

  this.playerEle.body.moves = true;
  mudarCameraDePlayer(this.cameras.main, this.playerEla, this);
  const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
    .setOrigin(0).setScrollFactor(0).setDepth(9000).setAlpha(1);

  const x = this.scale.width / 2 - 160;
  const y = this.scale.height / 2 - 60;

  const bg = this.add.graphics().fillStyle(0x000000, 0.85).fillRoundedRect(x, y, 320, 120, 16).setScrollFactor(0).setDepth(9100);
  const texto = this.add.text(x + 10, y + 35, 'No outro dia...', { fontSize: '32px', fontStyle: 'bold', color: '#ffffff' })
    .setScrollFactor(0).setDepth(9200);

  this.time.delayedCall(3500, () => {
    bg.destroy();
    texto.destroy();
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        overlay.destroy();
        mostrarObjetivo.call(this, "Procurar sinal de telefone, telvez você tenha mensagens", 4000);
      }
    });
  });
}

function verificarMensagemMissao() {

  // A mensagem só deve ser lida pela Ana (personagemAtual === 'ela')
  if (gameState.sinalAtivo && gameState.temMensagemPendente && !gameState.dialogoAtivo && gameState.personagemAtual === 'ela') {
    gameState.temMensagemPendente = false;
    this.notificacaoMsg.setVisible(false);
    gameState.dialogoAtivo = true;
    pararPersonagens.call(this);
    iniciarDialogo.call(this, [
      { nome: 'Celular📱', texto: '💌 Nova mensagem de Alexandre: ""So para não deixar você se esquecer de min, vou ficar pensando em você, adorei nossa noite. Beijos""' }
    ], trabalhar);
  }

  gameState.love += 10;
  atualizarHud.call(this);
}

function trabalhar() {
  gameState.missaoAtual = 'irAoTrabalho';
  gameState.subMissao = null;

  atualizarMarcadorMissao.call(this);
  mostrarObjetivo.call(this, "Esta na hora de ir ao trabalho", 4000);
  this.time.delayedCall(1000, () => {
    gameState.dialogoAtivo = true;
    iniciarDialogo.call(this, [
      { nome: 'Ana', texto: 'Ainda bem que hoje é sabado, meio dia estou livre 😜' }
    ], gameState.dialogoAtivo = false);
  });
}

function iniciarTrabalho() {

  gameState.missaoAtual = null;
  gameState.subMissao = null;
  this.playerEla.setVisible(false);
  pararPersonagens.call(this);
  atualizarMarcadorMissao.call(this);


  this.time.delayedCall(1000, () => {
    gameState.dialogoAtivo = false;
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(650, () => {
      this.cameras.main.fadeIn(1, 0, 0, 0);
      this.playerEle.setVisible(false);
      fimDoExpediente.call(this);
    });
  });
}

function fimDoExpediente() {
  mudarCameraDePlayer(this.cameras.main, this.playerEla, this);
  const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
    .setOrigin(0).setScrollFactor(0).setDepth(9000).setAlpha(1);

  const x = this.scale.width / 2 - 160;
  const y = this.scale.height / 2 - 60;

  const bg = this.add.graphics().fillStyle(0x000000, 0.85).fillRoundedRect(x, y, 320, 120, 16).setScrollFactor(0).setDepth(9100);
  const texto = this.add.text(x + 10, y + 35, 'Depois de uma longa manhã...', { fontSize: '32px', fontStyle: 'bold', color: '#ffffff' })
    .setScrollFactor(0).setDepth(9200);

  this.time.delayedCall(3500, () => {
    bg.destroy();
    texto.destroy();
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        this.playerEla.body.moves = true;
        overlay.destroy();
        gameState.missaoAtual = 'EnviarMensagemAlexandre';
        gameState.subMissao = null;
        mostrarObjetivo.call(this, "Convidar o Alexandre para tomar um teres", 4000);
        this.time.delayedCall(1000, () => {
          gameState.dialogoAtivo = true;
          iniciarDialogo.call(this, [
            { nome: 'Ana', texto: 'Ainda bem que o expediente acabou 🙌' },
            { nome: 'Ana', texto: 'Acho que vou convidar o Alexandre para tomar um tereré' },
            { nome: 'Ana', texto: 'Só preciso conseguir sinal de telefone, aqui não está funcionando😒 ' },
          ], gameState.dialogoAtivo = false);
        });
      }
    });
  });

}


// Atalhos de DEV
function pularParaConversa() {
  gameState.missaoAtual = 'falarComEla';
  gameState.subMissao = null;
  gameState.personagemAtual = 'ele';
  this.cameras.main.startFollow(this.playerEle);
  this.playerEle.setPosition(2900, 520);
  this.playerEla.setPosition(2920, 520);
}

function pularParaCasa() {
  gameState.missaoAtual = 'levarParaCasa';
  gameState.subMissao = null;
  gameState.personagemAtual = 'ela';
  gameState.dialogoAtivo = false;
  this.playerEla.setPosition(520, 1850);
  this.playerEle.setPosition(550, 1850);
  this.cameras.main.startFollow(this.playerEla);
  forcarDirecao(this.playerEle, 'ele', 'left');
  forcarDirecao(this.playerEla, 'ela', 'right');
}

function pularescola() {
  gameState.subMissao = 'enviaMensagem';
  gameState.personagemAtual = 'ele';
  this.playerEle.setPosition(2656, 758);
  this.cameras.main.startFollow(this.playerEle);


}

// --- 6. MOVIMENTAÇÃO E ANIMAÇÕES ---

function criarAnimacoes(scene) {
  const tipos = ['ela', 'ele'];
  tipos.forEach(tipo => {
    const spriteKey = tipo === 'ela' ? 'playerEla' : 'playerEle';
    ['down', 'left', 'right', 'up'].forEach(dir => {
      scene.anims.create({
        key: `${tipo}-${dir}`,
        frames: scene.anims.generateFrameNumbers(spriteKey, { frames: FRAMES[tipo][dir] }),
        frameRate: 8,
        repeat: -1
      });
    });
  });
}

function olharUmParaOutro(playerAtivo, outro) {
  const direcao = playerAtivo.direction || 'down';
  const oposta = direcaoOposta[direcao];
  const tipoOutro = outro === this.playerEla ? 'ela' : 'ele';
  outro.anims.play(`${tipoOutro}-${oposta}`, true);
  pararPersonagens.call(this);
}

function forcarDirecao(sprite, tipo, direcao) {
  sprite.anims.play(`${tipo}-${direcao}`, true);
  sprite.anims.stop();
  sprite.direction = direcao;
}

function pararPersonagens() {
  this.playerEle.setVelocity(0);
  this.playerEla.setVelocity(0);
  this.playerEle.anims.stop();
  this.playerEla.anims.stop();
}

function pararEmIdle(sprite, tipo) {
  sprite.anims.stop();
  sprite.setFrame(FRAMES[tipo].idle);
}

function getPersonagemAtivo(scene) {
  return gameState.personagemAtual === 'ela' ? scene.playerEla : scene.playerEle;
}

function getNpc(scene) {
  return gameState.personagemAtual === 'ela' ? scene.playerEle : scene.playerEla;
}

// --- 7. INTERFACE (HUD) ---

function atualizarHud() {
  if (!this.hud) return;
  const percent = Phaser.Math.Clamp(gameState.love, 0, 100);
  this.hud.bg.clear().fillStyle(0x000000, 0.6).fillRect(this.hud.x - 2, this.hud.y - 2, this.hud.width + 4, this.hud.height + 4);
  this.hud.fill.clear().fillStyle(0xff4d6d, 1).fillRect(this.hud.x, this.hud.y, (this.hud.width * percent) / 100, this.hud.height);
}
