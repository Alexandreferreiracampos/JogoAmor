
// --- 1. CONFIGURAÇÕES E CONSTANTES ---

// --- CENA DE INÍCIO ---
class TelaInicial extends Phaser.Scene {
  constructor() {
    super({ key: 'TelaInicial' });
  }

  preload() {
    // Você pode carregar uma imagem de fundo aqui se quiser
    // this.load.image('fundoInicio', 'assets/fundo_inicio.png');
  }

  create() {
    const { width, height } = this.scale;

    // Frase principal
    this.add.text(width / 1.9, height / 4 - 50, 'Aqui foi onde tudo começou ❤️', {
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 50, 'Posto Norte - 2012', {
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Botão Iniciar História
    const botao = this.add.text(width / 2, height / 2 + 50, 'Iniciar História', {
      fontSize: '32px',
      color: '#ffd166',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
      fontFamily: 'monospace'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Efeito de hover (passar o mouse)
    botao.on('pointerover', () => botao.setStyle({ color: '#ffffff' }));
    botao.on('pointerout', () => botao.setStyle({ color: '#ffd166' }));

    // Ação de clicar: Muda para a cena principal do jogo
    botao.on('pointerdown', () => {
      this.scene.start('CenaJogo');
    });
  }
}


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
  scene: [TelaInicial, { key: 'CenaJogo', preload, create, update }]
};

const FRAMES = {
  ela: {
    down: [61, 65, 69],
    left: [60, 64, 68],
    right: [63, 67, 71],
    up: [62, 66, 70],
    idle_down: [61, 45],
    idle_up: [62, 46],
    idle_left: [60, 44],
    idle_right: [63, 47],
    idle: 61 // Frame padrão
  },
  ele: {
    down: [1, 5, 9],
    left: [0, 4, 8],
    right: [3, 7, 11],
    up: [2, 6, 10],
    idle_down: [1, 37],
    idle_up: [2, 38],
    idle_left: [36, 0],
    idle_right: [3, 39],
    idle: 1
  },
  npc1: {
    down: [13, 17, 21],
    left: [12, 16, 20],
    right: [15, 19, 23],
    up: [14, 18, 22],
    idle_down: [13, 15], // Adicionado
    idle_up: [14, 15],   // Adicionado
    idle_left: [12, 15], // Adicionado
    idle_right: [15, 15],// Adicionado
    idle: 13
  },
  npc2: {
    down: [49, 53, 57],
    left: [48, 52, 56],
    right: [51, 55, 59],
    up: [50, 54, 58],
    idle_down: [49, 49], // Adicionado
    idle_up: [50, 50],   // Adicionado
    idle_left: [48, 48], // Adicionado
    idle_right: [51, 51],// Adicionado
    idle: 49
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

  this.load.spritesheet('npcP1', 'assets/personagem.png', {
    frameWidth: 32,
    frameHeight: 32
  });

  this.load.spritesheet('npcP2', 'assets/personagem.png', {
    frameWidth: 32,
    frameHeight: 32
  });

}

function create() {

  this.filtroNoite = this.add.rectangle(0, 0, 1200, 720, 0x000033)
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(5000) // Certifique-se que o depth é alto para ficar por cima de tudo
    .setAlpha(0);
  // 1. Atalhos de Desenvolvimento
  this.input.keyboard.on('keydown-ONE', () => iniciarMissaoSala.call(this));
  this.input.keyboard.on('keydown-TWO', () => pularParaConversa.call(this));
  this.input.keyboard.on('keydown-THREE', () => chegaranNaSala.call(this));
  this.input.keyboard.on('keydown-FOUR', () => pularParaCasa.call(this));
  this.input.keyboard.on('keydown-FIVE', () => pularescola.call(this));
  this.input.keyboard.on('keydown-SIX', () => enviarMensagemAlexandre.call(this));
  this.input.keyboard.on('keydown-SEVEN', () => encontroPracaterere.call(this));
  this.input.keyboard.on('keydown-EIGHT', () => levarParaCasaTerceiroEncontro.call(this));
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
  this.playerEla = this.physics.add.sprite(1488, 496, 'playerEla', FRAMES.ela.idle);
  this.playerEle = this.physics.add.sprite(2982, 580, 'playerEle', FRAMES.ele.idle);

  // 5. Inicialização dos npc
  this.npcP1 = this.physics.add.sprite(1488, 496, 'npcP1', FRAMES.npc1.idle);
  this.npcP2 = this.physics.add.sprite(2982, 580, 'npcP2', FRAMES.npc2.idle);

  this.playerEla.setCollideWorldBounds(true);
  this.playerEle.setCollideWorldBounds(true);

  this.npcP1.setCollideWorldBounds(true);
  this.npcP2.setCollideWorldBounds(true);

  this.physics.add.collider(this.playerEla, layer);
  this.physics.add.collider(this.playerEle, layer);

  this.physics.add.collider(this.npcP1, layer);
  this.physics.add.collider(this.npcP2, layer);

  this.npcP1.setVisible(false);
  this.npcP2.setVisible(false);

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
  // Atualizar Status de Sinal (Sempre rodar para checar o menu)
  atualizarStatusSinal(this);

  if (gameState.dialogoAtivo) return;

  // 1. Identificar quem é quem
  const player = getPersonagemAtivo(this);
  const npc = getNpc(this);

  // 2. Definir o tipo do NPC para as animações
  const tipoNpc = gameState.personagemAtual === 'ela' ? 'ele' : 'ela';
  const speed = 420;

  if (gameState.dialogoAtivo) return;

  // 3. Lógica de Seguimento
  const missoesDeSeguir = ['levarParaCasa', 'irPizzaria', 'elaSegueEle', 'levarParaCasaSegundoEncontro', 'irParaSaladeAula', 'finalRecreio', 'dialogoAlemao', 'levarParaCasaTerceiroEncontro'];

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
      // Toca a animação de idle para o NPC também
      const dx = player.x - npc.x;
      const dy = player.y - npc.y;
      let dirNpc = 'down';
      if (Math.abs(dx) > Math.abs(dy)) {
        dirNpc = dx > 0 ? 'right' : 'left';
      } else {
        dirNpc = dy > 0 ? 'down' : 'up';
      }
      npc.anims.play(`${tipoNpc}-idle_${dirNpc}`, true);
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
    // Toca a animação de idle baseada na última direção
    const direcao = player.direction || 'down';
    player.anims.play(`${gameState.personagemAtual}-idle_${direcao}`, true);
  }


  console.log(
    `${Math.floor(player.x)}, ${Math.floor(player.y)}`
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
    if (gameState.missaoAtual === 'irParaSaladeAula') {
      chegaranNaSala.call(this);
    }
  });

  this.physics.add.overlap(this.playerEla, this.zonaSala, () => {
    if (gameState.missaoAtual === 'irParaSala' && gameState.subMissao === 'elaVai') {
      ambosNaSala.call(this);
    }

  });

  this.physics.add.overlap(this.playerEla, this.zonaSala, () => {
    if (gameState.missaoAtual === 'finalRecreio' && gameState.subMissao === 'finalRecreio') {
      finalAula.call(this);
    }
  });

  // Zona Pizzaria
  this.zonaPizzaria = this.add.zone(2098, 683, 50, 50);
  this.physics.world.enable(this.zonaPizzaria);
  this.zonaPizzaria.body.setAllowGravity(false);

  this.physics.add.overlap(this.playerEle, this.zonaPizzaria, () => {
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

  this.physics.add.overlap(this.playerEle, this.zonaCasa, () => {
    if (gameState.missaoAtual === 'levarParaCasaSegundoEncontro' && !gameState.dialogoAtivo) {
      chegouNaCasaSegundoEncontro.call(this);
    }
  });

  this.physics.add.overlap(this.playerEle, this.zonaCasa, () => {
    if (gameState.missaoAtual === 'levarParaCasaTerceiroEncontro' && !gameState.dialogoAtivo) {
      levarParaCasaTerceiroEncontro.call(this);
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

  // Zona Praça 
  this.zonaPraca = this.add.zone(782, 1010, 20, 20);
  this.physics.world.enable(this.zonaPraca);
  this.zonaPraca.body.setAllowGravity(false);

  this.physics.add.overlap(this.playerEla, this.zonaPraca, () => {
    if (gameState.missaoAtual === 'encontroPraca' && gameState.subMissao === 'elaVai' && !gameState.dialogoAtivo) {
      senaEsperaNaPraca.call(this);
    }
  });

  // Zona recreio
  this.zonaRecreio = this.add.zone(3053, 462, 80, 80);
  this.physics.world.enable(this.zonaRecreio);
  this.zonaRecreio.body.setAllowGravity(false);

  this.physics.add.overlap(this.playerEla, this.zonaRecreio, () => {
    if (gameState.missaoAtual === 'dialogoRecreio' && !gameState.dialogoAtivo) {
      iniciarDialogoRecreio.call(this);
    }
  });

  // Zona Alemao
  this.zonaDialogoAlemao = this.add.zone(1611, 679, 80, 80);
  this.physics.world.enable(this.zonaDialogoAlemao);
  this.zonaDialogoAlemao.body.setAllowGravity(false);

  this.physics.add.overlap(this.playerEla, this.zonaDialogoAlemao, () => {
    if (gameState.missaoAtual === 'dialogoAlemao' && !gameState.dialogoAtivo) {
      dialogoAlemao.call(this);
    }
  });

  // Zona Alemao
  this.zonaAlemao = this.add.zone(1361, 550, 80, 80);
  this.physics.world.enable(this.zonaAlemao);
  this.zonaAlemao.body.setAllowGravity(false);

  this.physics.add.overlap(this.playerEla, this.zonaAlemao, () => {
    if (gameState.missaoAtual === 'irparamesa' && !gameState.dialogoAtivo) {
      conversaAmigos.call(this);
    }
  });

  // Zona Alemao
  this.zonaAlemao = this.add.zone(1361, 550, 80, 80);
  this.physics.world.enable(this.zonaAlemao);
  this.zonaAlemao.body.setAllowGravity(false);

  this.physics.add.overlap(this.playerEle, this.zonaAlemao, () => {
    if (gameState.missaoAtual === 'irLanchoneteAlemao' && !gameState.dialogoAtivo) {
      iniciarDialogoAlemao.call(this);
    }
  });

  // MARCA NO MAPA
  //this.debugZonaCasa = marcarZonaNoMapa(this, this.zonaPizzaria, 0x00ff00);


  // Colisões entre Personagens
  this.physics.add.overlap(this.playerEle, this.playerEla, () => {
    if (gameState.missaoAtual === 'conhecer' && !gameState.encontroAtivado) {
      iniciarEncontro.call(this);
    } else if (gameState.missaoAtual === 'falarComEla' && !gameState.dialogoAtivo) {
      iniciarConvitePizza.call(this);
    }
    else if (gameState.missaoAtual === 'encontroPraca' && gameState.subMissao === 'eleVai' && !gameState.dialogoAtivo) {
      iniciarSegundoEncontro.call(this);
    }
    else if (gameState.missaoAtual === 'irParaEscolaSegundaFeira' && gameState.subMissao === 'FalarComAlexandre' && !gameState.dialogoAtivo) {
      conversarSegundaEscola.call(this);
    }
  });
}

function mudarParaNoite(cena, duracao = 2000) {
  if (!cena.filtroNoite) {
    console.error("Filtro de noite não encontrado na cena!");
    return;
  }
  cena.tweens.add({
    targets: cena.filtroNoite,
    alpha: 0.7, // Aumentei um pouco para você notar a diferença
    duration: duracao
  });
}

function mudarParaDia(cena, duracao = 2000) {
  cena.tweens.add({
    targets: cena.filtroNoite,
    alpha: 0, // Volta a ficar invisível
    duration: duracao
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
  else if (gameState.missaoAtual === 'encontroPraca') zonaAlvo = this.zonaPraca;
  else if (gameState.missaoAtual === 'levarParaCasaSegundoEncontro') zonaAlvo = this.zonaCasa;
  else if (gameState.missaoAtual === 'irParaSaladeAula') zonaAlvo = this.zonaSala;
  else if (gameState.missaoAtual === 'dialogoRecreio') zonaAlvo = this.zonaRecreio;
  else if (gameState.missaoAtual === 'finalRecreio') zonaAlvo = this.zonaSala;
  else if (gameState.missaoAtual === 'irparamesa') zonaAlvo = this.zonaAlemao;
  else if (gameState.missaoAtual === 'irLanchoneteAlemao') zonaAlvo = this.zonaAlemao;
  else if (gameState.missaoAtual === 'levarParaCasaTerceiroEncontro') zonaAlvo = this.zonaCasa;

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
    { nome: 'Ana', texto: 'Que legal… achei vocês bem parecidos. Quando cheguei, até pensei que fosse ele.' },
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
  6
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
    mudarParaNoite(this, 2000);
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
  const texto = this.add.text(x + 70, y + 35, '🕒 18:00', { fontSize: '32px', fontStyle: 'bold', color: '#ffffff' })
    .setScrollFactor(0).setDepth(9200);

  let hora = 18;
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

  this.playerEla.setPosition(2128, 685);
  this.playerEle.setPosition(2064, 685);

  forcarDirecao(this.playerEle, 'ele', 'right');
  forcarDirecao(this.playerEla, 'ela', 'left');

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
    // Limpa qualquer diálogo de texto que esteja ativo
    if (this.dialogo && this.dialogo.bg) {
      this.dialogo.bg.setVisible(false);
      this.dialogo.nome.setVisible(false);
      this.dialogo.texto.setVisible(false);
    }

    // 2. Define a lista de opções para este momento específico do jogo
    const opcoesDaConversa = [
      { texto: 'Pedir o telefone', acao: escolherTelefone },
      { texto: 'Tentar beijá-la', acao: escolherBeijo },
      { texto: 'Dar tchau', acao: escolherIrEmbora }
    ];

    // 3. Chama a função reutilizável para mostrar as opções na tela
    mostrarOpcoes(this, opcoesDaConversa);
  });
}

function mostrarOpcoesConverCasa2() {
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

function mostrarOpcoes(cena, opcoes) {
  // Limpa quaisquer botões de opções que já existam na tela para evitar sobreposição.
  if (cena.botoesOpcoes && cena.botoesOpcoes.length > 0) {
    console.log("Limpando botões de opções anteriores.");
    cena.botoesOpcoes.forEach(botao => {
      if (botao.bg) botao.bg.destroy();
      if (botao.txt) botao.txt.destroy();
    });
  }
  cena.botoesOpcoes = []; // Reinicia o array

  // Configurações de layout para os botões
  const larguraBotao = 400;
  const alturaBotao = 50;
  const espacamento = 20;
  const totalAltura = opcoes.length * (alturaBotao + espacamento) - espacamento;
  const inicioY = (cena.scale.height / 2) - (totalAltura / 2);

  // Itera sobre as opções fornecidas para criar cada botão
  opcoes.forEach((opcao, index) => {
    const x = cena.scale.width / 2;
    const y = inicioY + index * (alturaBotao + espacamento);

    // Cria o fundo retangular do botão
    const bg = cena.add.rectangle(x, y, larguraBotao, alturaBotao, 0x000000, 0.8)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0) // Garante que os botões fiquem fixos na tela, mesmo se a câmera se mover
      .setDepth(10000);   // Profundidade alta para garantir que fique na frente de outros elementos

    // Cria o texto do botão
    const txt = cena.add.text(x, y, opcao.texto, {
      fontSize: '24px',
      fontFamily: 'Arial', // É bom definir uma fonte
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10001);

    // Efeitos de mouse para feedback visual
    bg.on('pointerover', () => bg.setFillStyle(0x333333, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x000000, 0.8));

    // Ação principal ao clicar no botão
    bg.on('pointerdown', () => {
      // 1. Remove todos os botões da tela para limpar a interface
      cena.botoesOpcoes.forEach(b => {
        b.bg.destroy();
        b.txt.destroy();
      });
      cena.botoesOpcoes = [];

      // 2. Executa a função de callback específica para a opção clicada
      // Usa .call(cena) para garantir que o 'this' dentro da ação seja a cena
      if (opcao.acao) {
        opcao.acao.call(cena);
      }
    });

    // Armazena a referência do botão criado
    cena.botoesOpcoes.push({ bg, txt });
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
    this.time.delayedCall(100, () => {
      if (this.dialogo && this.dialogo.bg) {
        this.dialogo.bg.setVisible(false);
        this.dialogo.nome.setVisible(false);
        this.dialogo.texto.setVisible(false);
      }

      // 2. Define a lista de opções para este momento específico do jogo
      const opcoesDaConversa = [
        { texto: 'Pedir o telefone', acao: escolherTelefone },
        { texto: 'Dar tchau e ir embora', acao: escolherIrEmbora }
      ];

      // 3. Chama a função reutilizável para mostrar as opções na tela
      mostrarOpcoes(this, opcoesDaConversa);


    });
  });
}

function escolherIrEmbora() {
  iniciarDialogo.call(this, [
    { nome: 'Alexandre', texto: 'Vou deixar você entrar. Boa noite, Ana!' },
    { nome: 'Ana', texto: 'Ué, já vai? Você não está esquecendo de me pedir nada não? rsrs' }
  ], () => {
    this.time.delayedCall(100, () => {
      if (this.dialogo && this.dialogo.bg) {
        this.dialogo.bg.setVisible(false);
        this.dialogo.nome.setVisible(false);
        this.dialogo.texto.setVisible(false);
      }

      // 2. Define a lista de opções para este momento específico do jogo
      const opcoesDaConversa = [
        { texto: 'Pedir o telefone', acao: escolherTelefone },
        { texto: 'Tentar beijá-la', acao: escolherBeijo },
      ];

      // 3. Chama a função reutilizável para mostrar as opções na tela
      mostrarOpcoes(this, opcoesDaConversa);

    });
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
  const duracao = personagem === this.playerEla ? 2000 : 4500;

  cena.tweens.add({
    targets: personagem,
    x: x,
    duration: duracao,
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
          if (personagem == this.playerEla) {
            personagem.setVisible(false);
          }

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

  mudarParaDia(this, 3000);

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
          iniciarDialogo.call(this, [
            { nome: 'Ana', texto: 'Ainda bem que o expediente acabou 🙌' },
            { nome: 'Ana', texto: 'Acho que vou convidar o Alexandre para tomar um tereré' },
            { nome: 'Ana', texto: 'Só preciso conseguir sinal de telefone, aqui não está funcionando😒 ' },
          ], () => { gameState.dialogoAtivo = false; this.playerEle.setVisible(false); });
        });
      }
    });
  });

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

    // Lógica para o menu de contato após o trabalho
    if (gameState.missaoAtual === 'EnviarMensagemAlexandre' && !gameState.dialogoAtivo && !scene.menuContatoAtivo) {
      abrirMenuContato.call(scene);
    }
  } else {
    scene.hudSinal.setText('❌ Sem sinal').setColor('#ff4d4d');
    scene.notificacaoMsg.setVisible(false);
  }
}

function abrirMenuContato() {
  if (this.menuContatoAtivo) return;
  this.menuContatoAtivo = true;
  gameState.dialogoAtivo = true;
  pararPersonagens.call(this);

  const x = this.cameras.main.centerX;
  const y = this.cameras.main.centerY;

  // Criamos um grupo para facilitar a limpeza posterior
  this.menuGroup = this.add.group();

  // 1. Fundo que bloqueia cliques em qualquer outra coisa (Overlay)
  const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
    .setOrigin(0).setScrollFactor(0).setDepth(90000).setInteractive();

  // 2. Fundo do Menu
  const bg = this.add.graphics().setScrollFactor(0).setDepth(90001);
  bg.fillStyle(0x000000, 1);
  bg.fillRoundedRect(x - 200, y - 110, 400, 220, 15);
  bg.lineStyle(4, 0xffffff, 1);
  bg.strokeRoundedRect(x - 200, y - 110, 400, 220, 15);

  // 3. Título
  const titulo = this.add.text(x, y - 70, 'CONTATAR ALEXANDRE', {
    fontSize: '26px', fontStyle: 'bold', color: '#ffd166'
  }).setOrigin(0.5).setScrollFactor(0).setDepth(90002);

  // 4. Botão Mensagem
  const btnMsg = this.add.text(x, y, '💬 Enviar Mensagem', {
    fontSize: '22px', color: '#ffffff', backgroundColor: '#333', padding: { x: 20, y: 10 }
  }).setOrigin(0.5).setScrollFactor(0).setDepth(90003).setInteractive({ useHandCursor: true });

  // 5. Botão Ligar
  const btnLigar = this.add.text(x, y + 70, '📞 Ligar Diretamente', {
    fontSize: '22px', color: '#ffffff', backgroundColor: '#333', padding: { x: 20, y: 10 }
  }).setOrigin(0.5).setScrollFactor(0).setDepth(90003).setInteractive({ useHandCursor: true });

  this.menuGroup.addMultiple([overlay, bg, titulo, btnMsg, btnLigar]);

  // Funções de clique
  btnMsg.on('pointerover', () => btnMsg.setBackgroundColor('#555'));
  btnMsg.on('pointerout', () => btnMsg.setBackgroundColor('#333'));
  btnMsg.on('pointerdown', () => {
    this.menuGroup.clear(true, true);
    this.menuContatoAtivo = false;
    realizarContato.call(this, 'mensagem');
  });

  btnLigar.on('pointerover', () => btnLigar.setBackgroundColor('#555'));
  btnLigar.on('pointerout', () => btnLigar.setBackgroundColor('#333'));
  btnLigar.on('pointerdown', () => {
    this.menuGroup.clear(true, true);
    this.menuContatoAtivo = false;
    realizarContato.call(this, 'ligacao');
  });
}

function realizarContato(tipo) {
  let falas = [];
  if (tipo === 'mensagem') {
    falas = [
      { nome: 'Ana (SMS)', texto: 'Oi Alexandre! Acabei de sair do trabalho. Topa tomar um tereré agora à tarde?' },
      { nome: 'Sistema', texto: 'Mensagem enviada com sucesso!' }
    ];
  } else {
    falas = [
      { nome: 'Ana (Ligação)', texto: '📞 Chamando…' },
      { nome: 'Alexandre (Ligação)', texto: 'Oi, Ana!' },
      { nome: 'Ana (Ligação)', texto: 'Oi, Alexandre! Tudo bem? Acabei de sair do serviço e pensei em você… topa tomar um tereré?' },
      { nome: 'Alexandre (Ligação)', texto: 'Opa, Ana! Claro que topo 😄 Onde a gente se encontra?' },
      { nome: 'Ana (Ligação)', texto: 'Vamos na praça? Te espero lá em 15 minutos.' }
    ];
  }

  if (tipo === 'mensagem') {
    iniciarDialogo.call(this, falas, () => {
      gameState.dialogoAtivo = false;
      aguardarMensagemDeConfirmacao.call(this)
    });


  } else {

    // Garantimos que o estado de diálogo seja resetado corretamente ao final
    iniciarDialogo.call(this, falas, () => {
      gameState.dialogoAtivo = false;
      gameState.missaoAtual = 'encontroPraca';
      gameState.subMissao = 'elaVai'
      mostrarObjetivo.call(this, "Vá para o local marcado", 4000);
      atualizarMarcadorMissao.call(this);

      // Forçamos o player a recuperar o movimento
      const player = getPersonagemAtivo(this);
      if (player && player.body) {
        player.body.moves = true;
        player.setVelocity(0);
      }
    });

  }

}

function aguardarMensagemDeConfirmacao() {


  gameState.missaoAtual = 'encontroPraca';

  this.time.delayedCall(1000, () => {
    mostrarObjetivo.call(this, "📩 Nova Mensagem!", 4000);
    iniciarDialogo.call(this, [
      { nome: 'Celular📱', texto: '💌 Nova mensagem de Alexandre: ""Oi, Ana! Claro que topo 😄 Te encontro na praça em 20 minutos."" ' }
    ], () => {
      gameState.dialogoAtivo = false;
      mensagemRecebidaDeConfirmalcao.call(this);
    });
  });


}

function mensagemRecebidaDeConfirmalcao() {
  gameState.dialogoAtivo = false;
  gameState.missaoAtual = 'encontroPraca';
  gameState.subMissao = 'elaVai'
  mostrarObjetivo.call(this, "Vá para o local marcado", 4000);
  atualizarMarcadorMissao.call(this);
  // Forçamos o player a recuperar o movimento
  const player = getPersonagemAtivo(this);
  if (player && player.body) {
    player.body.moves = true;
    player.setVelocity(0);
  }
}

function senaEsperaNaPraca() {

  pararPersonagens.call(this);
  this.playerEla.body.moves = false;
  gameState.personagemAtual = 'ele';
  gameState.missaoAtual = null;
  atualizarMarcadorMissao.call(this);
  this.time.delayedCall(1000, () => {
    gameState.dialogoAtivo = false;
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(650, () => {
      this.cameras.main.fadeIn(1, 0, 0, 0);
      this.playerEle.setVisible(false);
      mudarparaAlexandreEncontroPraca.call(this);
    });
  });

}

function mudarparaAlexandreEncontroPraca() {

  pararPersonagens.call(this);

  gameState.dialogoAtivo = false;
  this.playerEla.body.moves = false;
  mudarCameraDePlayer(this.cameras.main, this.playerEle, this);

  const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
    .setOrigin(0).setScrollFactor(0).setDepth(9000).setAlpha(1);

  const x = this.scale.width / 2 - 160;
  const y = this.scale.height / 2 - 60;

  const bg = this.add.graphics().fillStyle(0x000000, 0.85).fillRoundedRect(x, y, 320, 120, 16).setScrollFactor(0).setDepth(9100);
  const texto = this.add.text(x + 10, y + 35, 'Alguns minutos depois...', { fontSize: '32px', fontStyle: 'bold', color: '#ffffff' })
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
        gameState.missaoAtual = 'encontroPraca';
        gameState.subMissao = 'eleVai';
        mostrarObjetivo.call(this, "A Paula esta te esperando na praça.", 4000);
        this.playerEle.setVisible(true);
      }
    });
  });
}



