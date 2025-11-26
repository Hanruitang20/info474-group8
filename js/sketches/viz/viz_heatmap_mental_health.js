// viz_heatmap_mental_health.js
(function () {

    const PLATFORMS = ["Instagram", "TikTok", "Reddit", "YouTube"];

    const INDICATORS = [
        {
            key: "bothered_by_worries",
            label: "Bothered\nby Worries",
            col: "13. On a scale of 1 to 5, how much are you bothered by worries?"
        },
        {
            key: "difficulty_concentrating",
            label: "Difficulty\nConcentrating",
            col: "14. Do you find it difficult to concentrate on things?"
        },
        {
            key: "social_comparison_frequency",
            label: "Comparison\nFrequency",
            col: "15. On a scale of 1-5, how often do you compare yourself to other successful people through the use of social media?"
        },
        {
            key: "feeling_depressed",
            label: "Feeling\nDepressed",
            col: "18. How often do you feel depressed or down?"
        }
    ];

    function heatColor(value, min, max) {
        if (value == null || value === "") return [245, 245, 245];

        let t = (value - min) / (max - min || 1);

        // Softer color scale: light yellow → amber → orange → warm red
        if (t < 0.33) {
            // Light yellow to amber
            let k = t / 0.33;
            return [
                255,
                245 - k * 80,
                200 - k * 150
            ];
        } else if (t < 0.66) {
            // Amber to orange
            let k = (t - 0.33) / 0.33;
            return [
                255,
                165 - k * 65,
                50 + k * 50
            ];
        } else {
            // Orange to warm red
            let k = (t - 0.66) / 0.34;
            return [
                255,
                100 - k * 55,
                100 - k * 40
            ];
        }
    }

    function parsePlatforms(cell) {
        if (!cell) return [];
        return cell
            .replace(/[\[\]'"`]/g, "")
            .split(/[;,]/)
            .map(s => s.trim())
            .filter(Boolean);
    }

    window.VizHeatmapMentalHealth = {
        draw: function (p, manager) {

            const canvasW = (manager && manager.canvasWidth) || (manager && manager.width) || p.width;
            const canvasH = (manager && manager.canvasHeight) || (manager && manager.height) || p.height;
            p.resizeCanvas(canvasW, canvasH);

            p.push();
            p.background("#fefefe"); // Clean white background

            if (!manager._heatLoaded) {
                manager._heatLoaded = true;
                manager._heatData = null;

                p.loadTable(
                    "data/social_media_and_mental_health.csv",
                    "csv",
                    "header",
                    (table) => {
                        let result = {};

                        PLATFORMS.forEach(plat => {
                            result[plat] = {};

                            INDICATORS.forEach(ind => {
                                let vals = [];

                                for (let r = 0; r < table.getRowCount(); r++) {
                                    let row = table.getRow(r);

                                    let plats = parsePlatforms(
                                        row.getString("7. What social media platforms do you commonly use?")
                                    );

                                    if (plats.includes(plat)) {
                                        let v = parseFloat(row.getString(ind.col));
                                        if (!isNaN(v)) vals.push(v);
                                    }
                                }

                                result[plat][ind.key] =
                                    vals.length
                                        ? vals.reduce((a, b) => a + b, 0) / vals.length
                                        : null;
                            });
                        });

                        manager._heatData = result;
                    }
                );
            }

            let data = manager._heatData;

            if (!data) {
                p.fill(50);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(20);
                p.text("Loading heatmap…", p.width / 2, p.height / 2);
                p.pop();
                return;
            }

            const CANVAS_W = canvasW;
            const CANVAS_H = canvasH;

            const CELL = Math.min(
                (CANVAS_W * 0.52) / INDICATORS.length,
                (CANVAS_H * 0.38) / PLATFORMS.length
            );

            const GAP = CELL * 0.28;

            // Center heatmap horizontally
            const heatmapWidth = INDICATORS.length * CELL + (INDICATORS.length - 1) * GAP;
            const LEFT = (CANVAS_W - heatmapWidth) / 2;

            // Vertical positioning
            const TOP = CANVAS_H * 0.18;

            const minVal = 1;
            const maxVal = 5;

            // Title - Improved typography
            p.fill(34); // #222
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(20);
            p.textStyle(p.NORMAL);
            p.text(
                "How Social Media Shapes Our Emotional World",
                CANVAS_W / 2,
                CANVAS_H * 0.04
            );

            // Subtitle - Improved typography
            p.fill(85); // #555
            p.textSize(13.5);
            p.text(
                "Average emotional difficulty scores reported by users of each platform (1 = healthiest, 5 = unhealthiest)",
                CANVAS_W / 2,
                CANVAS_H * 0.09
            );

            /* -------------------------
               COLUMN LABELS — Improved
            -------------------------- */
            p.fill(85); // #555
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(13.5);

            const colLabelY = TOP - CELL * 0.5;

            INDICATORS.forEach((ind, c) => {
                let x = LEFT + c * (CELL + GAP) + CELL / 2;
                let lines = ind.label.split("\n");

                lines.forEach((line, i) => {
                    p.text(line, x, colLabelY + i * 16);
                });
            });

            /* -------------------------
               ROW LABELS — Improved
            -------------------------- */
            p.fill(85); // #555
            p.textAlign(p.RIGHT, p.CENTER);
            p.textSize(14);

            PLATFORMS.forEach((plat, r) => {
                let y = TOP + r * (CELL + GAP) + CELL / 2;
                p.text(plat, LEFT - GAP * 0.8, y);
            });

            /* -------------------------
               HEATMAP + HOVER
            -------------------------- */
            let hovered = null;

            INDICATORS.forEach((ind, c) => {
                PLATFORMS.forEach((plat, r) => {
                    let v = data[plat][ind.key];

                    let x = LEFT + c * (CELL + GAP);
                    let y = TOP + r * (CELL + GAP);

                    let isHover =
                        p.mouseX >= x &&
                        p.mouseX <= x + CELL &&
                        p.mouseY >= y &&
                        p.mouseY <= y + CELL;

                    if (isHover) hovered = { x, y, v };

                    p.fill(...heatColor(v, minVal, maxVal));
                    p.noStroke();
                    p.rect(x, y, CELL, CELL, CELL * 0.2);

                    if (isHover) {
                        p.noFill();
                        p.stroke(34); // #222
                        p.strokeWeight(2.5);
                        p.rect(x, y, CELL, CELL, CELL * 0.2);
                    }
                });
            });

            if (hovered) {
                let textContent = `${hovered.v.toFixed(2)}`;

                const padding = 10;
                const tw = p.textWidth(textContent) + padding * 2;
                const th = 32;

                let tx = hovered.x + CELL + 12;
                let ty = hovered.y;

                // Auto-adjust position
                if (tx + tw > CANVAS_W - 20) tx = hovered.x - tw - 12;
                if (ty + th > CANVAS_H - 20) ty = CANVAS_H - th - 20;

                // Drop shadow
                p.fill(0, 12);
                p.noStroke();
                p.rect(tx + 2, ty + 2, tw, th, 8);

                // Tooltip background (~95% white)
                p.fill(255, 242);
                p.stroke(220, 200);
                p.strokeWeight(1);
                p.rect(tx, ty, tw, th, 8);

                p.fill(34); // #222
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(13);
                p.text(textContent, tx + padding, ty + th / 2);
            }

            /* -------------------------
               LEGEND — Improved & Centered
            -------------------------- */
            const legendWidth = CANVAS_W * 0.35;  // Shorter bar
            const legendHeight = 18;

            const heatmapBottom = TOP + PLATFORMS.length * (CELL + GAP);

            // Positioned 25-30px beneath grid
            const legendY = heatmapBottom + 28;
            const legendX = CANVAS_W / 2 - legendWidth / 2;

            // Draw gradient bar
            for (let i = 0; i < legendWidth; i++) {
                let t = i / legendWidth;
                let val = 1 + t * (5 - 1);
                let col = heatColor(val, 1, 5);

                p.stroke(col);
                p.line(legendX + i, legendY, legendX + i, legendY + legendHeight);
            }

            p.noStroke();
            p.fill(85); // #555
            p.textSize(11.5);

            p.textAlign(p.CENTER, p.BOTTOM);
            p.text(
                "Emotional Well-Being Scale",
                CANVAS_W / 2,
                legendY - 6
            );

            p.fill(102); // #666
            p.textSize(10.5);
            p.textAlign(p.LEFT, p.TOP);
            p.text("cooler = better well-being", legendX, legendY + legendHeight + 8);

            p.textAlign(p.RIGHT, p.TOP);
            p.text("warmer = more emotional strain", legendX + legendWidth, legendY + legendHeight + 8);

            p.pop();
        }
    };
})();


