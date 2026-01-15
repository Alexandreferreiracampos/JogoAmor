/**
 * JOGO PHASER - REORGANIZADO E CORRIGIDO
 * -------------------------
 * Estrutura:
 * 1. Configurações e Constantes
 * 2. Estado do Jogo
 * 3. Funções Principais (preload, create, update)
 * 4. Sistema de Diálogos
 * 5. Sistema de Missões e Eventos
 * 6. Movimentação e Animações
 * 7. Interface (HUD)
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
  love: 0,
  encontroAtivado: false,
  jogoFinalizado: false // Nova flag para evitar loops no fim
};

new Phaser.Game(config);

// --- 3. FUNÇÕES PRINCIPAIS ---

function preload() {
  this.load.image('tiles', 'assets/tiles.png');
  this.load.tilemapTiledJSON('mapa', 'assets/cidade.json');

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
  this.playerEle = this.physics.add.sprite(2382, 682, 'playerEle', FRAMES.ele.idle);

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
  criarDialogo.call(this);
}


function update() {
  if (gameState.dialogoAtivo) return;

  // 1. Identificar quem é quem (usando as funções que já existem no seu código)
  const player = getPersonagemAtivo(this); 
  const npc = getNpc(this); // Certifique-se que esta função existe no final do seu arquivo
  
  // 2. Definir o tipo do NPC para as animações
  const tipoNpc = gameState.personagemAtual === 'ela' ? 'ele' : 'ela';
  const speed = 120;

  // 3. Lógica de Seguimento
  const missoesDeSeguir = ['levarParaCasa', 'irPizzaria', 'elaSegueEle'];
  
  // Verificamos se o npc existe antes de tentar movê-lo para evitar erros
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

  // 4. Movimentação do Jogador Ativo (Seu código original de setas)
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
    .setDepth(1000)
    .setVisible(false);

  this.dialogo.nome = this.add.text(x + 20, y + 10, '', {
    fontSize: '30px',
    fontStyle: 'bold',
    color: '#ffd166'
  }).setScrollFactor(0).setDepth(1001).setVisible(false);

  this.dialogo.texto = this.add.text(x + 20, y + 35, '', {
    fontSize: '30px',
    wordWrap: { width: largura - 40 }
  }).setScrollFactor(0).setDepth(1001).setVisible(false);

  this.input.keyboard.on('keydown-SPACE', () => {
    if (gameState.dialogoAtivo) avancarDialogo.call(this);
  });
}

function iniciarDialogo(falas, aoFinal = null) {
  gameState.dialogoAtivo = true;
  this.dialogo.falas = falas;
  this.dialogo.index = 0;
  this.dialogo.aoFinal = aoFinal;
  mostrarFala.call(this);
}

function mostrarFala() {
  const fala = this.dialogo.falas[this.dialogo.index];
  this.dialogo.bg.setVisible(true);
  this.dialogo.nome.setVisible(true);
  this.dialogo.texto.setVisible(true);
  this.dialogo.nome.setText(fala.nome);
  this.dialogo.texto.setText('');

  let i = 0;
  this.dialogo.timer = this.time.addEvent({
    delay: 30,
    repeat: fala.texto.length - 1,
    callback: () => {
      this.dialogo.texto.text += fala.texto[i];
      i++;
    }
  });
}

function avancarDialogo() {
  if (this.dialogo.timer && this.dialogo.timer.getProgress() < 1) {
    this.dialogo.timer.remove();
    this.dialogo.texto.setText(this.dialogo.falas[this.dialogo.index].texto);
    return;
  }

  this.dialogo.index++;
  if (this.dialogo.index >= this.dialogo.falas.length) {
    fecharDialogo.call(this);
  } else {
    mostrarFala.call(this);
  }
}

function fecharDialogo() {
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
  this.zonaEscola = this.add.zone(2930, 400, 200, 64);
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

  // Colisões entre Personagens
  this.physics.add.overlap(this.playerEle, this.playerEla, () => {
    if (gameState.missaoAtual === 'conhecer' && !gameState.encontroAtivado) {
      iniciarEncontro.call(this);
    } else if (gameState.missaoAtual === 'falarComEla' && !gameState.dialogoAtivo) {
      iniciarConvitePizza.call(this);
    }
  });
}

function trocarParaEle() {
  gameState.personagemAtual = 'ele';
  gameState.missaoAtual = 'conhecer';
  this.playerEla.body.moves = false;
  pararPersonagens.call(this);
  this.cameras.main.startFollow(this.playerEle);
  console.log('Ela chegou. Agora vá conhecê-la.');
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
  gameState.personagemAtual = 'ele';
  this.cameras.main.startFollow(this.playerEle);
  console.log('Missão: Vá para a sala de aula (ELE)');
}

function eleChegouNaSala() {
  gameState.subMissao = 'elaVai';
  this.playerEle.setVelocity(0);
  this.playerEle.anims.stop();
  this.playerEle.setVisible(false);
  this.playerEla.body.moves = true;
  gameState.personagemAtual = 'ela';
  this.cameras.main.startFollow(this.playerEla);
  console.log('Agora leve ELA até a sala de aula');
}

function ambosNaSala() {
  gameState.subMissao = 'aulaFinalizada';
  pararPersonagens.call(this);

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
  gameState.personagemAtual = 'ele';
  this.cameras.main.startFollow(this.playerEle);

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
  console.log('Aula acabou. Missão 3 liberada ❤️');
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
  gameState.personagemAtual = 'ele';
  this.cameras.main.startFollow(this.playerEle);
  this.playerEle.body.moves = true;
  console.log('Missão: Siga Alexandre até a pizzaria');
}

function iniciarDialogoPizza() {
  gameState.subMissao = 'comendoPizza';
  pararPersonagens.call(this);

   this.playerEla.setPosition(2342, 682);
  this.playerEle.setPosition(2384, 682);
  
  olharUmParaOutro.call(this, getPersonagemAtivo(this), getNpc(this));

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
  gameState.personagemAtual = 'ela';
  this.cameras.main.startFollow(this.playerEla);

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
  gameState.subMissao = null;
  gameState.personagemAtual = 'ela';
  this.cameras.main.startFollow(this.playerEla);
  
}


function chegouNaCasa() {
  gameState.dialogoAtivo = true;
  pararPersonagens.call(this);

  this.playerEla.setPosition(520, 1850);
  this.playerEle.setPosition(550, 1850);


  forcarDirecao(this.playerEle, 'ele', 'left');
  forcarDirecao(this.playerEla, 'ela', 'right');

  
  iniciarDialogo.call(this, [
    { nome: 'Ana', texto: 'Obrigada por me trazer em casa, Alexandre. A noite foi ótima!' },
    { nome: 'Alexandre', texto: 'Eu que agradeço, Ana. A gente se vê na escola?' },
    { nome: 'Ana', texto: 'Com certeza! Tchauzinho 😊' }
  ], () => {
    mostrarOpcoesFinal.call(this);
  });
}

function mostrarOpcoesFinal() {
  
  gameState.dialogoAtivo = true;

  gameState.missaoAtual = 'novaMissao'; 
  pararPersonagens.call(this);
  forcarDirecao(this.playerEle, 'ele', 'left');
  forcarDirecao(this.playerEla, 'ela', 'right');

  // 2. ESCONDER A CAIXA DE DIÁLOGO (Adicione estas linhas abaixo)
  if (this.dialogo) {
    if (this.dialogo.timer) this.dialogo.timer.remove(); // Para o texto se estiver digitando
    this.dialogo.bg.setVisible(false);    // Esconde o fundo preto
    this.dialogo.nome.setVisible(false);  // Esconde o nome
    this.dialogo.texto.setVisible(false); // Esconde o texto
    this.dialogo.texto.setText('');       // Limpa o conteúdo do texto
  }

  // 3. Limpar botões antigos se existirem (prevenção)
  if (this.botoesOpcoes) {
    this.botoesOpcoes.forEach(b => { 
      if(b.bg) b.bg.destroy(); 
      if(b.txt) b.txt.destroy(); 
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
      .setDepth(10000); // Depth bem alto

    const txt = this.add.text(x, y, opcao.texto, {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10001);

    bg.on('pointerover', () => bg.setFillStyle(0x444444, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x000000, 0.8));
    
    bg.on('pointerdown', () => {
      // Destruir botões imediatamente ao clicar
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
    { nome: 'Ana', texto: 'Quem sabe em um próximo encontro? 😉' }
  ], () => {
    this.time.delayedCall(100, () => { mostrarOpcoesFinal.call(this); });
  });
}

function escolherIrEmbora() {
  iniciarDialogo.call(this, [
    { nome: 'Alexandre', texto: 'Bom, então é isso. Boa noite, Ana!' },
    { nome: 'Ana', texto: 'Ué, já vai? Você não está esquecendo de me pedir nada não? rsrs' }
  ], () => {
    this.time.delayedCall(100, () => { mostrarOpcoesFinal.call(this); });
  });
}

function escolherTelefone() {
  iniciarDialogo.call(this, [
    { nome: 'Alexandre', texto: 'Ana, eu adorei te conhecer... será que eu poderia anotar seu telefone?' },
    { nome: 'Ana', texto: 'Claro! Anota aí: 99999-8888. Me manda um "oi" depois, tá?' },
    { nome: 'Alexandre', texto: 'Pode deixar! Boa noite, Ana.' }
  ], () => { iniciarProximaMissao.call(this); });
  gameState.love += 10;
  atualizarHud.call(this);
}

function iniciarProximaMissao() {
  gameState.missaoAtual = 'novaMissao'; 
  gameState.personagemAtual = 'ele';
  this.cameras.main.startFollow(this.playerEle);
  console.log('Missão: Ana entrou em casa. Agora Alexandre deve voltar para a fazenda.');
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
  console.log("Atalho: Pulando para o final na casa da Ana...");
  
  // Configura o estado da missão
  gameState.missaoAtual = 'levarParaCasa';
  gameState.subMissao = null;
  gameState.personagemAtual = 'ela';
  gameState.dialogoAtivo = false;

  // Posiciona os personagens na frente da casa da Ana
  // Coordenadas baseadas na zonaCasa (520, 1892)
  this.playerEla.setPosition(520, 1850);
  this.playerEle.setPosition(550, 1850);

  // Ajusta a câmera
  this.cameras.main.startFollow(this.playerEla);
  
  // Para qualquer movimento residual
  //pararPersonagens.call(this);
  
  // Força a direção para parecer natural
  forcarDirecao(this.playerEle, 'ele', 'left');
  forcarDirecao(this.playerEla, 'ela', 'right');

  console.log("Chegou! Agora basta dar um passo em direção à zona da casa para ativar o diálogo final.");
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

function moverEleParaPizzaria() {
  const destinoX = this.zonaPizzaria.x;
  const destinoY = this.zonaPizzaria.y;
  const dx = destinoX - this.playerEle.x;
  const dy = destinoY - this.playerEle.y;

  this.physics.moveTo(this.playerEle, destinoX, destinoY, 80);

  if (Math.abs(dx) > Math.abs(dy)) {
    this.playerEle.anims.play(dx > 0 ? 'ele-right' : 'ele-left', true);
  } else {
    this.playerEle.anims.play(dy > 0 ? 'ele-down' : 'ele-up', true);
  }

  if (Phaser.Math.Distance.Between(this.playerEle.x, this.playerEle.y, destinoX, destinoY) < 8) {
    this.playerEle.setVelocity(0);
    this.playerEle.anims.stop();
  }
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
