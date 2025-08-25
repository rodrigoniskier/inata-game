/*
 * Jogo didático de imunidade inata
 *
 * Este script gerencia a lógica do jogo, incluindo a inicialização do motor Three.js,
 * o controle do jogador em primeira pessoa, a apresentação de diálogos e quizzes,
 * bem como a navegação pelas diferentes fases. O objetivo é oferecer uma
 * experiência educativa divertida, ensinando conceitos de imunologia inata através
 * de exploração e interação.
 */

// Seletores para as telas e elementos de UI
const loginScreen = document.getElementById('loginScreen');
const playerNameInput = document.getElementById('playerName');
const startButton = document.getElementById('startButton');
const gameCanvas = document.getElementById('gameCanvas');
const overlay = document.getElementById('overlay');
const dialogueBox = document.getElementById('dialogueBox');
const dialogueAvatar = document.getElementById('dialogueAvatar');
const dialogueText = document.getElementById('dialogueText');
const dialogueNext = document.getElementById('dialogueNext');
const quizContainer = document.getElementById('quizContainer');
const puzzleContainer = document.getElementById('puzzleContainer');
const scoreScreen = document.getElementById('scoreScreen');
const scoreList = document.getElementById('scoreList');
const playAgainButton = document.getElementById('playAgain');

// Caminhos relativos das imagens de avatar (copiados em assets posteriormente)
const avatars = {
  aria: 'assets/aria.png',
  kaoru: 'assets/kaoru.png'
};

// Variáveis globais do jogo
let scene, camera, renderer, controls;
let moveForward = false,
  moveBackward = false,
  moveLeft = false,
  moveRight = false;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let enemies = [];

let playerName = '';
let playerScore = 0;
let currentPhase = 0;

// Definição de perguntas de quiz para cada fase
const quizzes = [
  // Prologue quiz
  [
    {
      question: 'Qual a principal diferença entre a imunidade inata e a adaptativa?',
      options: [
        'A inata tem memória e especificidade enquanto a adaptativa é rápida e estereotipada',
        'A adaptativa possui memória e especificidade enquanto a inata é rápida e sem memória',
        'A inata é mediada por linfócitos T e B',
        'A adaptativa não interage com a inata'
      ],
      answer: 1
    }
  ],
  // Fase 1 quiz
  [
    {
      question: 'Qual destas famílias de PRRs está presente na membrana plasmática e nos endossomos?',
      options: ['NLRs', 'TLRs', 'RLRs', 'CLRs'],
      answer: 1
    },
    {
      question: 'PAMPs referem‑se a:',
      options: [
        'Padrões moleculares associados a patógenos',
        'Moléculas endógenas liberadas por células danificadas',
        'Anticorpos produzidos por linfócitos B',
        'Sequências de MHC'
      ],
      answer: 0
    }
  ],
  // Fase 2 quiz
  [
    {
      question: 'NETose em neutrófilos envolve:',
      options: [
        'Ejeção de DNA e proteínas para aprisionar patógenos',
        'Apoptose programada por caspases 8/9',
        'Secreção de anticorpos IgG',
        'Ativação de linfócitos T'
      ],
      answer: 0
    }
  ],
  // Fase 3 quiz
  [
    {
      question: 'Os inflamassomas não canônicos dependem principalmente de qual conjunto de caspases?',
      options: [
        'Caspases 1/3',
        'Caspases 8/9',
        'Caspases 4/5/11',
        'Caspases 2/6'
      ],
      answer: 2
    }
  ],
  // Fase 4 quiz
  [
    {
      question: 'O complossoma intracelular está associado a:',
      options: [
        'Integração de sinais do complemento com metabolismo celular (ATP, ROS)',
        'Produção de imunoglobulinas',
        'Transcrição de genes TCR',
        'Inibição de células NK'
      ],
      answer: 0
    }
  ],
  // Fase 5 quiz
  [
    {
      question: 'A imunidade treinada envolve reprogramação epigenética (como H3K4me3) e está associada a:',
      options: [
        'Aumento de glicólise e produção de IL‑6/TNF‑α',
        'Redução de metabolismo e tolerância',
        'Clonagem de anticorpos',
        'Apoptose espontânea'
      ],
      answer: 0
    }
  ],
  // Fase 6 quiz
  [
    {
      question: 'Terapias CAR‑NK e CAR‑macrófagos têm como objetivo:',
      options: [
        'Reprogramar células inatas para reconhecer e atacar tumores',
        'Substituir células B na produção de anticorpos',
        'Neutralizar o complemento C5',
        'Induzir NETose em neutrófilos'
      ],
      answer: 0
    }
  ],
  // Final quiz
  [
    {
      question: 'Por que a integração entre imunidade inata e adaptativa é essencial?',
      options: [
        'Porque ambas trocam sinais e modulam‑se mutuamente, permitindo respostas flexíveis',
        'Porque a inata sempre suprime a adaptativa',
        'Porque a adaptativa não depende da inata',
        'Porque os dois sistemas atuam isoladamente'
      ],
      answer: 0
    }
  ]
];

