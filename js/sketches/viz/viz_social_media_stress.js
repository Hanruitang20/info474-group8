console.log("=== viz_social_media_stress.js LOADED ===");

(function () {
    'use strict';

    const platforms = ["Instagram", "Facebook", "Twitter", "YouTube", "Discord"];
    const categories = [
        {
            name: "Usage & Behavior",
            factors: [
                { key: '9. How often do you find yourself using Social media without a specific purpose?', label: 'Mindless Use' },
                { key: '10. How often do you get distracted by Social media when you are busy doing something?', label: 'Distraction' }
            ]
        },
        {
            name: "Emotional / Mental Stress",
            factors: [
                { key: '11. Do you feel restless if you haven\'t used Social media in a while?', label: 'Restlessness' },
                { key: '15. On a scale of 1-5, how often do you compare yourself to other successful people through the use of social media?', label: 'Comparison' },
                { key: '18. How often do you feel depressed or down?', label: 'Depression' },
                { key: '19. On a scale of 1 to 5, how frequently does your interest in daily activities fluctuate?', label: 'Interest Fluctuation' }
            ]
        },
        {
            name: "Physical / Sleep Effects",
            factors: [
                { key: '20. On a scale of 1 to 5, how often do you face issues regarding sleep?', label: 'Sleep Issues' }
            ]
        }
    ];

    let averages = [];
    let currentPlatform = 0; // platform index
    let activeTab = 0; // category index
    let rawData = null;
    let dataLoaded = false;
    let lastMousePressed = false;

    // ---- PINK & BLUE COLOR PALETTE ----
    const platformColors = {
        normal: "#87CEFA", // light blue
        hover: "#FFC0CB",  // light pink
        selected: "#FF69B4" // hot pink
    };

    const tabColors = {
        normal: "#ADD8E6",
        active: "#FFB6C1"
    };

    const barColors = {
        base: "#87CEFA",
        highlight: "#FF69B4"
    };

    function calculateAverages(data, platformIndex) {
        averages = [];
        let selectedPlatform = platforms[platformIndex];

        categories.forEach(cat => {
            let catAverages = [];
            cat.factors.forEach(factor => {
                let sum = 0;
                let count = 0;

                data.forEach(row => {
                    if (row[selectedPlatform] == '1') {
                        let val = parseFloat(row[factor.key]);
                        if (!isNaN(val)) {
                            sum += val;
                            count++;
                        }
                    }
                });

                let avg = count ? sum / count : 0;
                catAverages.push(avg);
            });
            averages.push(catAverages);
        });
    }

    function drawPlatformButtons(p, w) {
        // Draw platform selection buttons
        p.fill(0);
        p.textSize(14);
        p.textAlign(p.LEFT, p.CENTER);
        p.text('Select Platform:', 20, 125);

        let buttonX = 150;
        let buttonY = 115;
        let buttonWidth = 100;
        let buttonHeight = 30;
        let buttonSpacing = 10;

        for (let i = 0; i < platforms.length; i++) {
            let x = buttonX + i * (buttonWidth + buttonSpacing);

            let isHover = p.mouseX > x && p.mouseX < x + buttonWidth &&
                p.mouseY > buttonY && p.mouseY < buttonY + buttonHeight;

            // Platform button colors
            if (i === currentPlatform) {
                p.fill(platformColors.selected);
                p.noStroke();
            } else if (isHover) {
                p.fill(platformColors.hover);
                p.noStroke();
            } else {
                p.fill(platformColors.normal);
                p.stroke(150);
                p.strokeWeight(1);
            }

            p.rect(x, buttonY, buttonWidth, buttonHeight, 5);

            // Button text
            p.fill(i === currentPlatform ? 255 : 0);
            p.noStroke();
            p.textSize(12);
            p.textAlign(p.CENTER, p.CENTER);
            p.text(platforms[i], x + buttonWidth / 2, buttonY + buttonHeight / 2);
        }
    }

    function handlePlatformClick(p) {
        let buttonX = 150;
        let buttonY = 115;
        let buttonWidth = 100;
        let buttonHeight = 30;
        let buttonSpacing = 10;

        for (let i = 0; i < platforms.length; i++) {
            let x = buttonX + i * (buttonWidth + buttonSpacing);

            if (p.mouseX > x && p.mouseX < x + buttonWidth &&
                p.mouseY > buttonY && p.mouseY < buttonY + buttonHeight) {
                currentPlatform = i;
                return true;
            }
        }
        return false;
    }

    function drawVisualization(p, manager, activeIndex, progress) {
        const w = p.width;
        const h = p.height;

        p.background("#FAFAFA");
        p.textFont("Times New Roman");

        if (!dataLoaded || !rawData) {
            p.fill(100);
            p.textSize(18);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('Loading cleanedEmotional.csv...', w / 2, h / 2);
            return;
        }

        // Handle mouse clicks for platform buttons
        if (p.mouseIsPressed && !lastMousePressed) {
            handlePlatformClick(p);
        }
        lastMousePressed = p.mouseIsPressed;

        p.fill(0);
        p.textSize(24);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(`Social Media Stress: ${platforms[currentPlatform]}`, w / 2, 60);

        drawPlatformButtons(p, w);

        // Draw tab indicators with pink/blue colors
        p.textSize(14);
        let tabY = 175;
        let tabSpacing = w / categories.length;
        categories.forEach((cat, i) => {
            let x = (i + 0.5) * tabSpacing;
            if (i === activeTab) {
                p.fill(tabColors.active);
                p.noStroke();
                p.rect(x - 80, tabY - 15, 160, 30, 5);
                p.fill(255);
            } else {
                p.fill(tabColors.normal);
            }
            p.text(cat.name, x, tabY);
        });

        if (activeIndex === 81) activeTab = 0;
        else if (activeIndex === 82) activeTab = 1;
        else if (activeIndex === 83) activeTab = 2;

        calculateAverages(rawData, currentPlatform);

        let tubeWidth = 60;
        let spacing = 50;
        let baseY = h - 80;
        let maxHeight = 200;
        let cat = categories[activeTab];
        let catAvgs = averages[activeTab];
        let globalMax = 8;

        let totalWidth = cat.factors.length * tubeWidth + (cat.factors.length - 1) * spacing;
        let startX = (w - totalWidth) / 2;

        for (let i = 0; i < cat.factors.length; i++) {
            let val = catAvgs[i];
            let targetH = p.map(val, 0, globalMax, 0, maxHeight);

            let x = startX + i * (tubeWidth + spacing);
            let y = baseY - targetH;

            // Bar color
            let cCol = (val === Math.max(...catAvgs)) ? barColors.highlight : barColors.base;
            p.fill(cCol);
            p.noStroke();
            p.rect(x, y, tubeWidth, targetH, 5);

            // Outline
            p.noFill();
            p.stroke(100);
            p.strokeWeight(2);
            p.rect(x, baseY - maxHeight, tubeWidth, maxHeight, 5);

            // Label
            p.noStroke();
            p.fill(0);
            p.textSize(12);
            p.textAlign(p.CENTER, p.CENTER);
            p.text(cat.factors[i].label, x + tubeWidth / 2, baseY + 20);

            // Value
            if (targetH > 10) {
                p.textSize(14);
                p.text(val.toFixed(1), x + tubeWidth / 2, y - 10);
            }
        }

        // Instructions
        p.fill(100);
        p.textSize(12);
        p.textAlign(p.CENTER);
        p.text('Click platform buttons above to switch • Different sections show different categories', w / 2, h - 20);
    }

    window.StressDashboardViz = {
        setData: function (manager, data) {
            if (typeof data === 'string' && data.includes('cleanedEmotional.csv')) {
                if (window.p5Instance) {
                    window.p5Instance.loadTable('data/cleanedEmotional.csv', 'csv', 'header', (table) => {
                        rawData = [];
                        for (let i = 0; i < table.getRowCount(); i++) {
                            let row = {};
                            let columns = table.columns;
                            columns.forEach(col => { row[col] = table.get(i, col); });
                            rawData.push(row);
                        }
                        dataLoaded = true;
                        calculateAverages(rawData, 0);
                    });
                }
                return;
            }

            if (data && data.getRowCount) {
                rawData = [];
                for (let i = 0; i < data.getRowCount(); i++) {
                    let row = {};
                    let columns = data.columns;
                    columns.forEach(col => { row[col] = data.get(i, col); });
                    rawData.push(row);
                }
                dataLoaded = true;
            } else if (Array.isArray(data)) {
                rawData = data;
                dataLoaded = true;
            }

            if (rawData) calculateAverages(rawData, 0);
        },

        draw: function (p, manager, activeIndex, progress) {
            if (!window.p5Instance) window.p5Instance = p;
            if (!dataLoaded && !rawData) this.setData(manager, 'data/cleanedEmotional.csv');
            drawVisualization(p, manager, activeIndex, progress);
        }
    };
})();
