const fs = require('fs');
const nulPath = '\\\\?\\c:\\Users\\linco\\OneDrive\\Desktop\\GITHUB\\fit-wizardly\\nul';
const files = ['debug_env.bat', 'remove_nul.ps1', 'test_echo.txt', 'cleanup_nul.js'];

console.log('Starting cleanup...');
try {
    if (fs.existsSync(nulPath)) {
        fs.unlinkSync(nulPath);
        console.log('SUCCESS: Deleted nul file');
    } else {
        console.log('INFO: nul file not found by existsSync, trying unlink anyway...');
        fs.unlinkSync(nulPath);
        console.log('SUCCESS: Deleted nul file (blind unlink)');
    }
} catch (e) {
    console.log('ERROR: Failed to delete nul: ' + e.message);
}

files.forEach(f => {
    try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
        console.log('Cleaned ' + f);
    } catch (e) {
        console.log('Cleanup error ' + f + ': ' + e.message);
    }
});