function iniciarSegundoEncontro() {

  gameState.dialogoAtivo = true;
  pararPersonagens.call(this);
  this.playerEla.body.moves = false;
  this.playerEle.body.moves = false;
  gameState.subMissao = null;
  gameState.missaoAtual = null;
  atualizarMarcadorMissao.call(this);
  olharUmParaOutro.call(this, getPersonagemAtivo(this), getNpc(this));

  this.playerEla.setPosition(788, 1004);
  this.playerEle.setPosition(816, 1004);

  forcarDirecao(this.playerEle, 'ele', 'left');
  forcarDirecao(this.playerEla, 'ela', 'right');


  iniciarDialogo.call(this,
    [{ nome: 'Alexandre', texto: 'Oi… nada melhor que um tereré pra refrescar depois do dia, né?' },
    { nome: 'Ana', texto: 'Nossa, sim! Essa praça é bem tranquila…' },

    { nome: 'Alexandre', texto: 'Como foi seu trabalho hoje?' },
    { nome: 'Ana', texto: 'Muita correria. Tem dias que dá vontade de sair correndo, rsrs.' },

    { nome: 'Alexandre', texto: 'Imagino.' },
    { nome: 'Ana', texto: 'Ainda bem que hoje foi só até meio-dia, dá pra curtir o final do dia tranquila.' },

    { nome: 'Alexandre', texto: 'Espero que curta mesmo, porque eu estava bem ansioso pra te ver de novo, rsrs.' },
    { nome: 'Ana', texto: 'Sério? Você nem mandou mensagem hoje… recebi a de ontem e achei que ia falar comigo hoje, rsrs.' },

    { nome: 'Alexandre', texto: 'Pensei em mandar, mas estava esperando você responder. Fiquei feliz quando você me chamou pra sair de novo hoje.' },
    { nome: 'Ana', texto: 'Que bom! Eu não ia fazer nada de importante mesmo, kkkkk. Brincadeira!' },

    { nome: 'Alexandre', texto: 'Agora não sei se fico triste ou feliz com isso, kkkkk.' },
    { nome: 'Alexandre', texto: 'Mas falando sério… gostei bastante de você. Acho que nunca conheci alguém assim.' },

    { nome: 'Ana', texto: 'Nossa, como você é rápido… direto ao ponto assim.' },
    { nome: 'Ana', texto: 'Vai me dizer que em Goiânia não tinha meninas legais também?' },

    { nome: 'Alexandre', texto: 'Igual a você, não. Não sei explicar, mas quando te vi na escola senti algo diferente.' },
    { nome: 'Alexandre', texto: 'Serio mesmo.' },

    { nome: 'Ana', texto: 'Humm… sei. Aposto que você fala isso pra todas, rsrs.' },
    { nome: 'Ana', texto: 'Fiquei sabendo que já tinha uma menina interessada em você.' },

    { nome: 'Alexandre', texto: 'Quem? A Daiane?' },
    { nome: 'Ana', texto: 'Tá vendo? Lembra até o nome dela.' },

    { nome: 'Alexandre', texto: 'Ela até falou comigo, mas sabe que não tenho nenhum interesse. Já deixei claro, rsrs.' },
    { nome: 'Ana', texto: 'Vou fingir que acredito.' },

    { nome: 'Alexandre', texto: 'E você? Como anda sua vida amorosa? rsrs.' },
    { nome: 'Ana', texto: 'Meio complicada… eu estava namorando, mas estamos dando um tempo.' },

    { nome: 'Alexandre', texto: 'Vixi… não quero atrapalhar nada, viu?' },
    { nome: 'Ana', texto: 'Nada. Acho que já deu o que tinha que dar. Ele nem mora aqui, era namoro à distância.' },

    { nome: 'Alexandre', texto: 'Então só espero que você faça o que for melhor pra você.' },
    { nome: 'Ana', texto: 'Eu também.' },

    { nome: 'Alexandre', texto: 'Já está ficando tarde…' },
    { nome: 'Ana', texto: 'Verdade. Meus pais vão estranhar se eu demorar muito.' },

    { nome: 'Alexandre', texto: 'Então vamos fazer assim… segunda-feira, depois da aula, a gente se encontra de novo?' },
    { nome: 'Ana', texto: 'À noite?' },

    { nome: 'Alexandre', texto: 'À noite. A gente sai pra comer um lanche.' },
    { nome: 'Ana', texto: 'Então combinado.' },

    { nome: 'Alexandre', texto: 'Vamos, eu te acompanho até em casa.' },
    { nome: 'Ana', texto: 'Meus pais vão estranhar você me levando de novo… ontem já perguntaram de você, rsrs.' },

    { nome: 'Alexandre', texto: 'Então é melhor eu ir me preparando pra conhecer meu futuro sogro e minha futura sogra.' },
    { nome: 'Ana', texto: 'kkkkkkk' },
    { nome: 'Ana', texto: 'Então vamos.' },
    ], () => {

      gameState.love += 10;
      atualizarHud.call(this);
      gameState.dialogoAtivo = false;
      this.playerEla.body.moves = true;
      this.playerEle.body.moves = true;
      mudarParaNoite(this, 2000)
      mudarCameraDePlayer(this.cameras.main, this.playerEla, this);
      gameState.missaoAtual = 'levarParaCasaSegundoEncontro';
      mostrarObjetivo.call(this, "Voltar para casa 🏡", 4000);
      atualizarMarcadorMissao.call(this);

    });

}


