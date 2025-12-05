// viz_scatter.js
// Data-agnostic scatter viz — draws cached random points and updates them
// only occasionally to reduce churn.
(function () {
    window.VizScatter = {
        draw: function (p, manager, ai) {
            var canvasW = manager.canvasWidth || manager.width || 600;
            var canvasH = manager.canvasHeight || manager.height || 520;
            p.resizeCanvas(canvasW, canvasH);
            p.background('#FAFAFA');

            var padding = 60;
            var plotW = canvasW - padding * 2;
            var plotH = canvasH - 220;
            var plotX = padding;
            var plotY = padding + 40;

            p.push();
            p.noStroke();
            p.fill(255);
            p.rect(plotX - 20, plotY - 20, plotW + 40, plotH + 40, 24);
            p.pop();

            var count = 140;
            var updateEvery = 30;

            if (!manager._randomPoints || (p.frameCount % updateEvery === 0)) {
                var pts = [];
                for (var i = 0; i < count; i++) {
                    var rx = plotX + Math.random() * plotW;
                    var ry = plotY + Math.random() * plotH;
                    var rsz = 3 + Math.random() * 8;
                    var palette = [
                        [76, 110, 245, 150],
                        [230, 73, 128, 120],
                        [125, 90, 255, 140],
                        [34, 197, 94, 110],
                        [255, 180, 80, 130]
                    ];
                    var col = palette[Math.floor(Math.random() * palette.length)];
                    pts.push({ x: rx, y: ry, r: rsz, c: col });
                }
                manager._randomPoints = pts;
            }

            var pts = manager._randomPoints || [];
            pts.forEach(function (ptd) {
                p.noStroke();
                p.fill(ptd.c[0], ptd.c[1], ptd.c[2], ptd.c[3]);
                p.ellipse(ptd.x, ptd.y, ptd.r, ptd.r);
            });

            // overlay grid lines
            p.stroke('#e2e8f0');
            for (var gx = 0; gx <= 6; gx++) {
                var x = plotX + (gx / 6) * plotW;
                p.line(x, plotY, x, plotY + plotH);
            }
            for (var gy = 0; gy <= 6; gy++) {
                var y = plotY + (gy / 6) * plotH;
                p.line(plotX, y, plotX + plotW, y);
            }

            // text overlays
            p.noStroke();
            p.fill('#0f172a');
            p.textAlign(p.CENTER, p.BOTTOM);
            p.textSize(26);
            var heading = ai === 5 ? 'When Patterns Become Personal' : 'A More Aware Way Forward';
            p.text(heading, canvasW / 2, padding);

            p.fill('#475569');
            p.textSize(14);
            p.text(
                ai === 5
                    ? 'Each dot represents a small habit we can tweak — time of day, who we follow, or why we open an app.'
                    : 'The calmer the field, the more intentional our choices. Tiny shifts cluster into healthier routines.',
                canvasW / 2,
                padding + 24
            );

            p.textAlign(p.LEFT, p.TOP);
            p.textSize(13);
            p.text('Higher Emotional Balance →', plotX, plotY - 28);
            p.push();
            p.translate(plotX - 50, plotY + plotH / 2);
            p.rotate(-p.HALF_PI);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('More Intentional Usage', 0, 0);
            p.pop();
        }
    };
})();
