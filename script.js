const state = {
    score: 0,
    bestScore: parseInt(localStorage.getItem('hueHunterBest')) || 0,
    currentDiff: 40, // RGB値の差（初期値）
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
    
    // 1. まずは HSL で「ベースとなる綺麗な色」を決める
    const h = Math.floor(Math.random() * 360);
    const s = 70; // 鮮やかさを固定
    const l = 50; // 明るさを固定（極端に暗くならない）

    // 2. 一時的な要素を作って、ブラウザに HSL -> RGB の変換をさせる
    const tempDiv = document.createElement('div');
    tempDiv.style.backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
    document.body.appendChild(tempDiv);
    const rgbString = window.getComputedStyle(tempDiv).backgroundColor; // "rgb(r, g, b)" の形式で取得
    document.body.removeChild(tempDiv);

    // 3. 取得したRGB値を数値に分解する
    const rgbValues = rgbString.match(/\d+/g).map(Number);
    let r = rgbValues[0];
    let g = rgbValues[1];
    let b = rgbValues[2];

    // 4. RGBの差分（d）を計算（100回目で1になるように）
    const d = Math.max(1, Math.round(state.currentDiff));

    // 5. 正解のブロックが「明るくなりすぎて白飛び」しないように調整
    // もし加算して255を超える場合は、正解の方をベースにして不正解の方を「引く」
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
                // 白飛びしそうな時は、ベース色をそのまま正解にする
                block.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            } else {
                block.style.backgroundColor = `rgb(${r + d}, ${g + d}, ${b + d})`;
            }
            block.id = "target";
            block.onclick = (e) => handleCorrect(e);
        } else {
            if (isOver) {
                // 白飛びしそうな時は、不正解の方を暗くする
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
    
    // 減少率 0.9632 を毎ステップ掛けることで100回目に約1になる
    state.currentDiff = Math.max(1, state.currentDiff * 0.9632);
    
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
    
    // RGB差が1になったら特別なクラスを付与
    if (state.currentDiff <= 1.5) {
        target.classList.add('god-eye');
    }

    setTimeout(showResult, 1200);
}

function getRankInfo(diff, score) {
    // RGBの差(diff)に基づいたランク判定
    if (score >= 100) return { rank: "✨神の目✨", msg: "100回の壁を突破！RGB差1を見抜く伝説の目。" };
    if (diff <= 1.5) return { rank: "プロの極致", msg: "モニターの物理的限界に到達しました。" };
    if (diff <= 3)   return { rank: "色彩の魔術師", msg: "もはや達人の域です。" };
    if (diff <= 6)   return { rank: "熟練デザイナー", msg: "素晴らしい識別能力です。" };
    if (diff <= 12)  return { rank: "色彩愛好家", msg: "なかなか鋭いですね。" };
    if (diff <= 20)  return { rank: "見習い", msg: "色彩感覚が目覚めてきた。" };
    if (diff <= 30)  return { rank: "初心者", msg: "まずは10問を目指そう。" };
    return { rank: "一般市民", msg: "色の違いに気づいて！" };
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
        if(ui.backBtn) ui.backBtn.classList.remove('visible');
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
        if(ui.backBtn) ui.backBtn.classList.add('visible');
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