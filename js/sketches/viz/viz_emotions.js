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

        // --- ONLY SHOW IN SECTION 4 ---
        if (activeIndex !== 4) {
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
        const cardPadding = 60;
        const cardW = Math.min(620, p.width - cardPadding * 2);
        const cardX = (p.width - cardW) / 2;
        const cardY = 80;
        const cardH = Math.min(500, p.height - cardY - 70);

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
        const controlsY = cardY + 10;
        dropdown.position(canvasRect.left + window.scrollX + dropdownX, canvasRect.top + window.scrollY + controlsY);

        // --- Age slider inside card ---
        if (!ageSlider) {
            ageSlider = p.createSlider(minAge, maxAge, maxAge, 1);
            ageSlider.style('position', 'absolute');
            ageSlider.style('z-index', '1000');
        }
        ageSlider.style('display', 'block');
        const sliderWidth = Math.min(240, Math.max(160, cardW - 220));
        ageSlider.style('width', sliderWidth + 'px');
        const sliderX = cardX + cardW - sliderWidth - 30;
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
        p.stroke(200);
        p.strokeWeight(1);
        p.fill(255);
        p.rect(cardX, cardY, cardW, cardH, 20);

        // Image area
        const imgH = Math.min(cardH * 0.62, 320);
        p.fill(emotionColors[dominantEmotion]);
        p.rect(cardX + 10, cardY + 40, cardW - 20, imgH - 20, 15);

        // Emoji
        p.textSize(80);
        p.textAlign(p.CENTER, p.CENTER);
        p.fill(255);
        p.text(emotionEmojis[dominantEmotion], cardX + cardW / 2, cardY + 40 + imgH / 2);

        // Engagement panel
        const panelY = cardY + 40 + imgH;
        const panelH = cardH - imgH;
        p.fill(245);
        p.rect(cardX + 10, panelY, cardW - 20, panelH - 10, 10);

        const spacing = (cardW - 140) / metrics.length;
        const iconY = panelY + 40;
        p.textAlign(p.CENTER, p.CENTER);

        for (let i = 0; i < metrics.length; i++) {
            const scale = p.map(avgValues[i], 0, maxMetric, 30, 60);
            p.textSize(scale);
            p.fill(0);
            const iconX = cardX + 50 + i * spacing;
            p.text(metricIcons[i], iconX, iconY);

            p.textSize(14);
            p.text(`${avgValues[i].toFixed(1)}`, iconX, iconY + 25);

            p.text(metricLabels[i], iconX, iconY + 45);
        }

        // Dominant emotion badge
        p.fill(255);
        p.stroke(0);
        p.strokeWeight(1);
        p.ellipse(cardX + cardW - 40, cardY + 40, 30, 30);
        p.noStroke();
        p.fill(emotionColors[dominantEmotion]);
        p.ellipse(cardX + cardW - 40, cardY + 40, 22, 22);
        p.fill(0);
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(dominantEmotion, cardX + cardW - 40, cardY + 40);

        // Info below card
        p.textSize(14);
        p.textAlign(p.LEFT);
        let avgEngagement = (avgValues.reduce((a, b) => a + b, 0) / metrics.length).toFixed(1);
        p.fill(50);
        p.text(`Dominant Emotion: ${dominantEmotion}`, cardX, cardY + cardH + 20);
        p.text(`Average Engagement per User: ${avgEngagement}`, cardX, cardY + cardH + 40);

        // Draw slider labels AFTER everything else (so they're on top)
        if (ageSlider && ageSlider.style('display') === 'block') {
            const sliderW = sliderWidth;

            // Convert absolute positions back to canvas coordinates for drawing
            const sliderXOnCanvas = sliderX;
            const sliderYOnCanvas = controlsY;

            p.fill(0);
            p.textSize(12);
            p.textAlign(p.LEFT, p.TOP);
            p.text(minAge, sliderXOnCanvas, sliderYOnCanvas + 20);

            p.textAlign(p.RIGHT, p.TOP);
            p.text(maxAge, sliderXOnCanvas + sliderW, sliderYOnCanvas + 20);

            p.textAlign(p.CENTER, p.BOTTOM);
            const currentVal = ageSlider.value();
            const thumbX = sliderXOnCanvas + (currentVal - minAge) / (maxAge - minAge) * sliderW;
            p.text(currentVal, thumbX, sliderYOnCanvas - 5);
        }
    }

    return { draw };
})();