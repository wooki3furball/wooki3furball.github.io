"use strict";
const sand = "rgb(213, 193, 135)";
const magenta = "rgb(255, 0, 255)";
const darkblue = "rgb(0, 0, 255)";
const PATT1 = [
    "rgb(47, 41, 10)", "rgb(245, 66, 0)", "rgb(249, 168, 29)",
    "rgb(226, 200, 162)", "rgb(134, 142, 93)", "rgb(255, 0, 0)"
];
const PATT2 = [
    "rgb(89, 73, 15)", "rgb(213, 72, 14)", "rgb(125, 175, 40)",
    "rgb(195, 211, 48)", "rgb(213, 193, 135)", "rgb(0, 0, 255)"
];
const PATT3 = [
    "rgb(230, 230, 250)", "rgb(75, 0, 130)", "rgb(138, 43, 226)",
    "rgb(255, 0, 255)", "rgb(218, 112, 214)", "rgb(153, 50, 204)"
];
const colorInput1 = document.getElementById("colorInput1");
const colorInput2 = document.getElementById("colorInput2");
const colorInput3 = document.getElementById("colorInput3");
let color2 = colorInput2.value;
let color1 = colorInput1.value;
let color3 = colorInput3.value;
let lastColorChangeTime = 0;
let hasColorChanged = false;
colorInput1.addEventListener("input", () => {
    color1 = colorInput1.value;
});
colorInput2.addEventListener("input", () => {
    color2 = colorInput2.value;
});
colorInput3.addEventListener("input", () => {
    color3 = colorInput3.value;
});
let renderRate = 50;
const adjustRenderRateButton = document.getElementById("adjustRenderRateButton");
if (adjustRenderRateButton) {
    adjustRenderRateButton.addEventListener("click", () => {
        const newRenderRateStr = window.prompt("Enter the new render rate in milliseconds (higher value = slower rendering):");
        if (newRenderRateStr === null) {
            alert("No value entered. Please click the button again and enter a value.");
            return;
        }
        const parsedValue = parseInt(newRenderRateStr, 10);
        if (!isNaN(parsedValue) && parsedValue > 0) {
            renderRate = parsedValue;
            let worker = new Worker(workerURL);
            if (worker) {
                worker.terminate();
            }
            worker = new Worker(workerURL);
            worker.onmessage = function (event) {
                var _a;
                if (!isRendering)
                    return;
                if (event.data.grid) {
                    const gridData = event.data.grid;
                    for (let x = 0; x < width; x++) {
                        for (let y = 0; y < height; y++) {
                            const newPile = gridData[x][y];
                            const currentPile = parseInt((_a = grid[x][y].textContent) !== null && _a !== void 0 ? _a : "0");
                            if (newPile !== currentPile) {
                                hasColorChanged = true;
                            }
                            grid[x][y].textContent = newPile;
                            grid[x][y].style.backgroundColor = getColorForPile(newPile);
                        }
                    }
                    if (hasColorChanged) {
                        lastColorChangeTime = performance.now();
                        hasColorChanged = false;
                    }
                }
                if (event.data.executionTimeWorker) {
                    executionTimeWorker = event.data.executionTimeWorker;
                }
            };
            startSandpile();
        }
        else {
            alert("Please enter a valid number greater than 0 for the render rate.");
        }
    });
}
const width = 120;
const height = 120;
let maxTopple = 10000;
const grid = [];
const gridContainer = document.querySelector(".grid");
if (gridContainer) {
    for (let x = 0; x < width; x++) {
        grid[x] = [];
        for (let y = 0; y < height; y++) {
            const gridItem = document.createElement("div");
            gridItem.className = "grid-item";
            gridItem.style.backgroundColor = PATT1[5];
            gridItem.textContent = "0";
            gridContainer.appendChild(gridItem);
            grid[x][y] = gridItem;
        }
    }
}
const workerCode = `
self.onmessage = function(event) {
  const { width, height, centerValue, renderRate } = event.data;
  const startTimeWorker = performance.now(); // Record the start time for the worker thread

  const grid = Array.from({ length: width }, () => Array(height).fill(0));

  // Initialize the center value
  grid[Math.floor(width / 2)][Math.floor(height / 2)] = centerValue;

  const hasPilesToTopple = () => {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (grid[x][y] > 3) {
          return true;
        }
      }
    }
    return false;
  };

  const interval = setInterval(() => {
    if (!hasPilesToTopple()) {
      clearInterval(interval);
      const endTimeWorker = performance.now(); // Record end time for worker thread
      postMessage({ executionTimeWorker: endTimeWorker - startTimeWorker }); // Send the worker's execution time to the main thread
      return;
    }

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const pile = grid[x][y];

        if (pile > 3) {
          grid[x][y] = pile - 4;

          if (x + 1 < width) {
            grid[x + 1][y]++;
          }

          if (x - 1 >= 0) {
            grid[x - 1][y]++;
          }

          if (y + 1 < height) {
            grid[x][y + 1]++;
          }

          if (y - 1 >= 0) {
            grid[x][y - 1]++;
          }
        }
      }
    }

    postMessage({ grid });
  }, renderRate);
}
`;
const blob = new Blob([workerCode], { type: "text/javascript" });
const workerURL = URL.createObjectURL(blob);
const worker = new Worker(workerURL);
let centerValue = 0;
let executionTimeMain = 0;
let isRendering = false;
function startSandpile() {
    isRendering = true;
    const startTimeMain = performance.now();
    worker.postMessage({ width, height, maxTopple, centerValue, renderRate });
    const checkRenderCompletion = setInterval(() => {
        if (executionTimeWorker > 0) {
            clearInterval(checkRenderCompletion);
            const endTimeMain = performance.now();
            executionTimeMain = endTimeMain - startTimeMain;
            alert(`Main thread rendering time: ${executionTimeMain.toFixed(2)} ms\nWorker thread calculation time: ${executionTimeWorker.toFixed(2)} ms`);
            isRendering = false;
        }
    }, 100);
}
const startButton = document.getElementById("startButton");
if (startButton) {
    startButton.addEventListener("click", () => {
        const centerValueStr = window.prompt("Enter the center value (number greater than 0):");
        if (centerValueStr === null) {
            alert("No value entered. Please click the button again and enter a value.");
            return;
        }
        const parsedValue = parseInt(centerValueStr, 10);
        if (!isNaN(parsedValue) && parsedValue > 0) {
            centerValue = parsedValue;
            startSandpile();
        }
        else {
            alert("Please enter a valid number greater than 0 for the center value.");
        }
    });
}
function getColorForPile(pile) {
    switch (pile) {
        case 0:
            return sand;
        case 1:
            return color1;
        case 2:
            return color2;
        case 3:
            return color3;
        case 4:
            return magenta;
        default:
            return darkblue;
    }
}
let executionTimeWorker = 0;
worker.onmessage = function (event) {
    var _a;
    if (!isRendering)
        return;
    if (event.data.grid) {
        const gridData = event.data.grid;
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const newPile = gridData[x][y];
                const currentPile = parseInt((_a = grid[x][y].textContent) !== null && _a !== void 0 ? _a : "0");
                if (newPile !== currentPile) {
                    hasColorChanged = true;
                }
                grid[x][y].textContent = newPile;
                grid[x][y].style.backgroundColor = getColorForPile(newPile);
            }
        }
        if (hasColorChanged) {
            lastColorChangeTime = performance.now();
            hasColorChanged = false;
        }
    }
    if (event.data.executionTimeWorker) {
        executionTimeWorker = event.data.executionTimeWorker;
    }
};