function chegouNaCasaSegundoEncontro() {
  gameState.dialogoAtivo = true;
  pararPersonagens.call(this);
  gameState.missaoAtual = null;
  atualizarMarcadorMissao.call(this);
  this.playerEla.setPosition(520, 1870);
  this.playerEle.setPosition(550, 1870);

  forcarDirecao(this.playerEle, 'ele', 'left');
  forcarDirecao(this.playerEla, 'ela', 'right');

  iniciarDialogo.call(this, [
    { nome: 'Ana', texto: 'Obrigada por me acompanhar até em casa de novo. Nossa tarde foi ótima… eu adorei 😁' },
    { nome: 'Alexandre', texto: 'Eu também gostei muito. Não poderia ter sido melhor.' },
    { nome: 'Ana', texto: 'Com certeza! 😊' },
    { nome: 'Alexandre', texto: 'Até poderia… mas deixamos isso para outro dia.' },
    { nome: 'Ana', texto: 'É verdade. Então tá bom… vai com Deus e toma cuidado na estrada.' },
    { nome: 'Alexandre', texto: 'Amém. Fica com Deus também. Boa noite.' }
  ], () => {
    pararPersonagens.call(this);
    gameState.personagemAtual = 'ele';
    moverPlayer.call(this, {
      personagem: this.playerEla,
      tipo: 'ela',
      x: 274,
      y: 1808,
      onFinish: () => {
        gameState.dialogoAtivo = false;
        pularSegunda.call(this);
        gameState.love += 20;
        atualizarHud.call(this);
      }
    });

  });
}

