const fs = require('fs');
const svg2img = require('svg2img');

let svg = fs.readFileSync('public/favicon.svg', 'utf8');
svg = svg.replace('width="32"', 'width="512"').replace('height="32"', 'height="512"');

svg2img(svg, function(error, buffer) {
    if (error) { console.error(error); process.exit(1); }
    fs.writeFileSync('public/apple-touch-icon.png', buffer);
    console.log('Saved public/apple-touch-icon.png');
});
