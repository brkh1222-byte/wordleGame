const { JSDOM } = require("jsdom");
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const script = fs.readFileSync(path.join(__dirname, "wordle.js"), "utf8");

function createGame() {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
  });

  const { window } = dom;
  window.eval(script);

  return {
    window,
    tiles: [...window.document.querySelectorAll(".board div")],
  };
}

test("wordle only allows five letters per guess", () => {
  const { window, tiles } = createGame();

  ["A", "B", "C", "D", "E", "F"].forEach((letter) => window.addLetter(letter));

  assert.equal(tiles[0].textContent, "A");
  assert.equal(tiles[1].textContent, "B");
  assert.equal(tiles[2].textContent, "C");
  assert.equal(tiles[3].textContent, "D");
  assert.equal(tiles[4].textContent, "E");
  assert.equal(tiles[5].textContent, "");
  assert.equal(window.currentTileIndex, 5);
});

test("winning guess marks the game as won", async () => {
  const { window } = createGame();

  ["B", "L", "A", "C", "K"].forEach((letter) => window.addLetter(letter));
  window.submitGuess();

  await new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.congratulations.textContent === "YOU WON!") {
        resolve();
        return;
      }
      if (Date.now() - start > 5000) {
        reject(new Error("Timed out waiting for win message"));
        return;
      }
      setTimeout(check, 50);
    };

    check();
  });

  assert.equal(window.congratulations.textContent, "YOU WON!");
  assert.equal(window.gameOver, true);
});