function pularSegunda() {

  this.time.delayedCall(1000, () => {
    gameState.dialogoAtivo = false;
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(650, () => {
      this.cameras.main.fadeIn(1, 0, 0, 0);
      this.playerEle.setVisible(false);
      irParaEscolaSegunda.call(this);
    });
  });

}

function irParaEscolaSegunda() {

  pararPersonagens.call(this);

  gameState.dialogoAtivo = false;
  this.playerEla.body.moves = false;
  mudarCameraDePlayer(this.cameras.main, this.playerEla, this);
  mudarParaDia(this, 1000)
  const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
    .setOrigin(0).setScrollFactor(0).setDepth(9000).setAlpha(1);

  const x = this.scale.width / 2 - 160;
  const y = this.scale.height / 2 - 60;

  const bg = this.add.graphics().fillStyle(0x000000, 0.85).fillRoundedRect(x, y, 320, 120, 16).setScrollFactor(0).setDepth(9100);
  const texto = this.add.text(x + 10, y + 35, 'Segunda-Feira', { fontSize: '32px', fontStyle: 'bold', color: '#ffffff' })
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
        gameState.missaoAtual = 'irParaEscolaSegundaFeira';
        gameState.subMissao = 'FalarComAlexandre';
        mostrarObjetivo.call(this, "Ir para a Escola", 4000);
        this.playerEle.setVisible(true);
        this.playerEle.setPosition(2962, 724);
      }
    });
  });
}


