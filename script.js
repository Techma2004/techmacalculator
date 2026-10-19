(function () {
  "use strict";

const input = document.getElementById("output-onscreen");
  const result = document.getElementById("result");
  const status = document.getElementById("status");
  const historyList = document.getElementById("history-list");
  const emptyHistory = document.getElementById("empty-history");
  const clearHistory = document.getElementById("clear-history");
  const themeToggle = document.getElementById("theme-toggle");
  const scienceToggle = document.getElementById("science-toggle");
  const scienceKeys = document.getElementById("scientific-keys");
  const angleLabel = document.getElementById("angle-label");

const storageKey = "techma-calculator-v2";
  const saved = readState();

let mode = saved.mode === "RAD" ? "RAD" : "DEG";
  let ans = Number.isFinite(saved.ans) ? saved.ans : 0;
  let currentResult = ans;
  let justCalculated = false;
  let scientific = saved.scientific !== false;

const preferredTheme = window.matchMedia("(prefers-color-scheme: light)")
    .matches
    ? "light"
    : "dark";

let theme = ["light", "dark"].includes(saved.theme)
    ? saved.theme
    : preferredTheme;

let history = Array.isArray(saved.history)
    ? saved.history.filter(validHistoryEntry).slice(0, 20)
    : [];

function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

function validHistoryEntry(entry) {
    return (
      entry &&
      typeof entry.expression === "string" &&
      entry.expression.length <= 500 &&
      Number.isFinite(entry.value) &&
      (entry.mode === "DEG" || entry.mode === "RAD")
    );
  }

function persist() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ mode, ans, theme, scientific, history })
      );
      return true;
    } catch {
      return false;
    }
  }

function announce(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("error", isError);
    input.setAttribute("aria-invalid", String(isError));
  }

function format(value) {
    // Display rounding only. Calculations and history retain the raw Number.
    return String(Number(value.toPrecision(12)));
  }

function renderSettings() {
    document.documentElement.dataset.theme = theme;

themeToggle.textContent = theme === "dark" ? "Light theme" : "Dark theme";
    themeToggle.setAttribute(
      "aria-label",
      `Switch to ${theme === "dark" ? "light" : "dark"} theme`
    );

document.querySelectorAll("[data-mode]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
    });

angleLabel.textContent = mode === "DEG" ? "DEGREES" : "RADIANS";
    scienceKeys.hidden = !scientific;
    scienceToggle.setAttribute("aria-expanded", String(scientific));
    scienceToggle.textContent = scientific ? "Scientific" : "Show scientific";
  }

function renderHistory() {
    historyList.replaceChildren();
    emptyHistory.hidden = history.length > 0;
    clearHistory.disabled = history.length === 0;

history.forEach((entry) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      const expression = document.createElement("span");
      const value = document.createElement("span");
      const unit = document.createElement("span");

button.type = "button";
      button.className = "history-item";
      button.setAttribute("aria-label", `Reuse result ${entry.value}`);

expression.className = "history-expression";
      expression.textContent = entry.expression;

value.className = "history-value";
      value.textContent = `= ${format(entry.value)}`;

unit.className = "history-mode";
      unit.textContent = entry.mode;

button.append(expression, value, unit);

button.addEventListener("click", () => {
        input.value = String(entry.value);
        currentResult = entry.value;
        result.textContent = format(currentResult);
        justCalculated = true;
        focusAtEnd();
        announce("Result restored. Use an operator to continue.");
      });

item.append(button);
      historyList.append(item);
    });
  }

function focusAtEnd() {
    input.focus({ preventScroll: true });
    const end = input.value.length;
    input.setSelectionRange(end, end);
  }

function markEdited() {
    justCalculated = false;
    announce("Press Enter or = to calculate.");
  }

function insert(text) {
    const token = String(text);
    let start = input.selectionStart ?? input.value.length;
    let end = input.selectionEnd ?? start;

// Onscreen entry after a result:
    // operators continue it; numbers/functions start a new expression.
    if (justCalculated && start === end && end === input.value.length) {
      if (/^(?:[+\-*/%^!])/.test(token)) {
        // Parentheses preserve negative-result precedence, e.g. (-3)^2.
        input.value = `(${String(currentResult)})`;
      } else {
        input.value = "";
      }

start = input.value.length;
      end = start;
    }

if (input.value.length - (end - start) + token.length > 500) {
      announce("Expressions are limited to 500 characters.", true);
      return;
    }

input.setRangeText(token, start, end, "end");
    input.focus({ preventScroll: true });
    markEdited();
  }