// Diálogos para cada fase (lista de objetos com texto e speaker)
const dialogues = [
  [
    { speaker: 'aria', text: 'Bem‑vindo, pesquisador(a)! Eu sou Aria, sua assistente virtual. Vamos explorar o universo da imunidade inata.' },
    { speaker: 'kaoru', text: 'Sou Kaoru, imunologista em treinamento. Dizem que a imunidade inata é apenas uma barreira rápida... será?' },
    { speaker: 'aria', text: 'Na verdade, ela é muito mais: dinâmica, plástica e até com memória! Nossa missão é descobrir por que os receptores de reconhecimento de padrões estão desorganizados.' }
  ],
  [
    { speaker: 'aria', text: 'Esta é a superfície epitelial – um mosaico vivo de células. Aqui vamos procurar pelos PRRs perdidos: TLRs, NLRs, RLRs, cGAS‑STING e os recém‑descobertos cGLRs.' },
    { speaker: 'kaoru', text: 'Cada um reconhece padrões diferentes: PAMPs de microrganismos ou DAMPs de dano tecidual. Vamos coletá‑los para restaurar a vigilância!' }
  ],
  [
    { speaker: 'aria', text: 'Agora mergulhamos na corrente sanguínea. Neutrófilos circulantes formam armadilhas extracelulares – as NETs.' },
    { speaker: 'kaoru', text: 'Precisamos ajustar cálcio e NADPH oxidase para liberar NETs no momento certo, evitando trombose.' }
  ],
  [
    { speaker: 'aria', text: 'Estamos no interior da célula. Hora de montar inflamassomas – plataformas que ativam caspase‑1 e liberam IL‑1β.' },
    { speaker: 'kaoru', text: 'Existem inflamassomas canônicos como NLRP3 e AIM2 e vias não canônicas mediadas por caspases 4/5/11.' }
  ],
  [
    { speaker: 'aria', text: 'Chegamos ao complossoma – uma versão intracelular do sistema complemento, ligada ao metabolismo.' },
    { speaker: 'kaoru', text: 'Precisamos equilibrar ATP, espécies reativas de oxigênio e fragmentos C3a/C5a para uma resposta adequada.' }
  ],
  [
    { speaker: 'aria', text: 'Estamos na medula óssea. Vamos treinar a imunidade com vacinas de mRNA, BCG ou β‑glucana.' },
    { speaker: 'kaoru', text: 'A memória inata resulta de alterações epigenéticas (H3K4me3, H3K27ac) e mudanças metabólicas, como aumento da glicólise.' }
  ],
  [
    { speaker: 'aria', text: 'Entramos nos tumores. Usaremos CAR‑NK e CAR‑macrófagos para atacar o microambiente tumoral.' },
    { speaker: 'kaoru', text: 'Também vamos explorar as ILC3s de memória e fibroblastos sentinelas, aliados na imunoterapia do futuro.' }
  ],
  [
    { speaker: 'aria', text: 'Parabéns! Você restaurou o equilíbrio da imunidade inata e integrou‑a com a resposta adaptativa.' },
    { speaker: 'kaoru', text: 'Esse conhecimento abre caminho para novas terapias e vacinas. Continue explorando e aprendendo!' }
  ]
];

// Cores de ambiente para cada fase (por diversão visual)
const phaseColors = [
  0x88c0d0, // prólogo: azul claro
  0xa3be8c, // epitélio: verde suave
  0xbf616a, // sangue: vermelho suave
  0xb48ead, // inflamassoma: lilás
  0xebb55a, // complossoma: amarelo
  0xd08770, // medula: laranja
  0x5e81ac, // tumores: azul escuro
  0x8fa1b3  // final: cinza‑azul
];

