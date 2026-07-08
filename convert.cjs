const fs = require("fs");
const svg2img = require("svg2img");

const svgStr = `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#FDFBF7"/>
  <g transform="translate(340, 235)">
    <rect x="12" y="12" width="160" height="160" fill="#FF6666" stroke="black" stroke-width="12"/>
    <rect x="0" y="0" width="160" height="160" fill="#E0FF4F" stroke="black" stroke-width="12"/>
    <text x="80" y="120" font-family="Arial, sans-serif" font-weight="900" font-size="110" fill="black" text-anchor="middle">K</text>
  </g>
  <text x="540" y="360" font-family="sans-serif" font-weight="900" font-size="160" fill="black" stroke="black" stroke-width="4" letter-spacing="-5">kudi</text>
</svg>
`;

svg2img(svgStr, function(error, buffer) {
    if (error) { console.error(error); process.exit(1); }
    fs.writeFileSync("public/og-image.png", buffer);
    console.log("Saved public/og-image.png");
});
