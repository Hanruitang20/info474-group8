// viz_title.js
// Draw title-style screens for early active indexes (0 and 1)
(function () {
    window.VizTitle = {
        draw: function (p, manager, ai) {
            var canvasW = manager.canvasWidth || (manager.width || 600);
            var canvasH = manager.canvasHeight || (manager.height || 520);
            var cx = canvasW / 2;
            var cy = canvasH / 2;

            p.push();
            p.background('#f7f9fc');

            // Ambient gradient circle
            p.noStroke();
            var radius = Math.min(canvasW, canvasH) * 0.75;
            for (var r = radius; r > 0; r -= 2) {
                var alpha = p.map(r, 0, radius, 220, 30);
                p.fill(66, 99, 235, alpha);
                p.ellipse(cx, cy, r, r);
            }

            p.fill('#0f172a');
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(40);
            p.text(ai === 0 ? 'INFO 474 • Group 8' : 'How Social Media Shapes Feelings', cx, cy - 20);

            p.fill('#475569');
            p.textSize(18);
            var subtitle = ai === 0
                ? 'Data stories that explore usage, emotions, and wellbeing'
                : 'Scroll to see usage patterns, emotional climates, and content-level shifts.';
            p.text(subtitle, cx, cy + 30);
            p.pop();
        }
    };
})();
