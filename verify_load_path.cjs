
try {
    console.log('Attempting to resolve pdf-parse...');
    const resolvedPath = require.resolve('pdf-parse');
    console.log('Resolved Path:', resolvedPath);

    const lib = require(resolvedPath);
    console.log('Loaded Keys:', Object.keys(lib));
    console.log('Type:', typeof lib);

} catch (e) {
    console.error('Resolution Error:', e.message);
}