function conversarSegundaEscola() {

  gameState.dialogoAtivo = false;
  this.playerEla.body.moves = true;
  this.playerEle.body.moves = true;
  olharUmParaOutro.call(this, getPersonagemAtivo(this), getNpc(this));

  iniciarDialogo.call(this, [
    { nome: 'Ana', texto: 'Oi, me atrasei um pouco hoje 😁' },
    { nome: 'Alexandre', texto: 'Eu percebi, achei que não ia mais vir, mas agora sei o motivo de tanta demora.' },
    { nome: 'Ana', texto: 'Oque?' },
    { nome: 'Alexandre', texto: 'Você esta maravilhosa 😍💕' },
    { nome: 'Ana', texto: 'Aiaia, so você mesmo viu 😂 Estou normal como todos os outros dias' },
    { nome: 'Alexandre', texto: 'Exatamente.' },
    { nome: 'Ana', texto: 'Depois da Aula vamos la no Alemão mesmo?.' },
    { nome: 'Alexandre', texto: 'Claro.' },
    { nome: 'Ana', texto: 'Vamos pra a sala de Aula, jaja toca o sino.' },
    { nome: 'Alexandre', texto: 'Vamos.' }
  ], () => {
    pararPersonagens.call(this);
    gameState.dialogoAtivo = false;
    gameState.personagemAtual = 'ela';
    gameState.missaoAtual = 'irParaSaladeAula';
    mostrarObjetivo.call(this, "Sinal tocal, vá para sala de aula", 4000);
    gameState.subMissao = null;
    atualizarMarcadorMissao.call(this);

  });

}

function chegaranNaSala() {
  pararPersonagens.call(this);
  this.playerEla.body.moves = false;
  gameState.dialogoAtivo = false;
  gameState.missaoAtual = null;

  this.time.delayedCall(500, () => {

    atualizarMarcadorMissao.call(this);
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(650, () => {
      this.cameras.main.fadeIn(1, 0, 0, 0);
      this.playerEle.setVisible(false);
      inicioRecreio.call(this);
    });
  });
}

function inicioRecreio() {

  this.playerEle.setVisible(true);
  this.playerEla.body.moves = true;

  gameState.missaoAtual = 'dialogoRecreio';

  this.npcP1.setVisible(true);
  this.npcP2.setVisible(true);

  gameState.dialogoAtivo = false;
  mudarCameraDePlayer(this.cameras.main, this.playerEla, this);
  pararPersonagens.call(this);

  // Use as chaves corretas: npc1 e npc2
  this.npcP1.play('npc1-left');
  this.npcP1.anims.stop(); // Para ele ficar parado olhando para a esquerda

  this.npcP2.play('npc2-right');
  this.npcP2.anims.stop(); // Para ele ficar parado olhando para a direita

  this.playerEle.play('ele-up');
  this.playerEle.anims.stop(); // Para ele ficar parado olhando para a direita

  this.npcP1.setPosition(3088, 461);
  this.npcP2.setPosition(3025, 462);
  this.playerEla.setPosition(2934, 336);
  this.playerEle.setPosition(3053, 489);

  // mudarParaNoite(this, 0);

  const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
    .setOrigin(0).setScrollFactor(0).setDepth(9000).setAlpha(1);

  const x = this.scale.width / 2 - 160;
  const y = this.scale.height / 2 - 60;

  const bg = this.add.graphics().fillStyle(0x000000, 0.85).fillRoundedRect(x, y, 320, 120, 16).setScrollFactor(0).setDepth(9100);
  const texto = this.add.text(x + 70, y + 35, '🕒 18:00', { fontSize: '32px', fontStyle: 'bold', color: '#ffffff' })
    .setScrollFactor(0).setDepth(9200);

  let hora = 18;
  this.time.addEvent({
    delay: 600,
    repeat: 1,
    callback: () => {
      hora++;
      texto.setText(hora === 20 ? 'Recreio' : `🕒 ${hora}:00`);
    }
  });

  this.time.delayedCall(3500, () => {
    bg.destroy();
    texto.destroy();
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 700,
      onComplete: () => {
        overlay.destroy();
        atualizarMarcadorMissao.call(this);
      }
    });
  });
}


function iniciarDialogoRecreio() {

  gameState.dialogoAtivo = true;
  pararPersonagens.call(this);
  gameState.missaoAtual = null;
  atualizarMarcadorMissao.call(this);
  this.playerEla.setPosition(3053, 434);
  this.playerEla.play('ela-down');
  this.playerEla.anims.stop(); // Para ele ficar parado olhando para a direita

  iniciarDialogo.call(this, [
    { nome: 'Netinho', texto: 'E ai, Paulinha, tudo joia ? Fiquei sabendo que ja conheceu o meu cunhado Alexandre 😂' },
    { nome: 'Alexandre', texto: 'Cunhado? Estou sabendo disso não 🤣' },
    { nome: 'Ana', texto: 'Nem eu viu, so ele que esta namorando com sua irmão, mas ela não kkk' },
    { nome: 'Netinho', texto: 'Um dia será' },
    { nome: 'Ana', texto: 'Oque vão fazer depois da aula? Vamos ir la no Alemanão comer algo, querem ir?' },
    { nome: 'Luciano', texto: 'Pode ser.' },
    { nome: 'netinho', texto: 'Combinado, depois da aula vamos direto, esperamos vocês lá.' },
    { nome: 'Ana', texto: 'Combinado' }
  ], () => {

    gameState.dialogoAtivo = false;
    gameState.personagemAtual = 'ela';
    gameState.missaoAtual = 'finalRecreio';
    gameState.subMissao = 'finalRecreio';
    mostrarObjetivo.call(this, "Final, do recreio. Volte para a sala de aula", 4000);
    atualizarMarcadorMissao.call(this);
  });
}

