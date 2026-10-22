const tiles = Array.from(document.querySelectorAll(".board div"));
const keys = Array.from(document.querySelectorAll(".keyboard button"));
const deleteBtn = document.querySelector(".deleteBtn");
const enterBtn = document.querySelector(".enterBtn");
const newGameBtn = document.querySelector("body > button");
const congratulations = document.querySelector(".congrats");

const MAX_ROWS = 6;
const MAX_COLS = 5;
const secretWord = "BLACK";

let currentRow = 0;
let currentCol = 0;
let currentTileIndex = 0;
let gameOver = false;
let isRevealing = false;
let pendingTimers = [];

const KEY_RANK = { "#a3adc3": 1, "#f2c135": 2, "#58ac58": 3 };

// addLetter/deleteLetter/submitGuess are already globals (function declarations);
// redefining them on window throws in real browsers. Only expose the let/const state.
Object.defineProperties(window, {
  currentRow: {
    get: () => currentRow,
    set: (value) => {
      currentRow = value;
    },
    configurable: true,
  },
  currentCol: {
    get: () => currentCol,
    set: (value) => {
      currentCol = value;
    },
    configurable: true,
  },
  currentTileIndex: {
    get: () => currentTileIndex,
    set: (value) => {
      currentTileIndex = value;
    },
    configurable: true,
  },
  gameOver: {
    get: () => gameOver,
    set: (value) => {
      gameOver = value;
    },
    configurable: true,
  },
  congratulations: {
    get: () => congratulations,
    set: (value) => {
      congratulations.textContent = value;
    },
    configurable: true,
  },
});

function syncTileIndex() {
  currentTileIndex = currentRow * MAX_COLS + currentCol;
}

function getCurrentRowTiles() {
  const rowStart = currentRow * MAX_COLS;
  return tiles.slice(rowStart, rowStart + MAX_COLS);
}

function schedule(fn, delay) {
  pendingTimers.push(setTimeout(fn, delay));
}

// Browsers normalize style colors to rgb(), so track the key state in a data attribute
// and never downgrade a key (green > yellow > grey).
function setKeyColor(letter, color) {
  keys.forEach((key) => {
    if (key.textContent.trim() !== letter) return;

    const currentRank = KEY_RANK[key.dataset.color] || 0;
    if (KEY_RANK[color] <= currentRank) return;

    key.dataset.color = color;
    key.style.backgroundColor = color;
    key.style.color = "white";
  });
}

function addLetter(letter) {
  if (gameOver || isRevealing || currentRow >= MAX_ROWS || currentCol >= MAX_COLS) return;

  const activeTile = getCurrentRowTiles()[currentCol];
  if (!activeTile) return;

  activeTile.textContent = letter;
  currentCol += 1;
  syncTileIndex();
}

function deleteLetter() {
  if (gameOver || isRevealing || currentCol <= 0) return;

  currentCol -= 1;
  syncTileIndex();

  const activeTile = getCurrentRowTiles()[currentCol];
  if (!activeTile) return;

  activeTile.textContent = "";
  activeTile.style.backgroundColor = "";
  activeTile.style.color = "";
  activeTile.classList.remove("flip");
}

function submitGuess() {
  if (gameOver || isRevealing) return;

  if (currentCol !== MAX_COLS) return;

  isRevealing = true;

  const rowStart = currentRow * MAX_COLS;
  const rowTiles = tiles.slice(rowStart, rowStart + MAX_COLS);
  const guess = rowTiles.map((tile) => tile.textContent.trim()).join("");
  const secretLetters = secretWord.split("");
  const colors = Array(MAX_COLS).fill("#a3adc3");

  for (let i = 0; i < MAX_COLS; i++) {
    if (guess[i] === secretWord[i]) {
      colors[i] = "#58ac58";
      secretLetters[i] = null;
    }
  }

  for (let i = 0; i < MAX_COLS; i++) {
    if (colors[i] !== "#58ac58") {
      const foundIndex = secretLetters.indexOf(guess[i]);
      if (foundIndex !== -1) {
        colors[i] = "#f2c135";
        secretLetters[foundIndex] = null;
      }
    }
  }

  rowTiles.forEach((tile, index) => {
    const color = colors[index];
    const letter = guess[index];

    schedule(() => {
      tile.classList.add("flip");

      schedule(() => {
        tile.style.backgroundColor = color;
        tile.style.color = "white";
        tile.classList.remove("flip");
        setKeyColor(letter, color);
      }, 250);
    }, index * 300);
  });

  const revealDuration = MAX_COLS * 300 + 250;

  schedule(() => {
    isRevealing = false;

    if (guess === secretWord) {
      congratulations.textContent = "YOU WON!";
      gameOver = true;
      return;
    }

    currentRow += 1;
    currentCol = 0;
    syncTileIndex();

    if (currentRow >= MAX_ROWS) {
      congratulations.textContent = `No more guesses! The word was ${secretWord}.`;
      gameOver = true;
    }
  }, revealDuration + 100);
}

keys.forEach((key) => {
  key.addEventListener("click", () => {
    if (key === deleteBtn) {
      deleteLetter();
    } else if (key === enterBtn) {
      submitGuess();
    } else {
      addLetter(key.textContent.trim());
    }
  });
});

document.addEventListener("keydown", (e) => {
  const key = e.key;

  if (e.ctrlKey || e.metaKey || e.altKey) return;

  // Stop Enter/Backspace from also "clicking" an on-screen key that has focus.
  if (key === "Enter" || key === "Backspace") e.preventDefault();

  if (key === "Backspace") {
    deleteLetter();
  } else if (key === "Enter") {
    submitGuess();
  } else if (key.length === 1 && key.match(/[a-zA-Z]/)) {
    addLetter(key.toUpperCase());
  }
});

newGameBtn.addEventListener("click", () => {
  congratulations.textContent = "";
  currentRow = 0;
  currentCol = 0;
  currentTileIndex = 0;
  gameOver = false;
  isRevealing = false;
  pendingTimers.forEach(clearTimeout);
  pendingTimers = [];

  tiles.forEach((tile) => {
    tile.textContent = "";
    tile.style.backgroundColor = "";
    tile.style.color = "";
    tile.classList.remove("flip");
  });

  keys.forEach((key) => {
    key.style.backgroundColor = "";
    key.style.color = "";
    delete key.dataset.color;
  });

  newGameBtn.blur();
});
