(function (root) {
  "use strict";

function finite(value) {
    if (!Number.isFinite(value)) {
      throw new Error("Result is undefined or exceeds the supported range.");
    }
    return Object.is(value, -0) ? 0 : value;
  }

function factorial(value) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error("Factorial requires a non-negative integer.");
    }
    if (value > 170) {
      throw new Error("Factorial is supported only up to 170.");
    }

let result = 1;
    for (let n = 2; n <= value; n += 1) result *= n;
    return finite(result);
  }

function tokenize(source) {
    const tokens = [];
    let position = 0;

while (position < source.length) {
      const remaining = source.slice(position);
      const whitespace = /^\s+/.exec(remaining);

if (whitespace) {
        position += whitespace[0].length;
        continue;
      }

const number = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(
        remaining
      );

if (number) {
        tokens.push({
          type: "number",
          value: finite(Number(number[0]))
        });
        position += number[0].length;
        continue;
      }

const name = /^[a-zA-Z]+/.exec(remaining);
      if (name) {
        tokens.push({ type: "name", value: name[0].toLowerCase() });
        position += name[0].length;
        continue;
      }

if (remaining.startsWith("**")) {
        tokens.push({ type: "^" });
        position += 2;
        continue;
      }

const character = source[position];

if ("+-*/%^!()".includes(character)) {
        tokens.push({ type: character });
        position += 1;
        continue;
      }

throw new Error(`Unsupported character at position ${position + 1}.`);
    }

tokens.push({ type: "end" });
    return tokens;
  }

function evaluate(expression, options = {}) {
    if (typeof expression !== "string" || !expression.trim()) {
      throw new Error("Enter an expression first.");
    }

if (expression.length > 500) {
      throw new Error("Expressions are limited to 500 characters.");
    }

const mode = options.mode ?? "DEG";
    const ans = options.ans ?? 0;

if (mode !== "DEG" && mode !== "RAD") {
      throw new Error("Choose DEG or RAD.");
    }

if (typeof ans !== "number" || !Number.isFinite(ans)) {
      throw new Error("Previous answer must be a finite number.");
    }

const normalized = expression
      .replace(/π/g, "pi")
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-");

const tokens = tokenize(normalized);
    let cursor = 0;

function accept(type) {
      if (tokens[cursor].type !== type) return false;
      cursor += 1;
      return true;
    }

function requireToken(type) {
      if (!accept(type)) {
        throw new Error(`Expected "${type}".`);
      }
    }

function applyFunction(name, value) {
      const angle = mode === "DEG" ? value * (Math.PI / 180) : value;
      const fromRadians = (radians) =>
        mode === "DEG" ? radians * (180 / Math.PI) : radians;

switch (name) {
        case "sin":
          return finite(Math.sin(angle));
        case "cos":
          return finite(Math.cos(angle));
        case "tan":
          if (Math.abs(Math.cos(angle)) < 1e-12) {
            throw new Error("Tangent is undefined or too close to a pole.");
          }
          return finite(Math.tan(angle));
        case "asin":
        case "acos":
          if (Math.abs(value) > 1) {
            throw new Error(`${name} requires a value between -1 and 1.`);
          }
          return finite(
            fromRadians(name === "asin" ? Math.asin(value) : Math.acos(value))
          );
        case "atan":
          return finite(fromRadians(Math.atan(value)));
        case "sqrt":
          if (value < 0) {
            throw new Error("Square root requires a non-negative real value.");
          }
          return Math.sqrt(value);
        case "cbrt":
          return Math.cbrt(value);
        case "ln":
        case "log":
          if (value <= 0) {
            throw new Error("Logarithms require a positive value.");
          }
          return name === "ln" ? Math.log(value) : Math.log10(value);
        case "exp":
          return finite(Math.exp(value));
        case "abs":
          return Math.abs(value);
        case "inv":
          if (value === 0) throw new Error("Cannot divide by zero.");
          return finite(1 / value);
        default:
          throw new Error(`Unknown function "${name}".`);
      }
    }

function primary() {
      const token = tokens[cursor];

if (accept("number")) return token.value;

if (accept("(")) {
        const value = sum();
        requireToken(")");
        return value;
      }

if (accept("name")) {
        if (token.value === "pi") return Math.PI;
        if (token.value === "e") return Math.E;
        if (token.value === "ans") return ans;

requireToken("(");
        const argument = sum();
        requireToken(")");
        return finite(applyFunction(token.value, argument));
      }

throw new Error("Expected a number, constant or function.");
    }

function postfix() {
      let value = primary();
      while (accept("!")) value = factorial(value);
      return value;
    }

function power() {
      const value = postfix();

// Unary on the right permits 2^-3 and makes powers right-associative.
      if (accept("^")) return finite(Math.pow(value, unary()));

return value;
    }

function unary() {
      if (accept("+")) return unary();
      if (accept("-")) return finite(-unary());
      return power();
    }

function product() {
      let value = unary();

while (true) {
        if (accept("*")) {
          value = finite(value * unary());
        } else if (accept("/")) {
          const divisor = unary();
          if (divisor === 0) throw new Error("Cannot divide by zero.");
          value = finite(value / divisor);
        } else if (accept("%")) {
          const divisor = unary();
          if (divisor === 0) throw new Error("Remainder by zero is undefined.");
          value = finite(value % divisor);
        } else {
          return value;
        }
      }
    }

function sum() {
      let value = product();

while (true) {
        if (accept("+")) value = finite(value + product());
        else if (accept("-")) value = finite(value - product());
        else return value;
      }
    }

const result = sum();

if (tokens[cursor].type !== "end") {
      throw new Error("Unexpected input. Use * for multiplication.");
    }

return finite(result);
  }

const api = Object.freeze({ evaluate });

if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.TechmaMath = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
