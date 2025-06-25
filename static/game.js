// /sudoku_web/static/game.js

document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('sudoku-board');
    const statusDiv = document.getElementById('status');
    let selectedCell = null;

    // --- Cell Selection ---
    board.addEventListener('click', (event) => {
        const cell = event.target;
        if (cell.classList.contains('empty-cell')) {
            if (selectedCell) {
                selectedCell.classList.remove('selected');
            }
            selectedCell = cell;
            selectedCell.classList.add('selected');
            statusDiv.textContent = `Mengisi sel (${selectedCell.dataset.row}, ${selectedCell.dataset.col})`;
        }
    });
    
    // --- Numpad Input ---
    document.getElementById('numpad').addEventListener('click', (event) => {
        if (!selectedCell) {
            statusDiv.textContent = 'Pilih sel kosong terlebih dahulu!';
            return;
        }
        
        const target = event.target;
        if (target.classList.contains('num-button')) {
            clearHighlights();
            if (target.classList.contains('erase')) {
                selectedCell.textContent = '';
            } else {
                selectedCell.textContent = target.textContent;
            }
        }
    });

    const eraserBtn = document.querySelector('.erase');
    eraserBtn.addEventListener('click', () => {
        if (!selectedCell) {
            statusDiv.textContent = 'Pilih sel kosong terlebih dahulu!';
            return;
        }

        clearHighlights();
        selectedCell.textContent = '';
    });
    // --- Helper Functions ---
    const getBoardState = () => {
        const boardState = Array(6).fill(null).map(() => Array(6).fill(0));
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
                const cell = document.getElementById(`cell-${r}-${c}`);
                boardState[r][c] = cell.textContent ? parseInt(cell.textContent) : 0;
            }
        }
        return boardState;
    };
    
    const clearHighlights = () => {
        document.querySelectorAll('.highlight-error, .highlight-hint').forEach(el => {
            el.classList.remove('highlight-error', 'highlight-hint');
        });
    };
    
    const disableButtons = (disabled) => {
        document.querySelectorAll('.game-btn').forEach(btn => btn.disabled = disabled);
    };

    // --- Control Buttons ---
    document.getElementById('check-button').addEventListener('click', async () => {
        clearHighlights();
        const boardState = getBoardState();
        const response = await fetch('/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ board: boardState })
        });
        const result = await response.json();
        statusDiv.textContent = result.message;
        if (result.status === 'incorrect' && result.cell) {
            document.getElementById(`cell-${result.cell[0]}-${result.cell[1]}`).classList.add('highlight-error');
        } else if (result.status === 'correct') {
            disableButtons(true);
            statusDiv.classList.add('status-correct');
        }
    });

    document.getElementById('hint-button').addEventListener('click', async () => {
        clearHighlights();
        const response = await fetch('/hint');
        const hint = await response.json();
        if (hint.row !== undefined) {
            const cell = document.getElementById(`cell-${hint.row}-${hint.col}`);
            cell.textContent = hint.hint;
            cell.classList.add('highlight-hint');
            cell.classList.remove('empty-cell');
            cell.classList.add('initial-cell'); // Anggap seperti angka awal
        } else {
            statusDiv.textContent = "Semua sel sudah terisi!";
        }
    });
    
    document.getElementById('new-game-button').addEventListener('click', () => {
        window.location.reload();
    });

    document.getElementById('solve-button').addEventListener('click', () => {
        disableButtons(true);
        statusDiv.textContent = 'Memulai visualisasi penyelesaian...';
        const boardState = getBoardState();

        const eventSource = new EventSource(`/solve?_=${new Date().getTime()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ board: boardState })
        });
        

        alert("Visualisasi akan dimulai dari papan awal.");
        window.location.href = `/solve_page`; // Let's create a new page for clean visualization
    });
});
// /sudoku_web/static/game.js

document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('sudoku-board');
    const statusDiv = document.getElementById('status');
    let selectedCell = null;

    // --- ANIMASI KONFETI ---
    function triggerConfetti() {
        const duration = 3 * 1000; // Durasi animasi 3 detik
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // Tembakkan konfeti dari sisi kiri dan kanan layar
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }

    // --- Cell Selection ---
    board.addEventListener('click', (event) => {
        const cell = event.target;
        if (cell.classList.contains('empty-cell')) {
            if (selectedCell) {
                selectedCell.classList.remove('selected');
            }
            selectedCell = cell;
            selectedCell.classList.add('selected');
            statusDiv.textContent = `Mengisi sel (${selectedCell.dataset.row}, ${selectedCell.dataset.col})`;
        }
    });
    
    // --- Numpad Input ---
    document.getElementById('numpad').addEventListener('click', (event) => {
        if (!selectedCell) {
            statusDiv.textContent = 'Pilih sel kosong terlebih dahulu!';
            return;
        }
        
        const target = event.target;
        if (target.classList.contains('num-button')) {
            clearHighlights();
            if (target.classList.contains('erase')) {
                selectedCell.textContent = '';
            } else {
                selectedCell.textContent = target.textContent;
            }
        }
    });

    // --- Helper Functions ---
    const getBoardState = () => {
        const boardState = Array(6).fill(null).map(() => Array(6).fill(0));
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
                const cell = document.getElementById(`cell-${r}-${c}`);
                boardState[r][c] = cell.textContent ? parseInt(cell.textContent) : 0;
            }
        }
        return boardState;
    };
    
    const clearHighlights = () => {
        document.querySelectorAll('.highlight-error, .highlight-hint, .selected').forEach(el => {
            el.classList.remove('highlight-error', 'highlight-hint', 'selected');
        });
        if(selectedCell) selectedCell = null;
    };
    

    // --- Control Buttons ---
    document.getElementById('check-button').addEventListener('click', async () => {
        clearHighlights();
        const boardState = getBoardState();
        const response = await fetch('/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ board: boardState })
        });
        const result = await response.json();
        
        statusDiv.textContent = result.message;
        statusDiv.classList.remove('status-correct'); // Hapus kelas dulu untuk memicu ulang animasi CSS

        if (result.status === 'correct') {
            statusDiv.classList.add('status-correct'); // Nonaktifkan tombol saat menang
            triggerConfetti(); 
        } else if (result.status === 'incorrect' && result.cell) {
            document.getElementById(`cell-${result.cell[0]}-${result.cell[1]}`).classList.add('highlight-error');
        }
    });

    document.getElementById('hint-button').addEventListener('click', async () => {
        clearHighlights();
        const boardState = getBoardState();
        const response = await fetch('/hint', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({board: boardState})
        });
        const hint = await response.json();

        if (hint.row !== undefined) {
            const cell = document.getElementById(`cell-${hint.row}-${hint.col}`);
            cell.textContent = hint.hint;
            cell.classList.add('highlight-hint');
            if (cell.classList.contains('empty-cell')) {
                cell.classList.remove('empty-cell');
            }
        } else {
            statusDiv.textContent = hint.message || "Tidak ada petunjuk lagi.";
        }
    });
    
    document.getElementById('new-game-button').addEventListener('click', () => {
        window.location.reload();
    });

    document.getElementById('solve-button').addEventListener('click', () => {
        const userConfirmed = confirm("Anda akan dialihkan ke halaman baru untuk melihat animasi solusi dari papan awal. Lanjutkan?");
        if (userConfirmed) {
            window.location.href = '/solve_page';
        }
    });
});
