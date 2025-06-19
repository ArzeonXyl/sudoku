# /sudoku_web/app.py

import time
import json
import random
from flask import Flask, render_template, Response, request, jsonify, redirect, url_for

app = Flask(__name__)

# Variabel global untuk menyimpan puzzle asli dan solusinya
initial_puzzle = []
full_solution = []

# --- Fungsi Utilitas & Pembuatan Papan ---

def is_valid(board, row, col, num):
    """Memeriksa apakah sebuah angka valid untuk diletakkan di sel."""
    if num == 0: return True  # Angka 0 (kosong) dianggap valid saat pengecekan
    
    # Cek baris
    if num in board[row]:
        return False
    
    # Cek kolom
    if num in [board[i][col] for i in range(6)]:
        return False
    
    # Cek blok 2x3
    start_row, start_col = (row // 2) * 2, (col // 3) * 3
    for i in range(2):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def fill_board_randomly(board):
    """Mengisi papan kosong menjadi sebuah solusi Sudoku yang acak."""
    nums_to_try = list(range(1, 7))
    random.shuffle(nums_to_try)
    for row in range(6):
        for col in range(6):
            if board[row][col] == 0:
                for num in nums_to_try:
                    if is_valid(board, row, col, num):
                        board[row][col] = num
                        if fill_board_randomly(board):
                            return True
                        board[row][col] = 0  # Backtrack
                return False
    return True

def generate_puzzle(holes=24):
    """Membuat puzzle Sudoku baru beserta solusinya."""
    board = [[0] * 6 for _ in range(6)]
    fill_board_randomly(board)
    solution = [row[:] for row in board]  # Simpan solusi penuh
    
    # Buat lubang di papan
    cells_to_remove = random.sample(range(36), holes)
    for index in cells_to_remove:
        board[index // 6][index % 6] = 0
        
    return board, solution

def solve_sudoku_generator(board, no_delay=False):
    """Generator yang menghasilkan setiap langkah penyelesaian Sudoku."""
    for row in range(6):
        for col in range(6):
            if board[row][col] == 0:
                for num in range(1, 7):
                    if is_valid(board, row, col, num):
                        board[row][col] = num
                        if not no_delay:
                            yield {"board": board, "row": row, "col": col, "status": "trying", "message": f"Mencoba angka {num} di ({row}, {col})"}
                            time.sleep(0.15)
                        
                        # Rekursi dengan yield from
                        if (yield from solve_sudoku_generator(board, no_delay)):
                            return True
                        
                        # Backtracking
                        board[row][col] = 0
                        if not no_delay:
                            yield {"board": board, "row": row, "col": col, "status": "backtracking", "message": f"Backtrack dari ({row}, {col}), hapus {num}"}
                            time.sleep(0.15)
                return False
    # Jika semua sel terisi, yield status solved
    if not no_delay:
        yield {"board": board, "status": "solved", "message": "Solusi ditemukan!"}
    return True

# --- Rute Flask (Routes) ---

@app.route('/')
def index():
    """Halaman utama game, menghasilkan puzzle baru setiap kali dimuat."""
    global initial_puzzle, full_solution
    initial_puzzle, full_solution = generate_puzzle(holes=22)
    return render_template('index.html', board=initial_puzzle)

@app.route('/check', methods=['POST'])
def check_solution():
    """Endpoint untuk memeriksa apakah solusi pengguna benar."""
    user_board = request.json['board']
    
    if user_board == full_solution:
        return jsonify({'status': 'correct', 'message': 'Luar biasa! Solusi Anda benar!'})
    
    # Periksa apakah ada sel yang kosong atau konflik
    for r in range(6):
        for c in range(6):
            if user_board[r][c] == 0:
                return jsonify({'status': 'incomplete', 'message': 'Papan belum terisi penuh. Terus berusaha!'})
            
            num = user_board[r][c]
            # Cek konflik dengan angka lain, dengan mengabaikan sel itu sendiri
            temp_board = [row[:] for row in user_board]
            temp_board[r][c] = 0 
            if not is_valid(temp_board, r, c, num):
                return jsonify({'status': 'incorrect', 'message': f'Ada angka yang konflik. Periksa kembali pekerjaan Anda.', 'cell': [r,c]})
            
    return jsonify({'status': 'incorrect', 'message': 'Solusi salah, tetapi tidak ada konflik langsung. Coba lagi!'})

@app.route('/hint', methods=['POST'])
def get_hint():
    """Endpoint untuk memberikan satu petunjuk angka yang benar berdasarkan papan pengguna."""
    user_board = request.json['board']
    
    # Cari sel kosong pertama di papan pengguna
    for r in range(6):
        for c in range(6):
            if user_board[r][c] == 0:
                # Berikan jawaban yang benar dari solusi penuh
                return jsonify({'row': r, 'col': c, 'hint': full_solution[r][c]})
                
    # Alternatif: Cari sel yang diisi salah oleh pengguna
    for r in range(6):
        for c in range(6):
            if user_board[r][c] != full_solution[r][c]:
                 return jsonify({'row': r, 'col': c, 'hint': full_solution[r][c], 'message': 'Mengoreksi sel yang salah'})

    return jsonify({'message': 'Papan sudah terisi dengan benar!'})

# --- Rute untuk Halaman Visualisasi Solusi ---

@app.route('/solve_page')
def solve_page():
    """Menampilkan halaman khusus untuk visualisasi solusi."""
    if not initial_puzzle:
        return redirect(url_for('index'))
    return render_template('solve_page.html', board=initial_puzzle)

@app.route('/stream_solve')
def stream_solve():
    """Endpoint streaming HANYA untuk visualisasi di solve_page."""
    if not initial_puzzle:
        return Response("{}", mimetype='text/event-stream')

    board_to_solve = [row[:] for row in initial_puzzle]
    
    def stream_events():
        yield from solve_sudoku_generator(board_to_solve)

    def stream_formatter():
        for data in stream_events():
            yield f"data: {json.dumps(data)}\n\n"

    return Response(stream_formatter(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True, threaded=True)