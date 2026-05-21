const minimum = [22, 12, 0];
const actual = process.versions.node;
const actualParts = actual.split('.').map(Number);

let isTooOld = false;

for (const [index, minimumPart] of minimum.entries()) {
  const actualPart = actualParts[index];

  if (!Number.isInteger(actualPart) || actualPart < minimumPart) {
    isTooOld = true;
    break;
  }

  if (actualPart > minimumPart) {
    break;
  }
}

if (isTooOld) {
  console.error(
    `\n  This project requires Node ${minimum.join('.')}+ — got ${actual}.\n` +
      `  Use nvm (\`nvm install\`), fnm, or your version manager of choice.\n` +
      `  See .nvmrc / .node-version / package.json#engines.\n`,
  );
  process.exit(1);
}