function finalAula() {
  this.playerEle.setVisible(false);
  this.playerEla.setVisible(false);
  gameState.dialogoAtivo = false;
  pararPersonagens.call(this);
  gameState.missaoAtual = null;
  gameState.subMissao = null;

  this.time.delayedCall(1000, () => {
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(650, () => {
      this.cameras.main.fadeIn(1, 0, 0, 0);
      this.playerEle.setVisible(true);
      this.playerEla.setVisible(true);

      this.npcP1.setPosition(1593, 681);
      this.npcP2.setPosition(1635, 681);

      forcarDirecao(this.npcP1, 'npc1', 'right');
      forcarDirecao(this.npcP2, 'npc2', 'left');

      this.playerEla.setPosition(2934, 336);
      this.playerEle.setPosition(3046, 399);

      terceiroEncontro.call(this);
    });
  });
}

function terceiroEncontro() {

  // mudarParaNoite(this, 0);

  const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
    .setOrigin(0).setScrollFactor(0).setDepth(9000).setAlpha(1);

  const x = this.scale.width / 2 - 160;
  const y = this.scale.height / 2 - 60;

  const bg = this.add.graphics().fillStyle(0x000000, 0.85).fillRoundedRect(x, y, 320, 120, 16).setScrollFactor(0).setDepth(9100);
  const texto = this.add.text(x + 70, y + 35, '🕒 20:00', { fontSize: '32px', fontStyle: 'bold', color: '#ffffff' })
    .setScrollFactor(0).setDepth(9200);

  let hora = 20;
  this.time.addEvent({
    delay: 600,
    repeat: 1,
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
      duration: 700,
      onComplete: () => {
        overlay.destroy();
        gameState.missaoAtual = 'dialogoAlemao';
        //gameState.missaoAtual = 'irLanchoneteAlemao';
        gameState.subMissao = 'beijala';
        mostrarObjetivo.call(this, "Ir até a lanchonete do Alemão", 4000);
        atualizarMarcadorMissao.call(this);
      }
    });
  });
}

function dialogoAlemao() {

  gameState.dialogoAtivo = true;
  pararPersonagens.call(this);

  this.playerEla.setPosition(1604, 700);
  this.playerEle.setPosition(1611, 645);

  olharUmParaOutro.call(this, getPersonagemAtivo(this), getNpc(this));
  forcarDirecao(this.playerEla, 'ela', 'up');
  forcarDirecao(this.playerEle, 'ele', 'down');

  iniciarDialogo.call(this, [
    { nome: 'Netinho', texto: 'Vão querer jogar uma partida de sinuca primeiro ?' },
    { nome: 'Alexandre', texto: 'Pode ir jogando primeiro vocês, eu e a Paula vamos pedindo a pizza' },
    { nome: 'Ana', texto: 'Vão querer que sabor?' },
    { nome: 'Netinho', texto: 'Colobresa pra min kkkk' },
    { nome: 'Ana', texto: 'Tá ok' },
    { nome: 'Luciano', texto: 'Pra min pode ser de moda da casa.' },
    { nome: 'Alexandre', texto: 'Beleza' }
  ], () => {

    gameState.dialogoAtivo = false;
    gameState.personagemAtual = 'ela';
    gameState.missaoAtual = 'irparamesa';
    mostrarObjetivo.call(this, "Va para a mesa fazer o pedido", 4000);
    atualizarMarcadorMissao.call(this);

  });

}

function conversaAmigos() {

  gameState.dialogoAtivo = true;
  pararPersonagens.call(this);
  this.playerEla.setPosition(1380, 560);
  forcarDirecao(this.playerEla, 'ela', 'left');

  iniciarDialogo.call(this, [
    { nome: 'Netinho', texto: 'Pode ir lá, Xandi. Não vamos atrapalhar vocês rsrsrs.' },
    { nome: 'Netinho', texto: 'Só não enrola muito, já tô com fome 😂' },
    { nome: 'Alexandre', texto: 'Enrolar por quê? Somos só amigos, pô rsrsrs.' },
    { nome: 'Netinho', texto: 'Não é isso que eu vejo quando olha pra ela, todo mundo já sabe.' },
    { nome: 'Alexandre', texto: 'Vocês estão vendo muito já, isso que nem beberam kkkk.' },
    { nome: 'Luciano', texto: 'Vai lá, que vamos jogar um pouco.' },
    { nome: 'Alexandre', texto: 'Vou lá falar com a Ana.' }
  ], () => {

    gameState.dialogoAtivo = false;
    this.playerEla.body.moves = false
    mudarCameraDePlayer(this.cameras.main, this.playerEle, this);
    gameState.missaoAtual = 'irLanchoneteAlemao';
    mostrarObjetivo.call(this, "Ir até a mesa falar com a Ana", 4000);
    atualizarMarcadorMissao.call(this);

    moverPlayer.call(this, {
      personagem: this.npcP1,
      tipo: 'npc1',
      x: 1537,
      y: 624,
    });

    moverPlayer.call(this, {
      personagem: this.npcP2,
      tipo: 'npc2',
      x: 1584,
      y: 566,
      onFinish: () => {
        this.npcP2.play('npc2-left');
        this.npcP2.anims.stop(); // Para ele ficar parado olhando para a esquerda
      }
    });

  });

}

function iniciarDialogoAlemao() {
  gameState.dialogoAtivo = true;
  pararPersonagens.call(this);

  this.playerEla.setPosition(1380, 560);
  this.playerEle.setPosition(1339, 560);

  forcarDirecao(this.playerEle, 'ele', 'right');
  forcarDirecao(this.playerEla, 'ela', 'left');

  olharUmParaOutro.call(this, getPersonagemAtivo(this), getNpc(this));
  this.playerEla.body.moves = false;
  this.playerEle.body.moves = false;
  gameState.missaoAtual = null;
  gameState.subMissao = null;
  atualizarMarcadorMissao.call(this);

  iniciarDialogo.call(this, [
    { nome: 'Alexandre', texto: 'Segundo o Netinho, eu vim aqui com segundas intenções rsrsrsr' },
    { nome: 'Ana', texto: 'é né, e não foi ?' },
    { nome: 'Alexandre', texto: 'Claro que não, não é porque eu fiquei pensando em você o final de semana inteiro que eu estou com segundas intenções' },
    { nome: 'Ana', texto: 'Eita rsrsrs, o final de semana inteiro? Exagerado 🤣' },
    { nome: 'Alexandre', texto: 'Pior que foi mesmo.' },
    { nome: 'Ana', texto: 'Então porque não me ligou ? Agente podia ter se encontrado do Domingo novamente, já que você estava so pensando em min mesmo rsrsr' },
    { nome: 'Alexandre', texto: 'Eu não queria te sufocar. E tambem, foi bom deixar você sentir um pouco de saudades tambem.' },
    { nome: 'Ana', texto: 'E quem falou que eu fiquei com saudades ?' },
    { nome: 'Alexandre', texto: 'Ninguem, mas eu gosto de pensar que sim 😁' },
    { nome: 'Ana', texto: 'Pior que eu pensei uma ou duas vezes em vocês mesom 😊' },
    { nome: 'Alexandre', texto: 'Já é uma evolução né' },
    { nome: 'Ana', texto: 'Tavez' },


  ], () => {

    fadebeijo.call(this);

    gameState.dialogoAtivo = false;
    mudarCameraDePlayer(this.cameras.main, this.playerEla, this);
    gameState.missaoAtual = null;
    //mostrarObjetivo.call(this, "Sinal tocal, vá para sala de aula", 4000);
    gameState.subMissao = null;
    atualizarMarcadorMissao.call(this);

  });
}

function fadebeijo() {

  this.cameras.main.fadeOut(600, 0, 0, 0);
  this.time.delayedCall(650, () => {
    this.cameras.main.fadeIn(1, 0, 0, 0);
    antesdobeijo.call(this, 200);;


    this.playerEla.body.moves = false;
    pararPersonagens.call(this);

  });

}

