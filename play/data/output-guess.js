// Output Guess levels. `answer` is exactly what the snippet prints (lines joined by "\n").
// tools/check-code-games.mjs runs every snippet and fails if an answer is wrong.
window.OUTPUT_GUESS = [
  {
    code: 'console.log(2 + "2");',
    choices: ["4", "22", "NaN", "TypeError"],
    answer: "22",
    explain: "When one side of <code>+</code> is a string, JavaScript converts the other side to a string and joins them. <code>2</code> becomes <code>\"2\"</code>, and <code>\"2\" + \"2\"</code> is <code>\"22\"</code>."
  },
  {
    code: 'console.log("5" - 2);',
    choices: ["3", "52", "NaN", "\"3\""],
    answer: "3",
    explain: "Unlike <code>+</code>, the <code>-</code> operator only works on numbers, so <code>\"5\"</code> is converted to the number 5. The result is the number 3."
  },
  {
    code: 'const nums = [1, 2, 3];\nnums.push(4);\nconsole.log(nums.length);',
    choices: ["3", "4", "TypeError", "undefined"],
    answer: "4",
    explain: "<code>const</code> stops you from re-assigning the variable, but the array itself can still change. <code>push</code> adds a fourth item, so the length is 4."
  },
  {
    code: 'console.log(typeof null);',
    choices: ["null", "object", "undefined", "number"],
    answer: "object",
    explain: "This is a famous bug from the first version of JavaScript in 1995. It can never be fixed without breaking old websites, so <code>typeof null</code> is still <code>\"object\"</code>. To check for null, use <code>value === null</code>."
  },
  {
    code: 'console.log(0.1 + 0.2 === 0.3);',
    choices: ["true", "false", "NaN", "undefined"],
    answer: "false",
    explain: "Computers store decimals in binary, and 0.1 and 0.2 cannot be stored exactly. Their sum is <code>0.30000000000000004</code>. Compare money in paise (whole numbers) or check if the difference is tiny instead."
  },
  {
    code: 'const marks = [3, 1, 10, 2];\nmarks.sort();\nconsole.log(marks.join(","));',
    choices: ["1,2,3,10", "1,10,2,3", "10,3,2,1", "3,1,10,2"],
    answer: "1,10,2,3",
    explain: "Without a compare function, <code>sort()</code> compares items as <em>strings</em>, and <code>\"10\"</code> comes before <code>\"2\"</code> because <code>\"1\"</code> &lt; <code>\"2\"</code>. Use <code>marks.sort((a, b) =&gt; a - b)</code> to sort numbers."
  },
  {
    code: 'for (var i = 0; i < 3; i++) {}\nconsole.log(i);',
    choices: ["2", "3", "undefined", "ReferenceError"],
    answer: "3",
    explain: "<code>var</code> is not limited to the loop block, so <code>i</code> still exists after the loop. The loop stops when <code>i</code> reaches 3. With <code>let</code>, this line would throw a ReferenceError."
  },
  {
    code: 'const result = [1, 2, 3]\n  .map((n) => n * 2)\n  .filter((n) => n > 2);\nconsole.log(result.length);',
    choices: ["1", "2", "3", "0"],
    answer: "2",
    explain: "<code>map</code> doubles each number: <code>[2, 4, 6]</code>. <code>filter</code> keeps those greater than 2: <code>[4, 6]</code>. That is 2 items."
  },
  {
    code: 'let word = "hello";\nword[0] = "H";\nconsole.log(word);',
    choices: ["Hello", "hello", "H", "TypeError"],
    answer: "hello",
    explain: "Strings in JavaScript are <em>immutable</em>: you cannot change a character in place. The assignment is silently ignored. Build a new string instead: <code>\"H\" + word.slice(1)</code>."
  },
  {
    code: 'console.log(3 > 2 > 1);',
    choices: ["true", "false", "1", "SyntaxError"],
    answer: "false",
    explain: "It is read left to right: <code>3 &gt; 2</code> is <code>true</code>, then <code>true &gt; 1</code>. <code>true</code> becomes the number 1, and <code>1 &gt; 1</code> is false. Write <code>3 &gt; 2 &amp;&amp; 2 &gt; 1</code> instead."
  },
  {
    code: 'const user = { coins: 1 };\nconst copy = user;\ncopy.coins = 2;\nconsole.log(user.coins);',
    choices: ["1", "2", "undefined", "TypeError"],
    answer: "2",
    explain: "Objects are passed by reference. <code>copy</code> is not a new object, just a second name for the same one, so changing it changes <code>user</code> too. Make a real copy with <code>{ ...user }</code>."
  },
  {
    code: 'console.log([1, 2] + [3]);',
    choices: ["[1, 2, 3]", "1,23", "6", "NaN"],
    answer: "1,23",
    explain: "<code>+</code> does not join arrays. Both arrays are turned into strings first: <code>\"1,2\"</code> and <code>\"3\"</code>, which are then glued together into <code>\"1,23\"</code>. Use <code>[...a, ...b]</code> or <code>a.concat(b)</code>."
  },
  {
    code: 'let count = 2;\nconsole.log(count++ + ++count);',
    choices: ["5", "6", "7", "4"],
    answer: "6",
    explain: "<code>count++</code> gives the old value (2) and then makes count 3. <code>++count</code> first makes count 4 and gives 4. So it is 2 + 4 = 6."
  },
  {
    code: 'setTimeout(() => console.log("A"), 0);\nPromise.resolve().then(() => console.log("B"));\nconsole.log("C");',
    choices: ["A\nB\nC", "C\nB\nA", "C\nA\nB", "B\nC\nA"],
    answer: "C\nB\nA",
    explain: "Normal code runs first, so <code>C</code> prints immediately. Then JavaScript runs <em>microtasks</em> (promise callbacks, so <code>B</code>), and only after that <em>tasks</em> like <code>setTimeout</code> (<code>A</code>), even with a 0 ms delay."
  },
  {
    code: 'function getConfig() {\n  return\n  { debug: true };\n}\nconsole.log(getConfig());',
    choices: ["{ debug: true }", "undefined", "true", "SyntaxError"],
    answer: "undefined",
    explain: "JavaScript inserts a semicolon right after a <code>return</code> that ends a line, so the function returns nothing. The object below is never reached. Always start the returned value on the same line as <code>return</code>."
  }
];
