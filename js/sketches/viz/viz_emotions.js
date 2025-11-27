// js/sketches/viz/viz_emotions.js
window.VizEmotions = (function () {
    let table = null;
    let ready = false;
    let selectedPlatform = "All";
    let platforms = [];
    let dropdown = null;
    let ageSlider = null;

    const emotionColors = {
        "Happiness": "#FFD700",
        "Sadness": "#1E90FF",
        "Anger": "#FF4500",
        "Anxiety": "#8A2BE2",
        "Boredom": "#A9A9A9",
        "Neutral": "#C0C0C0"
    };

    const emotionEmojis = {
        "Happiness": "😊",
        "Sadness": "😢",
        "Anger": "😡",
        "Anxiety": "😰",
        "Boredom": "😐",
        "Neutral": "😶"
    };

    const metricIcons = ["📝", "❤️", "💬", "🔗"];
    const metricLabels = ["Posts", "Likes", "Comments", "Shares"];
    const metrics = ["Posts_Per_Day", "Likes_Received_Per_Day", "Comments_Received_Per_Day", "Messages_Sent_Per_Day"];

    let minAge = 0;
    let maxAge = 100;

    function loadData(p) {
        if (!table) {
            table = p.loadTable("data/emotional_well_being.csv", "csv", "header", () => {
                ready = true;
                platforms = ["All"];
                let ages = [];
                for (let i = 0; i < table.getRowCount(); i++) {
                    const plat = table.getString(i, "Platform").trim();
                    const age = parseInt(table.getString(i, "Age"));
                    ages.push(age);
                    if (!platforms.includes(plat)) platforms.push(plat);
                }
                minAge = Math.min(...ages);
                maxAge = Math.max(...ages);
            });
        }
    }

    function avgColumn(rows, colName) {
        let sum = 0;
        rows.forEach(r => sum += parseFloat(r.get(colName)));
        return sum / rows.length;
    }

    function getDominantEmotion(rows) {
        let counts = {};
        rows.forEach(r => {
            let e = r.get("Dominant_Emotion").trim();
            e = e.charAt(0).toUpperCase() + e.slice(1).toLowerCase();
            counts[e] = (counts[e] || 0) + 1;
        });
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    function draw(p, manager, activeIndex) {
        loadData(p);

        // --- ONLY SHOW IN SECTION 6 ---
        if (activeIndex !== 6) {
            p.clear();
            // Hide controls when not in section 4
            if (dropdown) {
                dropdown.style('display', 'none');
            }
            if (ageSlider) {
                ageSlider.style('display', 'none');
            }
            return;
        }

        p.resizeCanvas(manager.canvasWidth || (manager.width || 600), manager.canvasHeight || (manager.height || 520));
        p.background("#f7f9fc");
        p.textFont('Arial');

        if (!ready) {
            p.fill(0);
            p.textSize(16);
            p.text("Loading data...", 20, 50);
            return;
        }

        // --- Card layout anchored to canvas width ---
        const cardPadding = 40;
        const cardW = Math.min(580, p.width - cardPadding * 2);
        const cardX = (p.width - cardW) / 2;
        const cardY = 60;
        const cardH = Math.min(480, p.height - cardY - 100);

        // Get canvas position on screen
        const canvasRect = p.canvas.getBoundingClientRect();

        if (!dropdown) {
            dropdown = p.createSelect();
            platforms.forEach(pl => dropdown.option(pl));
            dropdown.changed(() => { selectedPlatform = dropdown.value(); });
            dropdown.style('position', 'absolute');
            dropdown.style('z-index', '1000');
        }
        dropdown.style('display', 'block');
        const dropdownX = cardX + 20;
        const controlsY = cardY + 20;
        dropdown.position(canvasRect.left + window.scrollX + dropdownX, canvasRect.top + window.scrollY + controlsY);

        // --- Age slider inside card ---
        if (!ageSlider) {
            ageSlider = p.createSlider(minAge, maxAge, maxAge, 1);
            ageSlider.style('position', 'absolute');
            ageSlider.style('z-index', '1000');
        }
        ageSlider.style('display', 'block');
        const sliderWidth = Math.min(220, Math.max(160, cardW - 240));
        ageSlider.style('width', sliderWidth + 'px');
        const sliderX = cardX + cardW - sliderWidth - 20;
        ageSlider.position(canvasRect.left + window.scrollX + sliderX, canvasRect.top + window.scrollY + controlsY);

        // --- Filter rows ---
        const maxAgeSelected = ageSlider.value();
        let filteredRows = [];
        for (let i = 0; i < table.getRowCount(); i++) {
            const row = table.getRow(i);
            const plat = row.get("Platform").trim();
            const age = parseInt(row.get("Age"));
            if ((selectedPlatform === "All" || plat === selectedPlatform) && age <= maxAgeSelected) {
                filteredRows.push(row);
            }
        }

        if (filteredRows.length === 0) {
            p.fill(0);
            p.textSize(16);
            p.text("No data for selected platform/age", 20, 130);
            return;
        }

        // --- Compute averages & dominant emotion ---
        const avgValues = metrics.map(m => avgColumn(filteredRows, m));
        const maxMetric = Math.max(...avgValues);
        const dominantEmotion = getDominantEmotion(filteredRows);

        // --- Card ---
        p.stroke(220);
        p.strokeWeight(1.5);
        p.fill(255);
        p.rect(cardX, cardY, cardW, cardH, 16);

        // Image area (post preview)
        const imgPadding = 16;
        const imgY = cardY + 60;
        const imgH = Math.min(cardH * 0.55, 300);
        const imgW = cardW - imgPadding * 2;
        p.fill(emotionColors[dominantEmotion]);
        p.rect(cardX + imgPadding, imgY, imgW, imgH, 12);

        // Emoji (centered in post preview)
        p.textSize(90);
        p.textAlign(p.CENTER, p.CENTER);
        p.fill(255);
        p.text(emotionEmojis[dominantEmotion], cardX + cardW / 2, imgY + imgH / 2);

        // Engagement metrics panel
        const panelY = imgY + imgH + 20;
        const panelH = cardH - (panelY - cardY) - 20;
        p.fill(248);
        p.noStroke();
        p.rect(cardX + imgPadding, panelY, imgW, panelH, 10);

        // Metrics in horizontal row
        const metricsPadding = 24;
        const metricsAreaW = imgW - metricsPadding * 2;
        const spacing = metricsAreaW / metrics.length;
        const metricsStartX = cardX + imgPadding + metricsPadding;
        const metricsY = panelY + 28;
        
        p.textAlign(p.CENTER, p.CENTER);

        for (let i = 0; i < metrics.length; i++) {
            const iconX = metricsStartX + i * spacing + spacing / 2;
            
            // Icon (reduced size)
            const scale = p.map(avgValues[i], 0, maxMetric, 24, 36);
            p.textSize(scale);
            p.fill(40);
            p.text(metricIcons[i], iconX, metricsY);

            // Value (reduced font size)
            p.textSize(11);
            p.fill(60);
            p.text(`${avgValues[i].toFixed(1)}`, iconX, metricsY + 22);

            // Label (reduced font size)
            p.textSize(10);
            p.fill(100);
            p.text(metricLabels[i], iconX, metricsY + 36);
        }

        // Dominant emotion badge (top right of post preview)
        const badgeX = cardX + cardW - imgPadding - 25;
        const badgeY = imgY + 25;
        p.fill(255);
        p.stroke(220);
        p.strokeWeight(1.5);
        p.ellipse(badgeX, badgeY, 32, 32);
        p.noStroke();
        p.fill(emotionColors[dominantEmotion]);
        p.ellipse(badgeX, badgeY, 24, 24);
        p.fill(255);
        p.textSize(10);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(dominantEmotion, badgeX, badgeY);

        // Info below card (aligned under metrics)
        const infoY = cardY + cardH + 25;
        p.textSize(13);
        p.textAlign(p.CENTER);
        let avgEngagement = (avgValues.reduce((a, b) => a + b, 0) / metrics.length).toFixed(1);
        p.fill(60);
        p.text(`Dominant Emotion: ${dominantEmotion}`, cardX + cardW / 2, infoY);
        p.text(`Average Engagement per User: ${avgEngagement}`, cardX + cardW / 2, infoY + 20);

        // Draw slider labels AFTER everything else (so they're on top)
        // Positioned with proper margin to avoid overlap with slider handle
        if (ageSlider && ageSlider.style('display') === 'block') {
            const sliderW = sliderWidth;

            // Convert absolute positions back to canvas coordinates for drawing
            const sliderXOnCanvas = sliderX;
            const sliderYOnCanvas = controlsY + 25;
            const labelYOffset = 30; // Increased spacing below slider to avoid handle overlap

            p.fill(80);
            p.textSize(11);
            p.textAlign(p.LEFT, p.TOP);
            // Position "Age: X" label with margin to avoid overlap
            p.text(`Age: ${minAge}`, sliderXOnCanvas, sliderYOnCanvas + labelYOffset);

            p.textAlign(p.RIGHT, p.TOP);
            // Position max age label with margin
            p.text(`${maxAge}`, sliderXOnCanvas + sliderW, sliderYOnCanvas + labelYOffset);

            // Current value label positioned above slider with safe margin
            p.textAlign(p.CENTER, p.BOTTOM);
            const currentVal = ageSlider.value();
            const thumbX = sliderXOnCanvas + (currentVal - minAge) / (maxAge - minAge) * sliderW;
            p.fill(40);
            p.textSize(12);
            // Position above slider track with safe margin (8px above)
            p.text(currentVal, thumbX, sliderYOnCanvas - 8);
        }
    }

    return { draw };
})();