function antesdobeijo() {

  const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
    .setOrigin(0).setScrollFactor(0).setDepth(9000).setAlpha(1);

  const x = this.scale.width / 2 - 160;
  const y = this.scale.height / 2 - 60;

  const textoBeijo = `
Entre um pedido e outro, eles conversavam sem pressa, como se o tempo tivesse decidido andar mais devagar naquela noite. Falavam de coisas simples: músicas favoritas, lembranças da infância, planos que ainda não tinham forma, mas já carregavam vontade.

A cada troca de olhares, o sorriso surgia com mais facilidade. O nervosismo inicial foi dando lugar a uma sensação confortável, quase familiar, como se já se conhecessem há mais tempo do que realmente tinham.

Depois de mais algumas conversas, muitas risadas, beijos no rosto e silêncios cheios de significado, ela respirou fundo. Aproximou-se um pouco mais e, com um sorriso tímido, tomou a iniciativa de beijá-lo.

Foi rápido, mas suficiente para transformar aquele encontro em algo inesquecível.
`;

  /// 1. Crie o fundo e o texto centralizados (como fizemos antes)
  const centroX = this.cameras.main.centerX;
  const centroY = this.cameras.main.centerY;
  const larguraFundo = 800;
  const alturaFundo = 500;

  const bg = this.add.graphics()
    .fillStyle(0x000000, 0.85)
    .fillRoundedRect(centroX - larguraFundo / 2, centroY - alturaFundo / 2, larguraFundo, alturaFundo, 16)
    .setScrollFactor(0)
    .setDepth(9100);

  const texto = this.add.text(centroX, centroY, textoBeijo, {
    fontSize: '22px',
    color: '#ffffff',
    wordWrap: { width: larguraFundo - 60 },
    lineSpacing: 8,
    align: 'center'
  })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(9200);

  // 2. Adicione uma instrução visual para o jogador saber o que fazer
  const instrucao = this.add.text(centroX, centroY + (alturaFundo / 2) + 45, 'Pressione ESPAÇO para continuar', {
    fontSize: '42px',
    color: '#ffffff'
  })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(9201);

  // 3. Crie a função que vai fechar a tela
  const fecharTela = () => {
    // Remove o evento de teclado para não disparar duas vezes
    this.input.keyboard.off('keydown-SPACE', fecharTela);
    olharUmParaOutro.call(this, getNpc(this), getPersonagemAtivo(this));
    gameState.dialogoAtivo = true;

    // Destrói os elementos visuais
    bg.destroy();
    texto.destroy();
    instrucao.destroy();

    // Inicia o fade out do overlay e segue com a lógica do jogo
    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 700,
      onComplete: () => {
        overlay.destroy();

        // 1. Faz os dois se aproximarem (um passo à frente)
        this.tweens.add({
          targets: this.playerEla,
          x: this.playerEle.x + 20, // Ajusta para ficarem bem próximos
          duration: 1000,
          ease: 'Power1'
        });

        this.tweens.add({
          targets: this.playerEle,
          x: this.playerEle.x + 5, // Pequeno ajuste de posição
          duration: 1000,
          ease: 'Power1',
          onComplete: () => {
            // 2. Cria o coração acima deles quando se tocam
            const coracao = this.add.text(
              (this.playerEla.x + this.playerEle.x) / 2,
              this.playerEle.y - 40,
              '❤️',
              { fontSize: '40px' }
            ).setOrigin(0.5).setDepth(10000);

            // 3. Efeito de Pulsar (Coração batendo)
            this.tweens.add({
              targets: coracao,
              scale: 1.5,       // Aumenta o tamanho
              duration: 400,    // Velocidade da batida
              yoyo: true,       // Volta ao tamanho original
              repeat: 5,        // Quantas vezes vai pulsar
              onComplete: () => {
                // 4. Finaliza a cena e segue para a próxima missão
                this.tweens.add({
                  targets: coracao,
                  alpha: 0,
                  duration: 500,
                  onComplete: () => {
                    coracao.destroy();
                    gameState.love += 30;
                    atualizarHud.call(this);
                    this.playerEle.body.moves = true;
                    gameState.missaoAtual = null;
                    gameState.subMissao = null;
                    //mostrarObjetivo.call(this, "Ir até a lanchonete do Alemão", 4000);
                    //atualizarMarcadorMissao.call(this);
                    iniciarDialogo.call(this, [
                      { nome: 'Netinho', texto: 'Aeeeeee, achei que não ia acontecer nunca isso 😂' },
                      { nome: 'Luciano', texto: 'Eu ja não aguentava mais jogar 🤣🤣' },
                      { nome: 'Netinho', texto: 'Pessoal, ja vamos indo, podem ficar avontade rsrsrs' },
                      { nome: 'Alexandre', texto: 'Até amanhã' },

                    ], () => {

                      gameState.missaoAtual = null;
                      gameState.subMissao = null;
                      this.playerEla.body.moves = true;
                      iniciarJornadaNPC(this.npcP1, 'npc1', this);
                      iniciarJornadaNPC(this.npcP2, 'npc2', this);
                      this.playerEla.setPosition(1380, 560);
                      this.playerEle.setPosition(1339, 560);

                      iniciarDialogo.call(this, [

                        { nome: 'Alexandre', texto: 'Então quem estava com segundas intenções era você rsrsr' },
                        { nome: 'Ana', texto: 'Porque eu? Quem estava querendo me beijar mais não tinha corragem era você 😆' },
                        { nome: 'Alexandre', texto: 'Eu nada, eu estava deboa qui, so conversando mesmo, sem nenhuma intenção a não ser te conhecer melhor 😜' },
                        { nome: 'Ana', texto: 'Sei, eu vi o jeito que você estava me olhando tá rapaizinho' },
                        { nome: 'Alexandre', texto: 'Eu estava vendo vendo o tanto que você estava dando risada e me abraçando toda hora rsrr inclusive me dando beijos no rosto 😘' },
                        { nome: 'Ana', texto: 'Eu estava esperando você tomar iniciativa uai rsrsrsrr' },
                        { nome: 'Alexandre', texto: 'Eu ia, mas você não soube esperar kkkkk. Mas que bom que você não esperou, provavelmente eu não ia ter corragem mesmo rssrrs' },
                        { nome: 'Ana', texto: 'Pelo jeito que estava indo acho que não ia mesmo 😂' },
                        { nome: 'Alexandre', texto: 'Gostei muito do beijo, só reforçou oque eu estava sentindo por você' },
                        { nome: 'Ana', texto: 'Quem bom, eu gostei muito tambem, mesmo eu tendo que forçar um pouco abarra' },
                        { nome: 'Ana', texto: 'Acho que eu preciso ir agora, ja esta muito tarde mesmo.' },
                        { nome: 'Alexandre', texto: 'Que pena, queria ficar mais um pouco com você.' },
                        { nome: 'Ana', texto: 'Vamos indo, ai você aproveita esse resto de tempo' },
                        { nome: 'Alexandre', texto: 'Então vamos' },
                      ], () => {

                        gameState.missaoAtual = 'levarParaCasaTerceiroEncontro';
                        gameState.subMissao = null;
                        mostrarObjetivo.call(this, "Voltar para casa 🏡", 4000);
                        atualizarMarcadorMissao.call(this);

                      });

                    });

                  }
                });
              }
            });
          }
        });
      }
    });
  };

  // 4. Ativa o escutador de teclado
  this.input.keyboard.on('keydown-SPACE', fecharTela);

}

