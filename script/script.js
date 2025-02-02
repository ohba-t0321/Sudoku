document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("sudoku-grid");
    const solveButton = document.getElementById("solve-button");
    const clearButton = document.getElementById("clear-button");

    // 初期盤面（0は空欄）
    const board = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ];
    // const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    function createGrid() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement("input");
                cell.type = "text";
                cell.maxLength = 1;
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (board[row][col] !== 0) {
                    cell.value = board[row][col];
                    cell.disabled = true;
                }
                
                grid.appendChild(cell);
            }
        }
    }
    
    function isValidMove(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num || board[i][col] === num) {
                return false;
            }
        }
        
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] === num) {
                    return false;
                }
            }
        }
        return true;
    }
    
    function solve(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (isValidMove(board, row, col, num)) {
                            board[row][col] = num;
                            if (solve(board)) return true;
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }
    
    solveButton.addEventListener("click", () => {
        const boardCopy = board.map(row => [...row]);
        if (solve(boardCopy)) {
            const cells = grid.children;
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) {
                        cells[row * 9 + col].value = boardCopy[row][col];
                    }
                }
            }
        } else {
            alert("解が見つかりませんでした。");
        }
    });
    clearButton.addEventListener("click", () => {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cells = grid.children;
                if (cells[row * 9 + col].disabled === false){
                    cells[row * 9 + col].value = "";
                }
            }
        }
    });

    createGrid();
});