#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const deployPath = args[0];

if (!deployPath) {
  console.error('Usage: node scripts/deploy-frontend.js <deploy-path>');
  console.error('Example: node scripts/deploy-frontend.js /var/www/html/medialibrary');
  process.exit(1);
}

const frontendDir = path.join(__dirname, '..', 'apps', 'frontend');
const distDir = path.join(frontendDir, 'dist');

console.log('Building frontend...');
execSync('npm run build --workspace=apps/frontend', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

if (!fs.existsSync(distDir)) {
  console.error('Build failed: dist directory not found');
  process.exit(1);
}

const absDeployPath = path.resolve(deployPath);

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log(`Deploying to: ${absDeployPath}`);
copyDir(distDir, absDeployPath);

console.log('Deploy completed successfully!');
console.log(`Files deployed to: ${absDeployPath}`);