// Eventos de teclado para movimentação
const onKeyDown = function (event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveForward = true;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveLeft = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveBackward = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveRight = true;
      break;
  }
};

const onKeyUp = function (event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveForward = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveLeft = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveBackward = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveRight = false;
      break;
  }
};

// Inicializa Three.js, câmera e controles
function initThree() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  // posiciona a câmera a 1.6 metros de altura para ver o piso
  camera.position.set(0, 1.6, 5);
  renderer = new THREE.WebGLRenderer({ canvas: gameCanvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Luz ambiente suave
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);
  // Luz hemisférica para iluminar céu e chão
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
  scene.add(hemiLight);
  // Controlador personalizado de primeira pessoa usando API de Pointer Lock
  const controlObj = {
    isLocked: false,
    // Mantém referência ao camera
    yaw: 0,
    pitch: 0,
    lock() {
      document.body.requestPointerLock();
    },
    unlock() {
      document.exitPointerLock();
    },
    getObject() {
      return camera;
    },
    moveForward(distance) {
      // Move na direção que a câmera está olhando (no plano XZ)
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      camera.position.addScaledVector(dir, distance);
    },
    moveRight(distance) {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      // vetor à direita é rotação de -90 graus em torno de y
      const right = new THREE.Vector3(dir.z, 0, -dir.x);
      camera.position.addScaledVector(right, distance);
    }
  };
  controls = controlObj;
  // Eventos de pointer lock
  function onPointerLockChange() {
    const locked = document.pointerLockElement === document.body;
    controls.isLocked = locked;
  }
  function onPointerLockError() {
    console.error('Falha ao entrar em pointer lock');
  }
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('pointerlockerror', onPointerLockError);
  // Movimento do mouse para rotacionar câmera
  function onMouseMove(event) {
    if (!controls.isLocked) return;
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    controls.yaw -= movementX * 0.002;
    controls.pitch -= movementY * 0.002;
    // Limita ângulo vertical
    const piHalf = Math.PI / 2;
    controls.pitch = Math.max(-piHalf, Math.min(piHalf, controls.pitch));
    camera.rotation.order = 'YXZ';
    camera.rotation.y = controls.yaw;
    camera.rotation.x = controls.pitch;
  }
  document.addEventListener('mousemove', onMouseMove);
  // Bloqueia ponteiro ao clicar no canvas
  gameCanvas.addEventListener('click', () => {
    controls.lock();
  });
  // Adiciona a câmera como objeto do jogador à cena para colisões e referência
  scene.add(camera);
  // Escuta eventos de teclado
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  // Responsividade
  window.addEventListener('resize', onWindowResize);
  animate();
}

// Ajusta a câmera quando a janela muda de tamanho
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Função de animação chamada a cada frame
function animate() {
  requestAnimationFrame(animate);
  const time = performance.now();
  const delta = (time - prevTime) / 1000;
  // Atualiza movimentação do jogador
  if (controls.isLocked === true) {
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    const speed = 200.0;
    if (moveForward) velocity.z -= speed * delta;
    if (moveBackward) velocity.z += speed * delta;
    if (moveLeft) velocity.x -= speed * delta;
    if (moveRight) velocity.x += speed * delta;
    controls.moveRight(- velocity.x * delta);
    controls.moveForward(- velocity.z * delta);
  }
  // Atualiza inimigos (viruses) para seguirem o jogador
  enemies.forEach((enemy, idx) => {
    const playerPos = controls.getObject().position;
    const dir = new THREE.Vector3().subVectors(playerPos, enemy.position).normalize();
    enemy.position.addScaledVector(dir, 5 * delta);
    // se muito perto do jogador, remove inimigo sem penalidade
    const distance = enemy.position.distanceTo(playerPos);
    if (distance < 2) {
      scene.remove(enemy);
      enemies.splice(idx, 1);
    }
  });
  prevTime = time;
  renderer.render(scene, camera);
}

