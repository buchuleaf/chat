const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

const isDev = process.argv.includes('--dev');

async function buildProject() {
    console.log(`Building project in ${isDev ? 'development' : 'production'} mode...`);

    // Create dist directory if it doesn't exist
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir);
    }

    try {
        // Process JavaScript files
        await processJavaScript();
        
        // Process CSS file
        await processCSS();
        
        // Copy and update HTML file
        await processHTML();
        
        // Copy other static files
        await copyStaticFiles();
        
        console.log('Build completed successfully!');
        console.log('Files generated in ./dist/ directory');
        
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

async function processJavaScript() {
    console.log('Processing JavaScript files...');
    
    // Read source files
    const configContent = fs.readFileSync('config.js', 'utf8');
    const appContent = fs.readFileSync('app.js', 'utf8');
    
    if (isDev) {
        // Development mode - just minify
        const configMinified = await minify(configContent, {
            compress: true,
            mangle: true
        });
        
        const appMinified = await minify(appContent, {
            compress: true,
            mangle: true
        });
        
        fs.writeFileSync(path.join('dist', 'config.min.js'), configMinified.code);
        fs.writeFileSync(path.join('dist', 'app.min.js'), appMinified.code);
        
    } else {
        // Production mode - obfuscate
        const obfuscationOptions = {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            debugProtection: true,
            debugProtectionInterval: 2000,
            disableConsoleOutput: true,
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            numbersToExpressions: true,
            renameGlobals: false,
            rotateStringArray: true,
            selfDefending: true,
            shuffleStringArray: true,
            simplify: true,
            splitStrings: true,
            splitStringsChunkLength: 10,
            stringArray: true,
            stringArrayCallsTransform: true,
            stringArrayCallsTransformThreshold: 0.75,
            stringArrayEncoding: ['base64'],
            stringArrayIndexShift: true,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayWrappersCount: 2,
            stringArrayWrappersChainedCalls: true,
            stringArrayWrappersParametersMaxCount: 4,
            stringArrayWrappersType: 'function',
            stringArrayThreshold: 0.75,
            transformObjectKeys: true,
            unicodeEscapeSequence: false
        };
        
        // Obfuscate config.js
        const configObfuscated = JavaScriptObfuscator.obfuscate(configContent, obfuscationOptions);
        fs.writeFileSync(path.join('dist', 'config.min.js'), configObfuscated.getObfuscatedCode());
        
        // Obfuscate app.js
        const appObfuscated = JavaScriptObfuscator.obfuscate(appContent, obfuscationOptions);
        fs.writeFileSync(path.join('dist', 'app.min.js'), appObfuscated.getObfuscatedCode());
    }
    
    console.log('JavaScript files processed successfully');
}

async function processCSS() {
    console.log('Processing CSS files...');
    
    const cssContent = fs.readFileSync('styles.css', 'utf8');
    
    const cleanCSS = new CleanCSS({
        level: 2,
        returnPromise: false
    });
    
    const minified = cleanCSS.minify(cssContent);
    
    if (minified.errors.length > 0) {
        throw new Error('CSS minification errors: ' + minified.errors.join(', '));
    }
    
    fs.writeFileSync(path.join('dist', 'styles.min.css'), minified.styles);
    console.log('CSS files processed successfully');
}

async function processHTML() {
    console.log('Processing HTML file...');
    
    let htmlContent = fs.readFileSync('index.html', 'utf8');
    
    // Update script and CSS references to minified versions
    htmlContent = htmlContent
        .replace('href="styles.css"', 'href="styles.min.css"')
        .replace('<script src="config.js"></script>', '<script src="config.min.js"></script>')
        .replace('<script src="app.js"></script>', '<script src="app.min.js"></script>');
    
    // Add anti-debugging measures in production
    if (!isDev) {
        const antiDebugScript = `
    <script>
        // Anti-debugging measures
        (function() {
            var devtools = {open: false, orientation: null};
            var threshold = 160;
            setInterval(function() {
                if (window.outerHeight - window.innerHeight > threshold || 
                    window.outerWidth - window.innerWidth > threshold) {
                    if (!devtools.open) {
                        devtools.open = true;
                        console.clear();
                        console.log('%c⚠️ Developer tools detected', 'color: red; font-size: 20px;');
                    }
                } else {
                    devtools.open = false;
                }
            }, 500);
            
            // Disable right-click context menu
            document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                return false;
            });
            
            // Disable common debugging shortcuts
            document.addEventListener('keydown', function(e) {
                if (e.key === 'F12' || 
                    (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                    (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                    (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                    (e.ctrlKey && e.key === 'U')) {
                    e.preventDefault();
                    return false;
                }
            });
        })();
    </script>`;
        
        htmlContent = htmlContent.replace('</head>', antiDebugScript + '\n</head>');
    }
    
    fs.writeFileSync(path.join('dist', 'index.html'), htmlContent);
    console.log('HTML file processed successfully');
}

async function copyStaticFiles() {
    console.log('Copying static files...');
    
    // Copy _config.yml for GitHub Pages
    if (fs.existsSync('_config.yml')) {
        fs.copyFileSync('_config.yml', path.join('dist', '_config.yml'));
    }
    
    // Copy README if it exists
    if (fs.existsSync('README.md')) {
        fs.copyFileSync('README.md', path.join('dist', 'README.md'));
    }
    
    console.log('Static files copied successfully');
}

// Run the build
buildProject();