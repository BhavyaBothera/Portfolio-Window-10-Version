/**
 * Windows 10 Portfolio OS — Production Build Pipeline
 * Compiles, bundles, minifies, and optimizes static frontend assets into dist/
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const startTime = performance.now();
const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');

console.log('🚀 Starting Windows 10 Portfolio OS Production Build Pipeline...\n');

// 1. Clean & Recreate dist/ Directory
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(path.join(distDir, 'js'), { recursive: true });
fs.mkdirSync(path.join(distDir, 'css'), { recursive: true });

// Helper to calculate total directory size
function getDirectorySize(dirPath) {
    let size = 0;
    if (!fs.existsSync(dirPath)) return 0;
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
            size += getDirectorySize(fullPath);
        } else if (file.isFile()) {
            size += fs.statSync(fullPath).size;
        }
    }
    return size;
}

const origJsSize = getDirectorySize(path.join(publicDir, 'js'));
const origCssSize = fs.existsSync(path.join(publicDir, 'css/style.css'))
    ? fs.statSync(path.join(publicDir, 'css/style.css')).size
    : 0;

// 2. JS Module Bundling & Minification
console.log('📦 Bundling 20+ Web OS ES modules into dist/js/bundle.min.js...');
esbuild.buildSync({
    entryPoints: [path.join(publicDir, 'js/main.js')],
    bundle: true,
    minify: true,
    sourcemap: true,
    target: 'es2020',
    format: 'esm',
    outfile: path.join(distDir, 'js/bundle.min.js')
});

// 3. CSS Minification & Optimization
console.log('🎨 Minifying stylesheet into dist/css/style.min.css...');
esbuild.buildSync({
    entryPoints: [path.join(publicDir, 'css/style.css')],
    minify: true,
    sourcemap: true,
    outfile: path.join(distDir, 'css/style.min.css')
});

// 4. Recursive Asset Copying
function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    const items = fs.readdirSync(src, { withFileTypes: true });
    for (const item of items) {
        const srcPath = path.join(src, item.name);
        const destPath = path.join(dest, item.name);
        if (item.isDirectory()) {
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log('📂 Copying static assets to dist/assets...');
copyRecursive(path.join(publicDir, 'assets'), path.join(distDir, 'assets'));

// 5. HTML Production Transformation
console.log('📄 Transforming index.html for production bundle assets...');
const origHtmlPath = path.join(publicDir, 'index.html');
if (fs.existsSync(origHtmlPath)) {
    let htmlContent = fs.readFileSync(origHtmlPath, 'utf8');

    // Replace CSS reference
    htmlContent = htmlContent.replace(
        '<link rel="stylesheet" href="css/style.css">',
        '<link rel="stylesheet" href="css/style.min.css">'
    );

    // Replace JS entry point reference
    htmlContent = htmlContent.replace(
        '<script type="module" src="js/main.js"></script>',
        '<script type="module" src="js/bundle.min.js"></script>'
    );

    fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent, 'utf8');
}

// 6. Build Telemetry Report
const buildDuration = (performance.now() - startTime).toFixed(2);
const newJsSize = fs.existsSync(path.join(distDir, 'js/bundle.min.js'))
    ? fs.statSync(path.join(distDir, 'js/bundle.min.js')).size
    : 0;
const newCssSize = fs.existsSync(path.join(distDir, 'css/style.min.css'))
    ? fs.statSync(path.join(distDir, 'css/style.min.css')).size
    : 0;

const jsSavings = origJsSize > 0 ? (((origJsSize - newJsSize) / origJsSize) * 100).toFixed(1) : 0;
const cssSavings = origCssSize > 0 ? (((origCssSize - newCssSize) / origCssSize) * 100).toFixed(1) : 0;

console.log('\n==================================================');
console.log('✅ PRODUCTION BUILD COMPLETED SUCCESSFULLY!');
console.log(`⏱️ Build Time: ${buildDuration} ms`);
console.log(`📜 JavaScript Bundle: ${(origJsSize / 1024).toFixed(1)} KB ──> ${(newJsSize / 1024).toFixed(1)} KB (${jsSavings}% saved)`);
console.log(`🎨 CSS Stylesheet:   ${(origCssSize / 1024).toFixed(1)} KB ──> ${(newCssSize / 1024).toFixed(1)} KB (${cssSavings}% saved)`);
console.log(`📂 Output Directory: ${distDir}`);
console.log('==================================================\n');
