const imageButton = document.getElementById("image-button");
const imageInput = document.getElementById("image-input");
const preview = document.getElementById("preview");
const ocrStatus = document.getElementById("ocr-status");

imageButton.addEventListener("click", () => {
    imageInput.click(); // カメラを起動
});

imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = "block";
            ocrStatus.textContent = "OCR処理中...";
            recognizeText(e.target.result);
        };
        reader.readAsDataURL(file);
    }
});

function recognizeText(imageSrc) {
    Tesseract.recognize(
        imageSrc, 
        'eng', // 言語は英語
        {
            logger: m => console.log(m) // 進行状況のログ
        }
    ).then(({ data: { text } }) => {
        ocrStatus.textContent = "OCR完了";
        console.log("OCR結果:", text);
        parseSudokuGrid(text);
    }).catch(error => {
        ocrStatus.textContent = "OCRエラー";
        console.error("OCRエラー:", error);
    });
}

function parseSudokuGrid(text) {
    let lines = text.trim().split("\n");
    if (lines.length < 9) {
        console.error("不正な数独のデータ");
        return;
    }
    
    let parsedBoard = [];
    for (let i = 0; i < 9; i++) {
        let row = lines[i].replace(/[^0-9]/g, "").split("").map(num => parseInt(num, 10) || 0);
        if (row.length === 9) {
            parsedBoard.push(row);
        }
    }

    if (parsedBoard.length === 9) {
        updateGrid(parsedBoard);
    } else {
        console.error("OCR結果が不正");
    }
}

function updateGrid(newBoard) {
    const cells = document.querySelectorAll("#sudoku-grid input");
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            let index = row * 9 + col;
            cells[index].value = newBoard[row][col] !== 0 ? newBoard[row][col] : "";
        }
    }
}