function clear() {
    input.value = "";
    result.textContent = "0";
    currentResult = 0;
    justCalculated = false;
    input.focus({ preventScroll: true });
    announce("Cleared. Ans still holds your last calculated answer.");
  }

function removeCharacter() {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;

input.setRangeText("", start === end ? Math.max(0, start - 1) : start, end, "end");
    input.focus({ preventScroll: true });
    markEdited();
  }

function calculate() {
    const expression = input.value.trim();
    const previousAnswer = ans;

try {
      const value = window.TechmaMath.evaluate(expression, { mode, ans });

// Resolve Ans in the history label so saved calculations are unambiguous.
      const historyExpression = expression.replace(
        /\bans\b/gi,
        () => `(${String(previousAnswer)})`
      );

currentResult = value;
      ans = value;
      result.textContent = format(value);
      input.value = String(value);
      justCalculated = true;

history.unshift({
        expression:
          historyExpression.length <= 500 ? historyExpression : expression,
        value,
        mode
      });
      history = history.slice(0, 20);

const stored = persist();
      renderHistory();
      focusAtEnd();

announce(
        stored
          ? `Result: ${format(value)}.`
          : `Result: ${format(value)}. Browser storage is unavailable; history is temporary.`
      );
    } catch (error) {
      justCalculated = false;
      announce(
        error instanceof Error ? error.message : "Unable to calculate.",
        true
      );
    }
  }

document.querySelectorAll("[data-insert]").forEach((button) => {
    button.addEventListener("click", () => insert(button.dataset.insert));
  });

const actions = {
    clear,
    delete: removeCharacter,
    calculate
  };

document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => actions[button.dataset.action]());
  });

document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.mode;
      renderSettings();
      persist();
      announce(`Angle mode: ${mode}. Applies to the next calculation.`);
    });
  });

input.addEventListener("input", markEdited);

input.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) {
      return;
    }

if (event.key === "Enter" || event.key === "=") {
      event.preventDefault();
      calculate();
      return;
    }

if (event.key === "Escape") {
      event.preventDefault();
      clear();
      return;
    }

if (
      justCalculated &&
      event.key.length === 1 &&
      input.selectionStart === input.selectionEnd &&
      input.selectionEnd === input.value.length
    ) {
      event.preventDefault();
      insert(event.key);
    }
  });

// Allow number/operator entry when focus is outside the expression field.
  // Native Enter/Space behavior for focused buttons is preserved.
  document.addEventListener("keydown", (event) => {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.isComposing ||
      event.target.closest("input, textarea, select, [contenteditable]")
    ) {
      return;
    }

if (/^[0-9.+\-*/%^!()]$/.test(event.key)) {
      event.preventDefault();
      insert(event.key);
    } else if (event.key === "=") {
      event.preventDefault();
      calculate();
    } else if (event.key === "Escape") {
      event.preventDefault();
      clear();
    }
  });

themeToggle.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    renderSettings();
    persist();
  });

scienceToggle.addEventListener("click", () => {
    scientific = !scientific;
    renderSettings();
    persist();
  });

clearHistory.addEventListener("click", () => {
    history = [];
    const stored = persist();
    renderHistory();
    announce(
      stored
        ? "History cleared."
        : "History cleared for this session; saved storage could not be updated."
    );
  });

document.getElementById("copy-result").addEventListener("click", async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable.");
      }
      await navigator.clipboard.writeText(String(currentResult));
      announce("Full-precision result copied.");
    } catch {
      announce("Clipboard unavailable. Select and copy the result manually.");
    }
  });

// Retain the original callable helpers for compatibility.
  window.display = insert;
  window.calculate = calculate;
  window.clr = clear;
  window.del = removeCharacter;

result.textContent = format(currentResult);
  renderSettings();
  renderHistory();
})();
