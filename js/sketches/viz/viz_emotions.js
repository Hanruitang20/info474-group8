// js/sketches/viz/viz_emotions.js
window.VizEmotions = (function () {
    let table = null;
    let ready = false;
    let selectedPlatform = 0; // index of selected platform
    const platforms = [];
    let currentMaxAge = 0;
    let minAge = 0;
    let maxAge = 100;
    let lastMousePressedAge = false;
    let lastMousePressedPlatform = false;

    // ---- PINK & BLUE EMOTION COLORS ----
    const emotionColors = {
        "Happiness": "#FFB6C1", // light pink
        "Sadness": "#87CEFA",   // light blue
        "Anger": "#FF69B4",     // hot pink
        "Anxiety": "#6495ED",   // cornflower blue
        "Boredom": "#FFC0CB",   // pink
        "Neutral": "#ADD8E6"    // light blue
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
    const metrics = [
        "Posts_Per_Day",
        "Likes_Received_Per_Day",
        "Comments_Received_Per_Day",
        "Messages_Sent_Per_Day"
    ];

    const metricColors = ["#FF69B4", "#87CEFA", "#FFB6C1", "#6495ED"]; // pink & blue

    function loadData(p) {
        if (!table) {
            table = p.loadTable("data/emotional_well_being.csv", "csv", "header", () => {
                ready = true;
                platforms.length = 0;
                let ages = [];
                for (let i = 0; i < table.getRowCount(); i++) {
                    const plat = table.getString(i, "Platform").trim();
                    if (!platforms.includes(plat)) platforms.push(plat);

                    const ageVal = parseInt(table.getString(i, "Age"), 10);
                    if (!isNaN(ageVal)) ages.push(ageVal);
                }
                minAge = Math.min(...ages);
                maxAge = Math.max(...ages);
                currentMaxAge = maxAge; // start at max
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

    function handlePlatformClick(p, x, y) {
        let buttonX = 40;
        let buttonY = 80;
        let buttonWidth = 80;
        let buttonHeight = 28;
        let spacing = 10;

        for (let i = 0; i < platforms.length; i++) {
            let bx = buttonX + i * (buttonWidth + spacing);
            if (x > bx && x < bx + buttonWidth && y > buttonY && y < buttonY + buttonHeight) {
                selectedPlatform = i;
                return true;
            }
        }
        return false;
    }

    function drawAgeControls(p) {
        const btnSize = 28;
        const spacing = 10;
        const x = p.width - 250; // right side
        const y = 30;

        const minusRect = { x: x, y: y, w: btnSize, h: btnSize };
        const isHoverMinus = p.mouseX > minusRect.x && p.mouseX < minusRect.x + minusRect.w &&
            p.mouseY > minusRect.y && p.mouseY < minusRect.y + minusRect.h;

        const plusRect = { x: x + btnSize + spacing, y: y, w: btnSize, h: btnSize };
        const isHoverPlus = p.mouseX > plusRect.x && p.mouseX < plusRect.x + plusRect.w &&
            p.mouseY > plusRect.y && p.mouseY < plusRect.y + plusRect.h;

        // Draw buttons
        p.fill(isHoverMinus ? "#FFB6C1" : "#87CEFA");
        p.stroke("#6495ED");
        p.rect(minusRect.x, minusRect.y, minusRect.w, minusRect.h, 5);
        p.fill(0);
        p.noStroke();
        p.textSize(16);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("-", minusRect.x + btnSize / 2, minusRect.y + btnSize / 2);

        p.fill(isHoverPlus ? "#FFB6C1" : "#87CEFA");
        p.stroke("#6495ED");
        p.rect(plusRect.x, plusRect.y, plusRect.w, plusRect.h, 5);
        p.fill(0);
        p.noStroke();
        p.text("+", plusRect.x + btnSize / 2, plusRect.y + btnSize / 2);

        // Age label
        p.fill(0);
        p.textSize(14);
        p.textAlign(p.LEFT, p.CENTER);
        p.text(`Max Age: ${currentMaxAge} (Range: ${minAge}-${maxAge})`, plusRect.x + btnSize + spacing, y + btnSize / 2);

        // Update age on click
        if (p.mouseIsPressed && !lastMousePressedAge) {
            if (isHoverMinus) currentMaxAge = Math.max(minAge, currentMaxAge - 1);
            if (isHoverPlus) currentMaxAge = Math.min(maxAge, currentMaxAge + 1);
        }
        lastMousePressedAge = p.mouseIsPressed;
    }

    function drawPlatformButtons(p) {
        p.fill(80);
        p.textSize(14);
        p.textAlign(p.LEFT, p.CENTER);
        p.text('Select Platform:', 40, 65);

        let buttonX = 40;
        let buttonY = 80;
        let buttonWidth = 80;
        let buttonHeight = 28;
        let spacing = 10;

        for (let i = 0; i < platforms.length; i++) {
            let bx = buttonX + i * (buttonWidth + spacing);
            let isHover = p.mouseX > bx && p.mouseX < bx + buttonWidth &&
                p.mouseY > buttonY && p.mouseY < buttonY + buttonHeight;

            if (i === selectedPlatform) {
                p.fill("#FF69B4"); // hot pink selected
                p.stroke("#FF69B4");
            } else if (isHover) {
                p.fill("#FFC0CB"); // light pink hover
                p.stroke("#FFB6C1");
            } else {
                p.fill("#87CEFA"); // light blue
                p.stroke("#6495ED");
            }
            p.strokeWeight(1);
            p.rect(bx, buttonY, buttonWidth, buttonHeight, 5);

            p.fill(i === selectedPlatform ? 255 : 0);
            p.noStroke();
            p.textSize(12);
            p.textAlign(p.CENTER, p.CENTER);
            p.text(platforms[i], bx + buttonWidth / 2, buttonY + buttonHeight / 2);
        }
    }

    function draw(p, manager, activeIndex) {
        loadData(p);

        if (activeIndex !== 6) {
            p.clear();
            return;
        }

        p.resizeCanvas(manager.canvasWidth || 600, manager.canvasHeight || 520);
        p.background("#FAFAFA");
        p.textFont("Times New Roman");

        if (!ready) {
            p.fill(0);
            p.textSize(16);
            p.text("Loading data...", 20, 50);
            return;
        }

        drawAgeControls(p);
        drawPlatformButtons(p);

        // Handle platform clicks separately
        if (p.mouseIsPressed && !lastMousePressedPlatform) {
            handlePlatformClick(p, p.mouseX, p.mouseY);
        }
        lastMousePressedPlatform = p.mouseIsPressed;

        const selectedPlatName = platforms[selectedPlatform];
        let filteredRows = [];
        for (let i = 0; i < table.getRowCount(); i++) {
            const row = table.getRow(i);
            const ageVal = parseInt(row.get("Age"), 10);
            if (row.get("Platform").trim() === selectedPlatName && !isNaN(ageVal) && ageVal <= currentMaxAge) {
                filteredRows.push(row);
            }
        }
        if (!filteredRows.length) return;

        const avgValues = metrics.map(m => avgColumn(filteredRows, m));
        const maxMetric = Math.max(...avgValues);
        const dominantEmotion = getDominantEmotion(filteredRows);

        // Draw card
        const cardX = 40, cardY = 130, cardW = 500, cardH = 380;
        p.stroke(220);
        p.strokeWeight(1.5);
        p.fill(255);
        p.rect(cardX, cardY, cardW, cardH, 16);

        // Emotion box
        const imgPadding = 16;
        const imgY = cardY + 40;
        const imgH = Math.min(cardH * 0.55, 300);
        const imgW = cardW - imgPadding * 2;
        p.fill(emotionColors[dominantEmotion]);
        p.rect(cardX + imgPadding, imgY, imgW, imgH, 12);

        // Emoji
        p.textSize(90);
        p.textAlign(p.CENTER, p.CENTER);
        p.fill(255);
        p.text(emotionEmojis[dominantEmotion], cardX + cardW / 2, imgY + imgH / 2);

        // ---- Emotion label under emoji with semi-transparent background ----
        const labelText = dominantEmotion;
        p.textSize(18);
        p.textAlign(p.CENTER, p.CENTER);

        const paddingX = 10;
        const paddingY = 4;
        const textWidth = p.textWidth(labelText);
        const textHeight = 18;
        const labelY = imgY + imgH / 2 + 50; // slightly below emoji center

        p.fill(255, 180); // semi-transparent white
        p.noStroke();
        p.rect(
            cardX + cardW / 2 - textWidth / 2 - paddingX,
            labelY - textHeight / 2 - paddingY,
            textWidth + paddingX * 2,
            textHeight + paddingY * 2,
            5
        );

        p.fill(0);
        p.text(labelText, cardX + cardW / 2, labelY);

        // Metrics panel
        const panelY = imgY + imgH + 20;
        const panelH = cardH - (panelY - cardY) - 20;
        p.fill("#F8F8FF");
        p.noStroke();
        p.rect(cardX + imgPadding, panelY, imgW, panelH, 10);

        const metricsPadding = 24;
        const metricsAreaW = imgW - metricsPadding * 2;
        const spacing = metricsAreaW / metrics.length;
        const metricsStartX = cardX + imgPadding + metricsPadding;
        const metricsY = panelY + 28;

        p.textAlign(p.CENTER, p.CENTER);
        for (let i = 0; i < metrics.length; i++) {
            const iconX = metricsStartX + i * spacing + spacing / 2;
            const scale = p.map(avgValues[i], 0, maxMetric, 24, 36);
            p.textSize(scale);
            p.fill(metricColors[i]);
            p.text(metricIcons[i], iconX, metricsY);

            p.textSize(11);
            p.fill(60);
            p.text(`${avgValues[i].toFixed(1)}`, iconX, metricsY + 22);

            p.textSize(10);
            p.fill(100);
            p.text(metricLabels[i], iconX, metricsY + 36);
        }

        const infoY = cardY + cardH + 25;
        const avgEngagement = (avgValues.reduce((a, b) => a + b, 0) / metrics.length).toFixed(1);
        p.fill(60);
        p.textSize(13);
        p.textAlign(p.CENTER);
        p.text(`Dominant Emotion: ${dominantEmotion}`, cardX + cardW / 2, infoY);
        p.text(`Average Engagement per User: ${avgEngagement}`, cardX + cardW / 2, infoY + 20);
    }

    return { draw };
})();
