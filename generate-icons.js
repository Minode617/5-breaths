#!/usr/bin/env node

const fs = require('fs');

// Create a simple PNG using raw data
function createSimpleIcon(size, filename) {
    const canvas = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>

        <!-- Phone screen -->
        <rect x="${size * 0.305}" y="${size * 0.207}" width="${size * 0.391}" height="${size * 0.586}"
              rx="${size * 0.039}" fill="rgba(255,255,255,0.95)"/>

        <!-- Face circle -->
        <circle cx="${size * 0.5}" cy="${size * 0.391}" r="${size * 0.117}"
                stroke="#667eea" stroke-width="${size * 0.012}" fill="none"/>

        <!-- Left eye X -->
        <line x1="${size * 0.461}" y1="${size * 0.361}" x2="${size * 0.480}" y2="${size * 0.381}"
              stroke="#667eea" stroke-width="${size * 0.012}" stroke-linecap="round"/>
        <line x1="${size * 0.480}" y1="${size * 0.361}" x2="${size * 0.461}" y2="${size * 0.381}"
              stroke="#667eea" stroke-width="${size * 0.012}" stroke-linecap="round"/>

        <!-- Right eye X -->
        <line x1="${size * 0.520}" y1="${size * 0.361}" x2="${size * 0.539}" y2="${size * 0.381}"
              stroke="#667eea" stroke-width="${size * 0.012}" stroke-linecap="round"/>
        <line x1="${size * 0.539}" y1="${size * 0.361}" x2="${size * 0.520}" y2="${size * 0.381}"
              stroke="#667eea" stroke-width="${size * 0.012}" stroke-linecap="round"/>

        <!-- Sad mouth -->
        <path d="M ${size * 0.441} ${size * 0.439} Q ${size * 0.5} ${size * 0.420} ${size * 0.559} ${size * 0.439}"
              stroke="#667eea" stroke-width="${size * 0.012}" fill="none" stroke-linecap="round"/>

        <!-- Chart bars -->
        <rect x="${size * 0.344}" y="${size * 0.547}" width="${size * 0.059}" height="${size * 0.137}"
              rx="${size * 0.010}" fill="#e74c3c" opacity="0.8"/>
        <rect x="${size * 0.432}" y="${size * 0.586}" width="${size * 0.059}" height="${size * 0.098}"
              rx="${size * 0.010}" fill="#f39c12" opacity="0.8"/>
        <rect x="${size * 0.520}" y="${size * 0.566}" width="${size * 0.059}" height="${size * 0.117}"
              rx="${size * 0.010}" fill="#3498db" opacity="0.8"/>
        <rect x="${size * 0.607}" y="${size * 0.605}" width="${size * 0.059}" height="${size * 0.078}"
              rx="${size * 0.010}" fill="#2ecc71" opacity="0.8"/>

        <!-- Baseline -->
        <line x1="${size * 0.324}" y1="${size * 0.684}" x2="${size * 0.686}" y2="${size * 0.684}"
              stroke="white" stroke-width="${size * 0.006}" opacity="0.6"/>
    </svg>
    `;

    fs.writeFileSync(filename.replace('.png', '.svg'), canvas);
    console.log(`Created SVG: ${filename.replace('.png', '.svg')}`);
}

// Generate both sizes
createSimpleIcon(192, 'icon-192.png');
createSimpleIcon(512, 'icon-512.png');

console.log('\nSVG icons created!');
console.log('To convert to PNG:');
console.log('1. Open generate-icons.html in your browser');
console.log('2. Download the PNG files');
console.log('3. Or use an online SVG to PNG converter');
console.log('\nFor now, you can use the SVG files directly in some browsers.');
