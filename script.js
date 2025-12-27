const state = {
    score: 0,
    bestScore: parseInt(localStorage.getItem('hueHunterBest')) || 0,
    currentDiff: 80, // 初期値を80に変更
    isGameOver: false,
    isPeeking: false
};

const ui = {
    score: document.getElementById('score-display'),
    board: document.getElementById('game-board'),
    overlay: document.getElementById('result-overlay'),
    resRank: document.getElementById('res-rank'),
    resMsg: document.getElementById('res-msg'),
    resScore: document.getElementById('res-score'),
    resBest: document.getElementById('res-best'),
    startScreen: document.getElementById('start-screen')
};

function init() {
    ui.board.innerHTML = '';
}

function startGame() {
    ui.startScreen.style.opacity = '0';
    setTimeout(() => {
        ui.startScreen.style.display = 'none';
        renderGame();
    }, 500);
}

function renderGame() {
    if (state.isGameOver && !state.isPeeking) return;
    ui.board.innerHTML = '';
    
    // 1. ベースの色をHSLで鮮やかに決定
    const h = Math.floor(Math.random() * 360);
    const s = 70;
    const l = 50;

    // 2. ブラウザの機能を使ってHSLからRGBの数値を取得
    const tempDiv = document.createElement('div');
    tempDiv.style.backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
    document.body.appendChild(tempDiv);
    const rgbString = window.getComputedStyle(tempDiv).backgroundColor;
    document.body.removeChild(tempDiv);

    const rgbValues = rgbString.match(/\d+/g).map(Number);
    let r = rgbValues[0];
    let g = rgbValues[1];
    let b = rgbValues[2];

    // 3. RGBの差分（d）を計算
    const d = Math.max(1, Math.round(state.currentDiff));

    // 4. 白飛び（255超え）対策の反転ロジック
    const isOver = (r + d > 255 || g + d > 255 || b + d > 255);
    const correctIndex = Math.floor(Math.random() * 25);

    for (let i = 0; i < 25; i++) {
        const block = document.createElement('div');
        block.className = 'block';
        const row = Math.floor(i / 5);
        const col = i % 5;
        const delay = (row + col) * 0.04;
        block.style.animationDelay = `${delay}s`;

        if (i === correctIndex) {
            if (isOver) {
                block.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            } else {
                block.style.backgroundColor = `rgb(${r + d}, ${g + d}, ${b + d})`;
            }
            block.id = "target";
            block.onclick = (e) => handleCorrect(e);
        } else {
            if (isOver) {
                block.style.backgroundColor = `rgb(${r - d}, ${g - d}, ${b - d})`;
            } else {
                block.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            }
            block.onclick = (e) => handleIncorrect(e);
        }
        block.addEventListener('touchstart', (e) => {}, {passive: true});
        ui.board.appendChild(block);
    }
}

function handleCorrect(e) {
    e.preventDefault();
    if(state.isGameOver) return;
    state.score++;
    ui.score.innerText = state.score;
    
    // 初期値80から100回目で1にするための減少率: 0.957
    state.currentDiff = Math.max(1, state.currentDiff * 0.957);
    
    renderGame();
}

function handleIncorrect(e) {
    e.preventDefault();
    if(state.isGameOver) return;
    state.isGameOver = true;

    if (state.score > state.bestScore) {
        state.bestScore = state.score;
        localStorage.setItem('hueHunterBest', state.bestScore);
    }

    const target = document.getElementById('target');
    document.querySelectorAll('.block').forEach(b => b.classList.add('fade-out'));
    target.classList.remove('fade-out');
    target.classList.add('correct-answer');
    
    if (state.currentDiff <= 1.5) {
        target.classList.add('god-eye');
    }

    setTimeout(showResult, 1200);
}

// 以下、getRankInfoやshowResultなどはこれまでのコードと同様
function getRankInfo(diff, score) {
    if (score >= 100) return { rank: "✨神の目✨", msg: "80から1を駆け抜けた伝説。" };
    if (diff <= 1.5) return { rank: "プロの極致", msg: "RGB差1の極小世界。" };
    if (diff <= 4)   return { rank: "色彩の魔術師", msg: "達人です。" };
    if (diff <= 10)  return { rank: "熟練デザイナー", msg: "素晴らしい識別能力。" };
    if (diff <= 25)  return { rank: "色彩愛好家", msg: "鋭くなってきました。" };
    return { rank: "一般市民", msg: "色の違いを楽しんで！" };
}

function showResult() {
    state.isPeeking = false;
    const info = getRankInfo(state.currentDiff, state.score);
    ui.resRank.innerText = info.rank;
    ui.resMsg.innerText = info.msg;
    ui.resScore.innerText = state.score;
    ui.resBest.innerText = state.bestScore;
    ui.overlay.style.display = 'flex';
    requestAnimationFrame(() => {
        ui.overlay.classList.add('visible');
    });
}

function resetGame() {
    state.score = 0;
    state.currentDiff = 80; // リセット時も80に
    state.isGameOver = false;
    ui.score.innerText = 0;
    ui.overlay.classList.remove('visible');
    setTimeout(() => {
        ui.overlay.style.display = 'none';
        renderGame();
    }, 300);
}

init();