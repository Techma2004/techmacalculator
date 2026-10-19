const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluate } = require("./engine.js");

function close(actual, expected, tolerance = 1e-10) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be close to ${expected}`
  );
}

test("preserves existing arithmetic behavior", () => {
  const cases = [
    ["2+3", 5],
    ["9-12", -3],
    ["6*7", 42],
    ["9/4", 2.25],
    ["2+3*4", 14],
    ["(2+3)*4", 20],
    ["10%3", 1],
    ["-10%3", -1],
    [".5+.25", 0.75],
    ["2**3", 8]
  ];

for (const [expression, expected] of cases) {
    assert.equal(evaluate(expression), expected, expression);
  }
});

test("powers, precedence, factorials and scientific notation", () => {
  assert.equal(evaluate("2^3^2"), 512);
  assert.equal(evaluate("-2^2"), -4);
  assert.equal(evaluate("(-2)^2"), 4);
  assert.equal(evaluate("2^-3"), 0.125);
  assert.equal(evaluate("0!"), 1);
  assert.equal(evaluate("5!"), 120);
  assert.equal(evaluate("sqrt(81)+cbrt(-8)"), 7);
  assert.equal(evaluate("1e3+2.5e-2"), 1000.025);
  assert.equal(evaluate("abs(-5)+inv(4)"), 5.25);
});

test("logarithms, constants and previous answer", () => {
  close(evaluate("ln(e)"), 1);
  close(evaluate("log(1000)"), 3);
  close(evaluate("exp(2)"), Math.exp(2));
  close(evaluate("pi"), Math.PI);
  assert.equal(evaluate("Ans*2", { ans: 21 }), 42);
});

test("degree and radian modes", () => {
  close(evaluate("sin(30)", { mode: "DEG" }), 0.5);
  close(evaluate("cos(60)", { mode: "DEG" }), 0.5);
  close(evaluate("tan(45)", { mode: "DEG" }), 1);
  close(evaluate("asin(0.5)", { mode: "DEG" }), 30);
  close(evaluate("acos(0.5)", { mode: "DEG" }), 60);
  close(evaluate("atan(1)", { mode: "DEG" }), 45);
  close(evaluate("sin(pi/2)", { mode: "RAD" }), 1);
});

test("rejects invalid input, domains and overflow", () => {
  const invalid = [
    "",
    "2+",
    "2 3",
    "2(3)",
    "sin()",
    "(2+3",
    "1/0",
    "0/0",
    "10%0",
    "sqrt(-1)",
    "ln(0)",
    "log(-1)",
    "asin(2)",
    "acos(-2)",
    "(-1)!",
    "2.5!",
    "171!",
    "exp(1000)",
    "alert(1)",
    "Math.random()",
    "constructor(1)",
    "2;3"
  ];

for (const expression of invalid) {
    assert.throws(() => evaluate(expression), undefined, expression);
  }

assert.throws(() => evaluate("tan(90)", { mode: "DEG" }));
  assert.throws(() => evaluate("1".repeat(501)));
});
