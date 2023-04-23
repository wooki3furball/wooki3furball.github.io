"use strict";
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
  const { width, height, centerValue } = event.data; // Add centerValue here

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

    postMessage(grid);
  }, 50);
}
`;
const blob = new Blob([workerCode], { type: "text/javascript" });
const workerURL = URL.createObjectURL(blob);
const worker = new Worker(workerURL);
let centerValue = 0;
function startSandpile() {
    worker.postMessage({ width, height, maxTopple, centerValue });
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
worker.onmessage = function (event) {
    const gridData = event.data;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const pile = gridData[x][y];
            switch (pile) {
                case 0:
                    grid[x][y].style.backgroundColor = PATT2[4];
                    break;
                case 1:
                    grid[x][y].style.backgroundColor = PATT2[1];
                    break;
                case 2:
                    grid[x][y].style.backgroundColor = PATT2[2];
                    break;
                case 3:
                    grid[x][y].style.backgroundColor = PATT3[1];
                    break;
                default:
                    if (pile === 4) {
                        grid[x][y].style.backgroundColor = PATT3[3];
                    }
                    else if (pile > 4) {
                        grid[x][y].style.backgroundColor = PATT2[5];
                    }
                    break;
            }
        }
    }
};