// Remove todos os objetos do cenário (exceto câmera e luzes) ao mudar de fase
function resetEnvironment() {
  // Remove inimigos existentes
  enemies.forEach((obj) => {
    scene.remove(obj);
  });
  enemies = [];
  // Remove planos de piso sem percorrer a cena enquanto modifica
  const toRemove = [];
  scene.children.forEach((obj) => {
    if (obj.isMesh && obj.name === 'floor') {
      toRemove.push(obj);
    }
  });
  toRemove.forEach((obj) => scene.remove(obj));
}

// Configura o ambiente de fase com cor de piso específica
function setupEnvironment(color) {
  // Cria um plano de piso grande
  const geometry = new THREE.PlaneGeometry(200, 200);
  const material = new THREE.MeshStandardMaterial({ color: color, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(geometry, material);
  floor.rotation.x = - Math.PI / 2;
  floor.name = 'floor';
  scene.add(floor);
}

// Cria inimigos no cenário
function spawnEnemies(count) {
  for (let i = 0; i < count; i++) {
    const geometry = new THREE.SphereGeometry(0.8, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xff5555 });
    const virus = new THREE.Mesh(geometry, material);
    // posiciona aleatoriamente longe do jogador
    const angle = Math.random() * Math.PI * 2;
    const radius = 50 + Math.random() * 50;
    virus.position.set(Math.cos(angle) * radius, 1, Math.sin(angle) * radius);
    virus.userData.isVirus = true;
    enemies.push(virus);
    scene.add(virus);
  }
}

// Detecta tiros (cliques) para destruir inimigos
function initShooting() {
  // Cria um raycaster para detecção de colisão
  const raycaster = new THREE.Raycaster();
  document.addEventListener('mousedown', (event) => {
    if (!controls.isLocked) return;
    // calcula a direção do tiro a partir da câmera
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(enemies, false);
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      scene.remove(hit);
      const idx = enemies.indexOf(hit);
      if (idx > -1) enemies.splice(idx, 1);
      playerScore += 10; // cada vírus destruído vale 10 pontos
    }
  });
}

// Mostra diálogos sequenciais; ao concluir chama callback
function showDialogue(dialogList, callback) {
  let index = 0;
  dialogueBox.style.display = 'flex';
  quizContainer.style.display = 'none';
  puzzleContainer.style.display = 'none';
  overlay.style.pointerEvents = 'auto';
  function next() {
    if (index < dialogList.length) {
      const msg = dialogList[index];
      dialogueAvatar.src = avatars[msg.speaker];
      dialogueText.textContent = msg.text;
      index++;
    } else {
      // Oculta diálogo e prossegue
      dialogueBox.style.display = 'none';
      overlay.style.pointerEvents = 'none';
      dialogueNext.removeEventListener('click', next);
      if (callback) callback();
    }
  }
  dialogueNext.addEventListener('click', next);
  // inicia mostrando a primeira mensagem
  next();
}

// Executa quiz de determinada fase, em sequência
function runQuiz(questions, callback) {
  let qIndex = 0;
  let correctAnswers = 0;
  function showQuestion() {
    quizContainer.innerHTML = '';
    quizContainer.style.display = 'block';
    dialogueBox.style.display = 'none';
    overlay.style.pointerEvents = 'auto';
    const q = questions[qIndex];
    const qElem = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = q.question;
    qElem.appendChild(title);
    const list = document.createElement('ul');
    q.options.forEach((opt, idx) => {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'answer';
      input.value = idx;
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + opt));
      li.appendChild(label);
      list.appendChild(li);
    });
    qElem.appendChild(list);
    const submitBtn = document.createElement('button');
    submitBtn.textContent = 'Responder';
    submitBtn.addEventListener('click', () => {
      const selected = quizContainer.querySelector('input[name="answer"]:checked');
      if (!selected) {
        alert('Selecione uma opção!');
        return;
      }
      const chosen = parseInt(selected.value);
      if (chosen === q.answer) {
        correctAnswers++;
        playerScore += 20;
      }
      qIndex++;
      if (qIndex < questions.length) {
        showQuestion();
      } else {
        // Final do quiz
        quizContainer.style.display = 'none';
        overlay.style.pointerEvents = 'none';
        if (callback) callback();
      }
    });
    qElem.appendChild(submitBtn);
    quizContainer.appendChild(qElem);
  }
  showQuestion();
}

