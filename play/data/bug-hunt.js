// Bug Hunt levels. Each program has exactly one buggy line (`bug`, 1-based) and the corrected line (`fix`).
// tools/check-code-games.mjs checks that the buggy version fails and the fixed version passes `test`.
window.BUG_HUNT = [
  {
    title: "Add up a list",
    code: "function sum(nums) {\n  let total = 0;\n  for (let i = 0; i <= nums.length; i++) {\n    total += nums[i];\n  }\n  return total;\n}\nconsole.log(sum([1, 2, 3])); // expected 6",
    bug: 3, fix: "  for (let i = 0; i < nums.length; i++) {",
    test: "sum([1, 2, 3]) === 6",
    explain: "Arrays start at index 0, so the last item is at <code>nums.length - 1</code>. With <code>&lt;=</code> the loop reads one item too many: <code>nums[3]</code> is <code>undefined</code>, and <code>6 + undefined</code> is <code>NaN</code>. This is called an <em>off-by-one</em> error."
  },
  {
    title: "Find the highest temperature",
    code: "function highest(temps) {\n  let best = 0;\n  for (const t of temps) {\n    if (t > best) best = t;\n  }\n  return best;\n}\nconsole.log(highest([-5, -2, -9])); // expected -2",
    bug: 2, fix: "  let best = temps[0];",
    test: "highest([-5, -2, -9]) === -2",
    explain: "Starting at 0 assumes there is always a value above 0. In a cold place every temperature is negative, so the function wrongly returns 0. Start with the first item (or <code>-Infinity</code>)."
  },
  {
    title: "Count even numbers",
    code: "function countEvens(nums) {\n  let count = 0;\n  for (const n of nums) {\n    if (n % 2 === 1) count++;\n  }\n  return count;\n}\nconsole.log(countEvens([2, 4, 5])); // expected 2",
    bug: 4, fix: "    if (n % 2 === 0) count++;",
    test: "countEvens([2, 4, 5]) === 2",
    explain: "An even number leaves remainder 0 when divided by 2. <code>n % 2 === 1</code> counts the <em>odd</em> numbers instead."
  },
  {
    title: "Reverse a word",
    code: "function reverse(word) {\n  let out = \"\";\n  for (let i = word.length; i >= 0; i--) {\n    out += word[i];\n  }\n  return out;\n}\nconsole.log(reverse(\"abc\")); // expected \"cba\"",
    bug: 3, fix: "  for (let i = word.length - 1; i >= 0; i--) {",
    test: "reverse(\"abc\") === \"cba\"",
    explain: "The last character is at <code>word.length - 1</code>. Starting at <code>word.length</code> reads past the end, so the result begins with the text <code>\"undefined\"</code>."
  },
  {
    title: "Exam grades",
    code: "function grade(score) {\n  if (score >= 90) return \"A\";\n  if (score >= 75) return \"B\";\n  if (score = 60) return \"C\";\n  return \"F\";\n}\nconsole.log(grade(20)); // expected \"F\"",
    bug: 4, fix: "  if (score >= 60) return \"C\";",
    test: "grade(20) === \"F\" && grade(65) === \"C\"",
    explain: "A single <code>=</code> <em>assigns</em> 60 to <code>score</code> instead of comparing. The value 60 counts as true, so every score below 75 gets a C. Compare with <code>&gt;=</code> (or <code>===</code> for equality)."
  },
  {
    title: "Factorial",
    code: "function factorial(n) {\n  if (n === 0) return 0;\n  return n * factorial(n - 1);\n}\nconsole.log(factorial(5)); // expected 120",
    bug: 2, fix: "  if (n === 0) return 1;",
    test: "factorial(5) === 120",
    explain: "Every step multiplies by the result of the step below, and the last step returns 0, so the whole answer becomes 0. By definition 0! is 1, which is the correct base case."
  },
  {
    title: "Title Case",
    code: "function titleCase(text) {\n  return text\n    .split(\" \")\n    .map((w) => w[0].toUpperCase() + w.slice(0))\n    .join(\" \");\n}\nconsole.log(titleCase(\"hello world\")); // expected \"Hello World\"",
    bug: 4, fix: "    .map((w) => w[0].toUpperCase() + w.slice(1))",
    test: "titleCase(\"hello world\") === \"Hello World\"",
    explain: "<code>slice(0)</code> returns the <em>whole</em> word, so the first letter appears twice: <code>\"HHello\"</code>. <code>slice(1)</code> returns everything after the first letter."
  },
  {
    title: "Remove duplicates",
    code: "function unique(items) {\n  const seen = [];\n  for (const item of items) {\n    if (seen.includes(item)) seen.push(item);\n  }\n  return seen;\n}\nconsole.log(unique([1, 1, 2])); // expected [1, 2]",
    bug: 4, fix: "    if (!seen.includes(item)) seen.push(item);",
    test: "JSON.stringify(unique([1, 1, 2])) === \"[1,2]\"",
    explain: "The condition is reversed: it only adds an item if it was <em>already</em> seen, and since <code>seen</code> starts empty, nothing is ever added. It needs <code>!</code> (not). Shortcut: <code>[...new Set(items)]</code>."
  },
  {
    title: "Fetch a user",
    code: "async function getUserName(id) {\n  const res = await fetch(`/api/users/${id}`);\n  const user = res.json();\n  return user.name;\n}",
    bug: 3, fix: "  const user = await res.json();",
    test: null,
    explain: "<code>res.json()</code> returns a <em>Promise</em>, not the data. Without <code>await</code>, <code>user</code> is the Promise, and <code>user.name</code> is <code>undefined</code>."
  },
  {
    title: "Is it in the cart?",
    code: "function inCart(cart, item) {\n  for (const c of cart) {\n    if (c === item) return true;\n  }\n  return false;\n}\nconsole.log(inCart([{ id: 7 }], { id: 7 })); // expected true",
    bug: 3, fix: "    if (c.id === item.id) return true;",
    test: "inCart([{ id: 7 }], { id: 7 }) === true",
    explain: "<code>===</code> on objects checks whether they are the <em>same object</em> in memory, not whether they look the same. Two separate <code>{ id: 7 }</code> objects are never equal. Compare a unique field such as <code>id</code>."
  },
  {
    title: "Buttons in a loop",
    code: "const buttons = [];\nfor (var i = 0; i < 3; i++) {\n  buttons.push(() => i);\n}\nconsole.log(buttons[0]()); // expected 0",
    bug: 2, fix: "for (let i = 0; i < 3; i++) {",
    test: "buttons[0]() === 0",
    explain: "With <code>var</code> there is only one <code>i</code>, shared by every function, and it is 3 when the functions run. <code>let</code> creates a fresh <code>i</code> for each loop round, so each function remembers its own value."
  },
  {
    title: "Binary search",
    code: "function search(sorted, target) {\n  let lo = 0, hi = sorted.length - 1;\n  while (lo <= hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    if (sorted[mid] === target) return mid;\n    if (sorted[mid] < target) lo = mid;\n    else hi = mid - 1;\n  }\n  return -1;\n}",
    bug: 6, fix: "    if (sorted[mid] < target) lo = mid + 1;",
    test: "search([1, 3, 5, 7], 7) === 3 && search([1, 3], 4) === -1",
    loops: true,
    explain: "If <code>mid</code> is too small, the answer must be <em>after</em> it. Setting <code>lo = mid</code> can leave <code>lo</code> unchanged, so the loop never ends. <code>mid + 1</code> always shrinks the range."
  },
  {
    title: "Cheapest price",
    code: "const prices = [250, 1200, 99, 5];\nprices.sort();\nconsole.log(prices[0]); // expected 5",
    bug: 2, fix: "prices.sort((a, b) => a - b);",
    test: "prices[0] === 5",
    explain: "<code>sort()</code> compares values as text by default, so <code>\"1200\"</code> comes first because it starts with \"1\". A compare function <code>(a, b) =&gt; a - b</code> sorts numbers by value."
  },
  {
    title: "Format a date",
    code: "function formatDate(d) {\n  const day = d.getDate();\n  const month = d.getMonth();\n  const year = d.getFullYear();\n  return `${day}/${month}/${year}`;\n}\nconsole.log(formatDate(new Date(2026, 0, 26))); // expected \"26/1/2026\"",
    bug: 3, fix: "  const month = d.getMonth() + 1;",
    test: "formatDate(new Date(2026, 0, 26)) === \"26/1/2026\"",
    explain: "<code>getMonth()</code> counts from 0 (January is 0, December is 11), so the date prints as <code>26/0/2026</code>. Add 1. <code>getDate()</code>, however, starts at 1, which is a classic trap."
  },
  {
    title: "Stopwatch",
    code: "const stopwatch = {\n  seconds: 0,\n  start() {\n    setInterval(function () {\n      this.seconds++;\n    }, 1000);\n  },\n};",
    bug: 4, fix: "    setInterval(() => {",
    test: null,
    explain: "Inside a normal <code>function</code> called by <code>setInterval</code>, <code>this</code> is not the stopwatch, so <code>seconds</code> never changes. An arrow function keeps the <code>this</code> of <code>start()</code>, which is the stopwatch."
  }
];
