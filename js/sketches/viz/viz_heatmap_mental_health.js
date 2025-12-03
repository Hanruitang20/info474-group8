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

        const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));

        // Darker as scores increase: teal -> green -> amber -> red
        const blend = (a, b, k) => a + (b - a) * k;

        if (t <= 0.33) {
            const k = t / 0.33;
            return [
                Math.round(blend(18, 34, k)),
                Math.round(blend(120, 170, k)),
                Math.round(blend(125, 90, k))
            ];
        } else if (t <= 0.66) {
            const k = (t - 0.33) / 0.33;
            return [
                Math.round(blend(34, 240, k)),
                Math.round(blend(170, 170, k)),
                Math.round(blend(90, 50, k))
            ];
        }

        const k = (t - 0.66) / 0.34;
        return [
            Math.round(blend(240, 178, k)),
            Math.round(blend(170, 34, k)),
            Math.round(blend(50, 34, k))
        ];
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

            const availableWidth = CANVAS_W * 0.78;
            const availableHeight = CANVAS_H * 0.38;
            const CELL = Math.min(
                (availableWidth - 90) / INDICATORS.length,
                (availableHeight - 30) / PLATFORMS.length
            );

            const GAP = Math.min(CELL * 0.6, 40);

            // Center heatmap horizontally
            const heatmapWidth = INDICATORS.length * CELL + (INDICATORS.length - 1) * GAP;
            const LEFT = (CANVAS_W - heatmapWidth) / 2;

            // Vertical positioning
            const TOP = CANVAS_H * 0.24;

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
            p.textSize(12);

            const colLabelY = TOP - (CELL * 0.75);

            INDICATORS.forEach((ind, c) => {
                const x = LEFT + c * (CELL + GAP) + CELL / 2;
                const lines = ind.label.split("\n");
                const totalHeight = (lines.length - 1) * 16;

                p.push();
                p.textAlign(p.CENTER, p.CENTER);
                lines.forEach((line, i) => {
                    const y = colLabelY + i * 16 - totalHeight / 2;
                    p.text(line, x, y);
                });
                p.pop();
            });

            /* -------------------------
               ROW LABELS — Improved
            -------------------------- */
            p.fill(85); // #555
            p.textAlign(p.RIGHT, p.CENTER);
            p.textSize(13.5);

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
            const legendWidth = CANVAS_W * 0.45;  // Wider bar
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

            // Draw indicator on legend when hovering
            if (hovered && hovered.v != null) {
                const hoveredValue = hovered.v;
                const normalizedValue = (hoveredValue - minVal) / (maxVal - minVal);
                const indicatorX = legendX + normalizedValue * legendWidth;
                
                // Draw a vertical line indicator
                p.stroke(34); // #222
                p.strokeWeight(2.5);
                p.line(indicatorX, legendY - 3, indicatorX, legendY + legendHeight + 3);
                
                // Draw a small triangle pointer
                p.fill(34);
                p.noStroke();
                p.triangle(
                    indicatorX, legendY - 3,
                    indicatorX - 5, legendY - 8,
                    indicatorX + 5, legendY - 8
                );
            }

            p.noStroke();
            p.fill(85); // #555
            p.textSize(11.5);

            p.textAlign(p.CENTER, p.BOTTOM);
            p.text(
                "Emotional Well-Being Scale (1 = healthier, 5 = more strain)",
                CANVAS_W / 2,
                legendY - 12
            );

            p.fill(102); // #666
            p.textSize(10.5);
            p.textAlign(p.LEFT, p.TOP);
            p.text("cooler = better well-being", legendX, legendY + legendHeight + 4);

            p.textAlign(p.RIGHT, p.TOP);
            p.text("warmer = more emotional strain", legendX + legendWidth, legendY + legendHeight + 4);
            
            // Annotation callout on the right side
            const noteX = legendX + legendWidth + 50;
            const noteY = TOP + (PLATFORMS.length * (CELL + GAP)) / 2 - 20;
            p.fill(60);
            p.textSize(13);
            p.textAlign(p.LEFT, p.TOP);
            p.text("TikTok stands out as having the most strained emotional atmosphere.", noteX, noteY, CANVAS_W - noteX - 20, 80);

            p.pop();
        }
    };
})();


