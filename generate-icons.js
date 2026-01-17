#!/usr/bin/env node

const fs = require('fs');

// Create minimal black and white icon SVG
function createMinimalIcon(size, filename) {
    const scale = size / 512;
    const canvas = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.215}" fill="#ffffff"/>

  <!-- Border -->
  <rect x="${size * 0.0195}" y="${size * 0.0195}" width="${size * 0.961}" height="${size * 0.961}" rx="${size * 0.195}" fill="none" stroke="#000000" stroke-width="${size * 0.0078}"/>

  <!-- Phone outline -->
  <rect x="${size * 0.305}" y="${size * 0.207}" width="${size * 0.391}" height="${size * 0.586}" rx="${size * 0.039}" fill="none" stroke="#000000" stroke-width="${size * 0.0059}"/>

  <!-- Screen top notch -->
  <line x1="${size * 0.441}" y1="${size * 0.207}" x2="${size * 0.559}" y2="${size * 0.207}" stroke="#ffffff" stroke-width="${size * 0.0078}"/>

  <!-- Face circle -->
  <circle cx="${size * 0.5}" cy="${size * 0.391}" r="${size * 0.098}" fill="none" stroke="#000000" stroke-width="${size * 0.0049}"/>

  <!-- Eyes -->
  <circle cx="${size * 0.461}" cy="${size * 0.371}" r="${size * 0.0078}" fill="#000000"/>
  <circle cx="${size * 0.539}" cy="${size * 0.371}" r="${size * 0.0078}" fill="#000000"/>

  <!-- Disappointed mouth -->
  <path d="M ${size * 0.461} ${size * 0.430} Q ${size * 0.5} ${size * 0.410} ${size * 0.539} ${size * 0.430}" stroke="#000000" stroke-width="${size * 0.0049}" fill="none" stroke-linecap="round"/>

  <!-- Chart bars -->
  <rect x="${size * 0.344}" y="${size * 0.547}" width="${size * 0.047}" height="${size * 0.098}" rx="${size * 0.0059}" fill="#000000"/>
  <rect x="${size * 0.412}" y="${size * 0.586}" width="${size * 0.047}" height="${size * 0.059}" rx="${size * 0.0059}" fill="#4a4a4a"/>
  <rect x="${size * 0.480}" y="${size * 0.566}" width="${size * 0.047}" height="${size * 0.078}" rx="${size * 0.0059}" fill="#6b6b6b"/>
  <rect x="${size * 0.549}" y="${size * 0.596}" width="${size * 0.047}" height="${size * 0.049}" rx="${size * 0.0059}" fill="#a0a0a0"/>

  <!-- Baseline -->
  <line x1="${size * 0.332}" y1="${size * 0.645}" x2="${size * 0.607}" y2="${size * 0.645}" stroke="#000000" stroke-width="${size * 0.0029}" opacity="0.3"/>

  <!-- Gap arrow -->
  <path d="M ${size * 0.381} ${size * 0.518} L ${size * 0.381} ${size * 0.537} M ${size * 0.371} ${size * 0.527} L ${size * 0.381} ${size * 0.537} L ${size * 0.391} ${size * 0.527}" stroke="#000000" stroke-width="${size * 0.0039}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
    `;

    fs.writeFileSync(filename.replace('.png', '.svg'), canvas);
    console.log(`Created SVG: ${filename.replace('.png', '.svg')}`);
}

// Generate both sizes
createMinimalIcon(192, 'icon-192.png');
createMinimalIcon(512, 'icon-512.png');

console.log('\n✓ Minimal black and white SVG icons created!');
console.log('To convert to PNG, run: node convert-svg-to-png.js');
