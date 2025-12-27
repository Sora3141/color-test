const state = {
    score: 0,
    bestScore: parseInt(localStorage.getItem('hueHunterBest')) || 0,
    currentDiff: 50, 
    isGameOver: false,
    isPeeking: false // 盤面確認中かどうかのフラグ
};

const ui = {
    score: document.getElementById('score-display'),
    board: document.getElementById('game-board'),
    overlay: document.getElementById('result-overlay'),
    resRank: document.getElementById('res-rank'),
    resMsg: document.getElementById('res-msg'),
    resScore: document.getElementById('res-score'),
    resBest: document.getElementById('res-best'),
    startScreen: document.getElementById('start-screen'),
    backBtn: document.getElementById('back-to-result') // 追加：結果に戻るボタン
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
    // ゲームオーバー時でも、盤面確認中(isPeeking)なら再描画しない
    if (state.isGameOver && !state.isPeeking) return;
    
    ui.board.innerHTML = '';
    
    // 1. HSLでベースの色決定
    const h = Math.floor(Math.random() * 360);
    const s = 70;
    const l = 50; 

    // 2. RGB計算
    const tempDiv = document.createElement('div');
    tempDiv.style.backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
    document.body.appendChild(tempDiv);
    const rgbString = window.getComputedStyle(tempDiv).backgroundColor;
    document.body.removeChild(tempDiv);

    const rgbValues = rgbString.match(/\d+/g).map(Number);
    let r = rgbValues[0];
    let g = rgbValues[1];
    let b = rgbValues[2];

    // 3. 差分計算
    const d = Math.max(1, Math.round(state.currentDiff));

    // ▼▼▼ ここから変更：RGBのうち1つだけを変えるロジック ▼▼▼
    
    // 変更するチャンネルをランダムに選ぶ (0:Red, 1:Green, 2:Blue)
    const targetChannel = Math.floor(Math.random() * 3);

    // 正解のRGB変数を初期化（まずはベースと同じにする）
    let tr = r;
    let tg = g;
    let tb = b;

    // 変更対象の現在の値を取得
    let targetValue = (targetChannel === 0) ? r : (targetChannel === 1) ? g : b;

    // 足すか引くかをランダム決定
    let sign = Math.random() < 0.5 ? 1 : -1;

    // 壁判定：選ばれたチャンネルだけでチェック
    // 255を超えたり0を下回る場合のみ逆方向にする
    if ((sign === 1 && targetValue + d > 255) || (sign === -1 && targetValue - d < 0)) {
        sign *= -1;
    }

    // 選ばれたチャンネルだけに差分を適用
    if (targetChannel === 0) tr += d * sign;
    if (targetChannel === 1) tg += d * sign;
    if (targetChannel === 2) tb += d * sign;

    // 念のための丸め処理
    tr = Math.max(0, Math.min(255, tr));
    tg = Math.max(0, Math.min(255, tg));
    tb = Math.max(0, Math.min(255, tb));

    // ▲▲▲ 変更ここまで ▲▲▲

    const targetColorStr = `rgb(${tr}, ${tg}, ${tb})`; // 正解の色
    const baseColorStr = `rgb(${r}, ${g}, ${b})`;       // 間違いの色

    const correctIndex = Math.floor(Math.random() * 25);

    for (let i = 0; i < 25; i++) {
        const block = document.createElement('div');
        block.className = 'block';
        const row = Math.floor(i / 5);
        const col = i % 5;
        const delay = (row + col) * 0.04;
        block.style.animationDelay = `${delay}s`;

        if (i === correctIndex) {
            block.style.backgroundColor = targetColorStr;
            block.id = "target";
            
            if (state.isGameOver) {
                block.classList.add('correct-answer');
                if(state.currentDiff <= 1.5) block.classList.add('god-eye');
            } else {
                block.onclick = (e) => handleCorrect(e);
            }
        } else {
            block.style.backgroundColor = baseColorStr;
            
            if (!state.isGameOver) {
                block.onclick = (e) => handleIncorrect(e);
            }
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
    
    // 難易度調整
   if (state.score % 2 === 0) {
        state.currentDiff = Math.max(1, state.currentDiff - 1);
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

    const target = document.getElementById('target');
    document.querySelectorAll('.block').forEach(b => b.classList.add('fade-out'));
    target.classList.remove('fade-out');
    target.classList.add('correct-answer');
    
    if (state.currentDiff <= 1.5) {
        target.classList.add('god-eye');
    }

    setTimeout(showResult, 1200);
}

// ランク判定
function getRankInfo(diff, score) {
    // スコア100以上は殿堂入り
    if (score >= 100) return { rank: "✨神の目✨", msg: "80から1を駆け抜けた伝説。" };

    // 以下、誤差(diff)が小さい（難しい）順に判定
    if (diff <= 1.5) return { rank: "宇宙の理", msg: "RGBの粒子が見えています。" };
    if (diff <= 3)   return { rank: "人間卒業", msg: "もはやモニターを超越した存在。" };
    if (diff <= 6)   return { rank: "色彩の魔術師", msg: "常人には理解できない領域。" };
    if (diff <= 10)  return { rank: "絶対色感", msg: "色の吐息が聞こえるレベル。" };
    if (diff <= 16)  return { rank: "熟練デザイナー", msg: "1pxの狂いも許さない瞳。" };
    if (diff <= 25)  return { rank: "鷹の目", msg: "獲物を逃さない鋭さがあります。" };
    if (diff <= 40)  return { rank: "色彩ソムリエ", msg: "違いの分かる人になってきました。" };
    if (diff <= 60)  return { rank: "見習い画家", msg: "才能の片鱗が見え隠れしています。" };
    if (diff <= 75)  return { rank: "色彩愛好家", msg: "色の世界へようこそ！" };

    // それ以外（スタート直後など）
    return { rank: "一般市民", msg: "まずはリラックスして楽しもう。" };
}

// 結果画面表示
function showResult() {
    state.isPeeking = false;
    
    // 「結果に戻る」ボタンを隠す（CSSのtransformで下へスライド）
    ui.backBtn.classList.remove('visible');

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

// 盤面確認機能（ここが新機能）
function peekBoard() {
    state.isPeeking = true;
    
    document.querySelectorAll('.block').forEach(b => {
        b.classList.remove('fade-out');
    });
    // リザルトをフェードアウト
    ui.overlay.classList.remove('visible');
    
    setTimeout(() => {
        ui.overlay.style.display = 'none';
        // 「結果に戻る」ボタンをスライドイン
        ui.backBtn.classList.add('visible');
    }, 300);
}

// ゲームリセット
function resetGame() {
    state.score = 0;
    state.currentDiff = 50; 
    state.isGameOver = false;
    state.isPeeking = false;
    
    ui.score.innerText = 0;
    ui.overlay.classList.remove('visible');
    ui.backBtn.classList.remove('visible'); // 念のため戻るボタンも隠す
    
    setTimeout(() => {
        ui.overlay.style.display = 'none';
        renderGame();
    }, 300);
}

init();