// Executa um puzzle baseado em sliders; target é um array de valores desejados
function runPuzzle(targets, labels, callback) {
  puzzleContainer.innerHTML = '';
  puzzleContainer.style.display = 'block';
  overlay.style.pointerEvents = 'auto';
  const form = document.createElement('div');
  const sliders = [];
  for (let i = 0; i < targets.length; i++) {
    const label = document.createElement('label');
    label.textContent = labels[i] + ': ';
    const valueSpan = document.createElement('span');
    valueSpan.textContent = '50';
    const range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.max = '100';
    range.value = '50';
    range.addEventListener('input', () => {
      valueSpan.textContent = range.value;
    });
    sliders.push(range);
    const container = document.createElement('div');
    container.appendChild(label);
    container.appendChild(valueSpan);
    container.appendChild(range);
    form.appendChild(container);
  }
  const btn = document.createElement('button');
  btn.textContent = 'Confirmar';
  btn.addEventListener('click', () => {
    let ok = true;
    for (let i = 0; i < targets.length; i++) {
      const val = parseInt(sliders[i].value);
      if (Math.abs(val - targets[i]) > 10) {
        ok = false;
        break;
      }
    }
    if (ok) {
      playerScore += 30;
      puzzleContainer.style.display = 'none';
      overlay.style.pointerEvents = 'none';
      callback();
    } else {
      alert('Os valores não estão corretos. Ajuste e tente novamente!');
    }
  });
  form.appendChild(btn);
  puzzleContainer.appendChild(form);
}

// Carrega e executa a fase atual
function loadPhase(index) {
  resetEnvironment();
  // Configura o ambiente com cor específica
  setupEnvironment(phaseColors[index]);
  // Quantidade de vírus aumenta com a fase
  spawnEnemies(2 + index);
  // Exibe diálogos da fase, então quiz, e em algumas fases puzzle extra
  showDialogue(dialogues[index], () => {
    // Após diálogo, quiz
    runQuiz(quizzes[index], () => {
      // Alguns níveis possuem puzzle adicional
      switch (index) {
        case 2: // Fase 2: regular NETose
          runPuzzle([50, 50], ['Ca²⁺', 'NADPH oxidase'], finishPhase);
          break;
        case 4: // Fase 4: complossoma
          runPuzzle([40, 60, 50], ['ATP', 'ROS', 'C3a/C5a'], finishPhase);
          break;
        case 5: // Fase 5: treinamento
          runPuzzle([70, 30], ['H3K4me3', 'H3K27ac'], finishPhase);
          break;
        default:
          finishPhase();
          break;
      }
    });
  });
}

// Avança para a próxima fase ou encerra o jogo
function finishPhase() {
  currentPhase++;
  if (currentPhase < dialogues.length) {
    loadPhase(currentPhase);
  } else {
    endGame();
  }
}

// Finaliza o jogo, atualizando ranking local e exibindo tela de pontuação
function endGame() {
  // salva pontuação no localStorage
  const scores = JSON.parse(localStorage.getItem('innateScores') || '[]');
  scores.push({ name: playerName, score: playerScore });
  // ordena decrescente
  scores.sort((a, b) => b.score - a.score);
  // mantém apenas os top 10
  const top = scores.slice(0, 10);
  localStorage.setItem('innateScores', JSON.stringify(top));
  // monta lista visual
  scoreList.innerHTML = '';
  top.forEach((entry, idx) => {
    const li = document.createElement('li');
    li.textContent = `${idx + 1}. ${entry.name} – ${entry.score} pts`;
    scoreList.appendChild(li);
  });
  // exibe tela de ranking
  scoreScreen.style.display = 'block';
}

// Inicia o jogo quando o botão de começar é clicado
startButton.addEventListener('click', () => {
  const name = playerNameInput.value.trim();
  if (!name) {
    alert('Por favor, insira seu nome!');
    return;
  }
  playerName = name;
  playerScore = 0;
  currentPhase = 0;
  // Oculta tela de login, exibe canvas
  loginScreen.style.display = 'none';
  gameCanvas.style.display = 'block';
  // Inicializa Three.js e tiros uma única vez
  initThree();
  initShooting();
  // carrega primeira fase
  loadPhase(0);
});

// Permite ao usuário jogar novamente
playAgainButton.addEventListener('click', () => {
  scoreScreen.style.display = 'none';
  playerScore = 0;
  currentPhase = 0;
  // reseta posição do jogador
  controls.getObject().position.set(0, 1.6, 5);
  loadPhase(0);
});