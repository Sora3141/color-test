const state = {
    score: 0,
    bestScore: parseInt(localStorage.getItem('hueHunterBest')) || 0,
    currentDiff: 40,
    isGameOver: false,
    isPeeking: false
};

const ui = {
    score: document.getElementById('score-display'),
    board: document.getElementById('game-board'),
    overlay: document.getElementById('result-overlay'),
    backBtn: document.getElementById('back-to-result'),
    resRank: document.getElementById('res-rank'),
    resMsg: document.getElementById('res-msg'),
    resScore: document.getElementById('res-score'),
    resBest: document.getElementById('res-best')
};

function init() {
    renderGame();
}

function renderGame() {
    if (state.isGameOver && !state.isPeeking) return;
    ui.board.innerHTML = '';
    
    const h = Math.floor(Math.random() * 360);
    const s = 65;
    const l = 55;
    const correctIndex = Math.floor(Math.random() * 25);
    const targetDiff = Math.max(0.5, state.currentDiff);

    for (let i = 0; i < 25; i++) {
        const block = document.createElement('div');
        block.className = 'block';
        const row = Math.floor(i / 5);
        const col = i % 5;
        const delay = (row + col) * 0.04;
        block.style.animationDelay = `${delay}s`;

        if (i === correctIndex) {
            block.style.backgroundColor = `hsl(${h + targetDiff}, ${s}%, ${l}%)`;
            block.id = "target";
            block.onclick = (e) => handleCorrect(e);
        } else {
            block.style.backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
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
    if (state.score % 3 === 0) {
        state.currentDiff = Math.max(0.5, state.currentDiff * 0.875);
    }
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

    const blocks = document.querySelectorAll('.block');
    const target = document.getElementById('target');
    
    blocks.forEach(b => b.classList.add('fade-out'));
    target.classList.remove('fade-out');
    target.classList.add('correct-answer');
    
    if (state.currentDiff <= 0.6) {
        target.classList.add('god-eye');
    }

    setTimeout(showResult, 1200);
}

// --- 日本語のランク判定ロジック ---
function getRankInfo(diff, score) {
    if (diff > 25) return { rank: "一般市民", msg: "色の違いに気づいて！" };
    if (diff > 15) return { rank: "初心者", msg: "まずは10問を目指そう。" };
    if (diff > 8)  return { rank: "見習い", msg: "色彩感覚が目覚めてきた。" };
    if (diff > 4)  return { rank: "色彩愛好家", msg: "なかなか鋭いですね。" };
    if (diff > 2)  return { rank: "色彩検定級", msg: "色のプロまであと一歩！" };
    if (diff > 1)  return { rank: "熟練デザイナー", msg: "素晴らしい識別能力です。" };
    if (diff > 0.7) return { rank: "色彩の魔術師", msg: "もはや達人の域です。" };
    if (diff > 0.55) return { rank: "プロの極致", msg: "モニターの限界に挑んでいます。" };
    if (score >= 100) return { rank: "✨神の目✨", msg: "0.5の壁を突破しました。" };
    return { rank: "🌌次元の観測者", msg: "存在しないはずの色を見ています。" };
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
        ui.backBtn.classList.remove('visible');
    });
}

function peekBoard() {
    state.isPeeking = true;
    document.querySelectorAll('.block').forEach(b => {
        b.classList.remove('fade-out');
        b.style.transition = 'none'; 
    });
    ui.overlay.classList.remove('visible');
    setTimeout(() => {
        ui.overlay.style.display = 'none';
        ui.backBtn.classList.add('visible');
    }, 300);
}

function resetGame() {
    state.score = 0;
    state.currentDiff = 40;
    state.isGameOver = false;
    ui.score.innerText = 0;
    ui.overlay.classList.remove('visible');
    setTimeout(() => {
        ui.overlay.style.display = 'none';
        renderGame();
    }, 300);
}

init();