function levarParaCasaTerceiroEncontro() {
  gameState.dialogoAtivo = true;
  pararPersonagens.call(this);
  gameState.missaoAtual = null;
  atualizarMarcadorMissao.call(this);
  this.playerEla.setPosition(520, 1870);
  this.playerEle.setPosition(550, 1870);

  forcarDirecao(this.playerEle, 'ele', 'left');
  forcarDirecao(this.playerEla, 'ela', 'right');

  iniciarDialogo.call(this, [
    { nome: 'Ana', texto: 'Me diverti muito hoje.' },
    { nome: 'Alexandre', texto: 'Quem bom, eu tambem, de mais 💕' },
    { nome: 'Ana', texto: 'Posso te falar uma coisa?' },
    { nome: 'Alexandre', texto: 'Hummm?, claro que pode.' },
    { nome: 'Ana', texto: 'Eu não estava dando um tempo e nem namorando rsrsrs, so falei aqui pra ver sua reação 😁' },
    { nome: 'Alexandre', texto: 'Então a noite acanbou de ficar ainda melhor 😍. Será que você pode ficar mais um pouco aqui comigo ?' },
    { nome: 'Ana', texto: 'Melhor não, minha mãe jaja vem aqui fora 😂' },
    { nome: 'Alexandre', texto: 'Ta bom rsrsrs, pelomenos posso te ligar mais tarde ?' },
    { nome: 'Ana', texto: 'Claro que pode' },
    { nome: 'Alexandre', texto: 'Combinado' },
    { nome: 'Ana', texto: 'Tchau, boia noite' }
  ], () => {

    if (this.dialogo && this.dialogo.bg) {
      this.dialogo.bg.setVisible(false);
      this.dialogo.nome.setVisible(false);
      this.dialogo.texto.setVisible(false);
    }

    // 2. Define a lista de opções para este momento específico do jogo
    const opcoesDaConversa = [
      { texto: 'Beijala', acao: beijala },
      { texto: 'Dar tchau', acao: darTchau }
    ];

    this.playerEle.body.moves = false;
    this.playerEla.body.moves = false;
    pararPersonagens.call(this);
    gameState.personagemAtual = null;

    // 3. Chama a função reutilizável para mostrar as opções na tela
    mostrarOpcoes(this, opcoesDaConversa);

  });

}

function beijala() {
  olharUmParaOutro.call(this, getNpc(this), getPersonagemAtivo(this));
  gameState.dialogoAtivo = true;

  // 1. Faz os dois se aproximarem (um passo à frente)
  this.tweens.add({
    targets: this.playerEle,
    x: this.playerEla.x + 18, // Ajusta para ficarem bem próximos
    duration: 1000,
    ease: 'Power1'
  });

  this.tweens.add({
    targets: this.playerEla,
    x: this.playerEla.x + 5, // Pequeno ajuste de posição
    duration: 1000,
    ease: 'Power1',
    onComplete: () => {
      // 2. Cria o coração acima deles quando se tocam
      const coracao = this.add.text(
        (this.playerEle.x + this.playerEla.x) / 2,
        this.playerEla.y - 40,
        '❤️',
        { fontSize: '40px' }
      ).setOrigin(0.5).setDepth(10000);

      // 3. Efeito de Pulsar (Coração batendo)
      this.tweens.add({
        targets: coracao,
        scale: 1.5,       // Aumenta o tamanho
        duration: 400,    // Velocidade da batida
        yoyo: true,       // Volta ao tamanho original
        repeat: 5,        // Quantas vezes vai pulsar
        onComplete: () => {
          // 4. Finaliza a cena e segue para a próxima missão
          this.tweens.add({
            targets: coracao,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              coracao.destroy();
              gameState.love += 30;
              atualizarHud.call(this);
              this.playerEle.body.moves = true;
              this.playerEla.body.moves = true;
              gameState.missaoAtual = null;
              gameState.subMissao = null;

              iniciarDialogo.call(this, [
                { nome: 'Ana', texto: 'Tchau, boa noite.' },
              ], () => {

                gameState.missaoAtual = null;
                gameState.subMissao = null;
                pararPersonagens.call(this);
                this.cameras.main.fadeOut(600, 0, 0, 0);
                this.time.delayedCall(650, () => {
                  this.cameras.main.fadeIn(1, 0, 0, 0);
                  this.playerEle.setVisible(false);
                  mudarCameraDePlayer(this.cameras.main, this.playerEla, this);
                });

              });

            }
          });
        }
      });
    }
  });

}

function darTchau() {

  pararPersonagens.call(this);
  mudarCameraDePlayer(this.cameras.main, this.playerEle, this);
  moverPlayer.call(this, {
    personagem: this.playerEla,
    tipo: 'ela',
    x: 274,
    y: 1808,
    onFinish: () => {
      gameState.dialogoAtivo = false;
      gameState.love += 5;
      atualizarHud.call(this);
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => {
        this.cameras.main.fadeIn(1, 0, 0, 0);
        this.playerEle.setVisible(false);
        mudarCameraDePlayer(this.cameras.main, this.playerEla, this);
      });
    }
  });
}

function iniciarJornadaNPC(npc, tipoAnimacao, cena) {
  // Posições de destino
  const pos1 = { x: 1579, y: 777 };
  const pos1_alt = { x: 1600, y: 728 }; // alternativa para outro NPC
  const pos2 = { x: 3184, y: 771 };
  const pos2_alt = { x: 3184, y: 728 }; // destino alternativo

  // Define destinos baseado no NPC
  const primeiraPos = (npc === cena.npcP1) ? pos1_alt : pos1;
  const segundaPos = (npc === cena.npcP1) ? pos2 : pos2_alt;

  console.log(`Iniciando movimento do NPC para (${primeiraPos.x}, ${primeiraPos.y})`);

  // 1. Mover para a primeira posição
  moverPlayer.call(cena, {
    personagem: npc,
    tipo: tipoAnimacao,
    x: primeiraPos.x,
    y: primeiraPos.y,

    onFinish: () => {
      console.log(`Chegou à primeira posição. Indo para (${segundaPos.x}, ${segundaPos.y})`);

      // 2. Mover para a segunda posição
      moverPlayer.call(cena, {
        personagem: npc,
        tipo: tipoAnimacao,
        x: segundaPos.x,
        y: segundaPos.y,

        onFinish: () => {
          npc.setVisible(false);
          console.log('Jornada do NPC concluída!');
        }
      });
    }
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

function enviarMensagemAlexandre() {
  gameState.missaoAtual = 'EnviarMensagemAlexandre';
  gameState.subMissao = null;
  gameState.personagemAtual = 'ela';
  this.cameras.main.startFollow(this.playerEla);
  this.playerEla.setPosition(882, 798);
}

function encontroPracaterere() {
  gameState.love += 10;
  atualizarHud.call(this);
  gameState.dialogoAtivo = false;
  this.playerEla.body.moves = true;
  this.playerEle.body.moves = true;
  //mudarParaNoite(this, 2000)
  this.playerEla.setPosition(1471, 624);
  this.playerEle.setPosition(1471, 624);
  mudarCameraDePlayer(this.cameras.main, this.playerEla, this);
  // gameState.missaoAtual = 'levarParaCasaSegundoEncontro';
  //mostrarObjetivo.call(this, "Voltar para casa 🏡", 4000);
  //atualizarMarcadorMissao.call(this);
  //gameState.missaoAtual = 'irLanchoneteAlemao';
  gameState.subMissao = 'beijala';
  mostrarObjetivo.call(this, "Ir até a lanchonete do Alemão", 4000);
  atualizarMarcadorMissao.call(this);
}

// --- 6. MOVIMENTAÇÃO E ANIMAÇÕES ---

function criarAnimacoes(scene) {
  // Adicione 'npc1' e 'npc2' na lista de tipos
  const tipos = ['ela', 'ele', 'npc1', 'npc2'];

  tipos.forEach(tipo => {
    // Define qual sprite usar para cada tipo
    let spriteKey;
    if (tipo === 'ela') spriteKey = 'playerEla';
    else if (tipo === 'ele') spriteKey = 'playerEle';
    else if (tipo === 'npc1') spriteKey = 'npcP1';
    else if (tipo === 'npc2') spriteKey = 'npcP2';

    ['down', 'left', 'right', 'up'].forEach(dir => {
      scene.anims.create({
        key: `${tipo}-${dir}`,
        frames: scene.anims.generateFrameNumbers(spriteKey, { frames: FRAMES[tipo][dir] }),
        frameRate: 8,
        repeat: -1
      });
    });

    // Animações de Idle (Respiração)
    ['down', 'left', 'right', 'up'].forEach(dir => {
      scene.anims.create({
        key: `${tipo}-idle_${dir}`,
        frames: scene.anims.generateFrameNumbers(spriteKey, { frames: FRAMES[tipo][`idle_${dir}`] }),
        frameRate: 2, // Velocidade lenta para efeito de respiração
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