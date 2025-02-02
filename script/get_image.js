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
            preprocessImage(e.target.result);
            preview.src = e.target.result;
            preview.style.display = "block";
            ocrStatus.textContent = "OCR処理中...";
            // recognizeText(e.target.result);
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
        // parseSudokuGrid(text);
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

function preprocessImage(image) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // 画像データ取得
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let pixels = imageData.data;

        // グレースケール変換
        for (let i = 0; i < pixels.length; i += 4) {
            let gray = pixels[i] * 0.3 + pixels[i + 1] * 0.59 + pixels[i + 2] * 0.11;
            pixels[i] = pixels[i + 1] = pixels[i + 2] = gray; // RGBを同じ値に
        }

        ctx.putImageData(imageData, 0, 0);
        applyThreshold(canvas); // 二値化処理へ
        enhanceImageWithOpenCV(canvas); // OpenCV で画像処理
        correctPerspective(canvas); // 透視変換
        cropSudokuGrid(canvas); // 数独のグリッドを切り出し
    };

    img.src = image;
}

function applyThreshold(canvas) {
    const ctx = canvas.getContext("2d");
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let pixels = imageData.data;
    const threshold = 128; // しきい値（調整可能）

    for (let i = 0; i < pixels.length; i += 4) {
        let value = pixels[i] > threshold ? 255 : 0;
        pixels[i] = pixels[i + 1] = pixels[i + 2] = value; // RGBに適用
    }

    ctx.putImageData(imageData, 0, 0);
    // processOCR(canvas.toDataURL()); // OCR に送る
}

function enhanceImageWithOpenCV(imageElement) {
    let src = cv.imread(imageElement);
    let dst = new cv.Mat();
    let kernel = cv.Mat.ones(3, 3, cv.CV_8U);

    // 画像をグレースケール化
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

    // 二値化（適応的しきい値処理）
    cv.adaptiveThreshold(src, src, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

    // 収縮（ノイズ削除）
    cv.erode(src, dst, kernel);

    // 膨張（数字を太くする）
    cv.dilate(dst, dst, kernel);

    // 結果を描画
    cv.imshow(imageElement, dst);

    src.delete();
    dst.delete();
    kernel.delete();
}

function correctPerspective(imageElement) {
    let src = cv.imread(imageElement);
    let dst = new cv.Mat();
    let dsize = new cv.Size(300, 300); // 出力サイズ

    // 四隅の座標を手動で設定（または輪郭検出で自動取得）
    let srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, src.cols, 0, src.cols, src.rows, 0, src.rows]);
    let dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, dsize.width, 0, dsize.width, dsize.height, 0, dsize.height]);

    let M = cv.getPerspectiveTransform(srcCoords, dstCoords);
    cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR);

    cv.imshow(imageElement, dst);

    src.delete();
    dst.delete();
    M.delete();
    srcCoords.delete();
    dstCoords.delete();
}

function cropSudokuGrid(imageElement) {
    let src = cv.imread(imageElement);
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    
    // グレースケール & 二値化
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(src, src, 150, 255, cv.THRESH_BINARY);

    // 輪郭を検出
    cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // 一番大きな輪郭（数独の枠）を抽出
    let largestContour = contours.get(0);
    let boundingRect = cv.boundingRect(largestContour);

    let dst = src.roi(boundingRect);
    cv.imshow(imageElement, dst);

    src.delete();
    dst.delete();
    contours.delete();
    hierarchy.delete();
}
