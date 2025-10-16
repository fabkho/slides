const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const presentationName = process.argv[2];
const presentationsDir = path.join(__dirname, '..', 'presentations');

function listAvailablePresentations() {
  try {
    const available = fs.readdirSync(presentationsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    if (available.length > 0) {
      console.log('\nAvailable presentations:');
      available.forEach(name => console.log(`- ${name}`));
    }
  } catch (e) {
    // Ignore if presentations dir doesn't exist
  }
}

if (!presentationName) {
  console.error('Error: Please provide the name of the presentation.');
  console.log('Usage: pnpm dev <presentation-name>');
  listAvailablePresentations();
  process.exit(1);
}

const slidePath = path.join('presentations', presentationName, 'slides.md');

if (!fs.existsSync(path.join(__dirname, '..', slidePath))) {
    console.error(`Error: Could not find slides at "${slidePath}"`);
    listAvailablePresentations();
    process.exit(1);
}

console.log(`Starting Slidev for: ${slidePath}`);

const slidev = spawn('pnpm', ['slidev', slidePath], {
  stdio: 'inherit',
  shell: true
});

slidev.on('close', (code) => {
  console.log(`Slidev process exited with code ${code}`);
});
