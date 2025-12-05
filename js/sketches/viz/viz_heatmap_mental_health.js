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
            p.background("#FAFAFA"); // Match article background
            
            // Set font to match article
            p.textFont("Times New Roman");

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
               FIND MIN/MAX VALUES
            -------------------------- */
            let allValues = [];
            let allCells = [];
            
            INDICATORS.forEach((ind, c) => {
                PLATFORMS.forEach((plat, r) => {
                    let v = data[plat][ind.key];
                    if (v != null && !isNaN(v)) {
                        allValues.push(v);
                        allCells.push({
                            value: v,
                            x: LEFT + c * (CELL + GAP),
                            y: TOP + r * (CELL + GAP),
                            platform: plat,
                            indicator: ind.key
                        });
                    }
                });
            });
            
            const actualMin = allValues.length > 0 ? Math.min(...allValues) : minVal;
            const actualMax = allValues.length > 0 ? Math.max(...allValues) : maxVal;
            
            // Find first cell with min value (healthiest)
            const minCell = allCells.find(cell => Math.abs(cell.value - actualMin) < 0.001) || null;
            
            // Find first cell with max value (unhealthiest)
            const maxCell = allCells.find(cell => Math.abs(cell.value - actualMax) < 0.001) || null;

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

                    // Check if this is the min or max cell (based on value only)
                    const isMin = v != null && !isNaN(v) && Math.abs(v - actualMin) < 0.001;
                    const isMax = v != null && !isNaN(v) && Math.abs(v - actualMax) < 0.001;

                    if (isHover) {
                        hovered = { x, y, v, isMin, isMax };
                    }

                    p.fill(...heatColor(v, minVal, maxVal));
                    p.noStroke();
                    p.rect(x, y, CELL, CELL, CELL * 0.2);

                    if (isHover) {
                        p.noFill();
                        if (isMin || isMax) {
                            // Enhanced border for healthiest/unhealthiest
                            p.stroke(68, 85, 102); // Dark grey
                            p.strokeWeight(3);
                        } else {
                            p.stroke(34); // #222
                            p.strokeWeight(2.5);
                        }
                        p.rect(x, y, CELL, CELL, CELL * 0.2);
                    }
                });
            });

            if (hovered) {
                let textContent = `${hovered.v.toFixed(2)}`;
                
                // Add note if this is healthiest or unhealthiest
                let noteText = "";
                if (hovered.isMin) {
                    noteText = "(healthiest)";
                } else if (hovered.isMax) {
                    noteText = "(unhealthiest)";
                }

                const padding = 10;
                const lineHeight = 16;
                
                // Calculate tooltip dimensions based on whether we have a note
                const scoreWidth = p.textWidth(textContent);
                const noteWidth = noteText ? p.textWidth(noteText) : 0;
                const maxTextWidth = Math.max(scoreWidth, noteWidth);
                const tw = maxTextWidth + padding * 2;
                const th = noteText ? 48 : 32; // Taller if we have a note

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
                
                if (noteText) {
                    // Score on first line
                    p.text(textContent, tx + padding, ty + th / 2 - lineHeight / 2);
                    
                    // Note on second line (smaller, slightly lighter)
                    p.fill(85); // #555 - slightly lighter
                    p.textSize(11);
                    p.text(noteText, tx + padding, ty + th / 2 + lineHeight / 2);
                } else {
                    // Just the score centered
                    p.text(textContent, tx + padding, ty + th / 2);
                }
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

            // Simplified legend labels - positioned under the legend bar
            p.noStroke();
            p.fill(85); // #555
            p.textSize(11);
            
            const labelY = legendY + legendHeight + 8; // Position labels 8px below the legend bar
            
            p.textAlign(p.LEFT, p.TOP);
            p.text("Healthier", legendX, labelY);
            
            p.textAlign(p.RIGHT, p.TOP);
            p.text("More Strain", legendX + legendWidth, labelY);
            
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


