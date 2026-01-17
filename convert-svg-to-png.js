#!/usr/bin/env node

const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

async function convertSvgToPng() {
    // Check if sharp is available
    try {
        const sharp = require('sharp');
        console.log('Using sharp to convert SVG to PNG...\n');

        // Convert 192x192
        await sharp('icon-192.svg')
            .resize(192, 192)
            .png()
            .toFile('icon-192.png');
        console.log('✓ Created icon-192.png');

        // Convert 512x512
        await sharp('icon-512.svg')
            .resize(512, 512)
            .png()
            .toFile('icon-512.png');
        console.log('✓ Created icon-512.png');

        console.log('\nPNG icons created successfully!');
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.log('sharp module not found. Installing...\n');
            try {
                await execPromise('npm install sharp');
                console.log('\nsharp installed. Running conversion again...\n');
                // Retry after installation
                const sharp = require('sharp');
                await sharp('icon-192.svg').resize(192, 192).png().toFile('icon-192.png');
                console.log('✓ Created icon-192.png');
                await sharp('icon-512.svg').resize(512, 512).png().toFile('icon-512.png');
                console.log('✓ Created icon-512.png');
                console.log('\nPNG icons created successfully!');
            } catch (installError) {
                console.error('Failed to install sharp:', installError.message);
                console.log('\nPlease use one of these alternatives:');
                console.log('1. Open generate-icons.html in your browser and download the PNGs');
                console.log('2. Use an online SVG to PNG converter with icon-192.svg and icon-512.svg');
                process.exit(1);
            }
        } else {
            console.error('Error:', error.message);
            process.exit(1);
        }
    }
}

convertSvgToPng().catch(console.error);
