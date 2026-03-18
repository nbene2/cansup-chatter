const regex = /Section 2:\s*\*?Word/i;
console.log("Section 2: Word Chart", regex.test("Section 2: Word Chart")); // true
console.log("Section 2:  Word Chart", regex.test("Section 2:  Word Chart")); // true
console.log("Section 2: **Word Chart**", regex.test("Section 2: **Word Chart**")); // FALSE!
console.log("## Section 2: Word Chart", regex.test("## Section 2: Word Chart")); // true

const newRegex = /Section 2[:.]?\s*\*?\*?Word/i;
console.log("Section 2: **Word Chart** (new)", newRegex.test("Section 2: **Word Chart**"));
