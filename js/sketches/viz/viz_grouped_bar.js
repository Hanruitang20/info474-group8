// viz_grouped_bar.js
// Grouped bar chart showing emotional difficulty by age range and gender
// Supports multiple emotional indicators via dropdown selector
window.VizGroupedBar = {
  rawData: null,
  groupedData: null,
  loading: false,
  error: null,
  selectedIndicator: null,
  optionButtons: [],
  prevMousePressed: false,

  INDICATORS: [
    {
      key: "bothered_by_worries",
      label: "Bothered by Worries",
      col: "13. On a scale of 1 to 5, how much are you bothered by worries?"
    },
    {
      key: "difficulty_concentrating",
      label: "Difficulty Concentrating",
      col: "14. Do you find it difficult to concentrate on things?"
    },
    {
      key: "social_comparison_frequency",
      label: "Comparison Frequency",
      col: "15. On a scale of 1-5, how often do you compare yourself to other successful people through the use of social media?"
    },
    {
      key: "feeling_depressed",
      label: "Feeling Depressed",
      col: "18. How often do you feel depressed or down?"
    }
  ],

  loadData(p, manager) {
    if (this.rawData || this.loading || this.error) return;

    this.loading = true;
    p.loadTable(
      "data/social_media_and_mental_health.csv",
      "csv",
      "header",
      (table) => {
        if (!table || table.getRowCount() === 0) {
          this.error = "Dataset is empty.";
          this.loading = false;
          return;
        }

        const ageCol = "1. What is your age?";
        const genderCol = "2. Gender";

        // Load all data with all indicators
        this.rawData = [];
        for (let r = 0; r < table.getRowCount(); r++) {
          const row = table.getRow(r);
          const age = parseInt(row.getString(ageCol));
          const gender = row.getString(genderCol);
          
          if (isNaN(age) || !gender) continue;

          const indicators = {};
          this.INDICATORS.forEach(ind => {
            try {
              const val = parseFloat(row.getString(ind.col));
              indicators[ind.key] = isNaN(val) ? null : val;
            } catch (e) {
              indicators[ind.key] = null;
            }
          });

          this.rawData.push({ age, gender, indicators });
        }

        if (!this.rawData.length) {
          this.error = "No valid data found.";
          this.loading = false;
          return;
        }

        // Set default indicator
        this.selectedIndicator = this.INDICATORS[0].key;
        this.groupedData = this.computeGroupedData(this.selectedIndicator);
        this.loading = false;
      },
      (err) => {
        this.error = "Failed to load CSV: " + (err || "Unknown error");
        this.loading = false;
      }
    );
  },

  getAgeRange(age) {
    if (age >= 16 && age <= 19) return "16-19";
    if (age >= 20 && age <= 22) return "20-22";
    if (age >= 23 && age <= 25) return "23-25";
    if (age >= 26 && age <= 29) return "26-29";
    return null;
  },

  normalizeGender(gender) {
    const g = gender.toLowerCase();
    if (g.includes("female") || g === "f") return "Female";
    if (g.includes("male") || g === "m") return "Male";
    return null; // Filter out nonbinary/other genders
  },

  computeGroupedData(indicatorKey) {
    const groups = {};
    const ageRanges = ["16-19", "20-22", "23-25", "26-29"];
    const genders = ["Female", "Male"];

    ageRanges.forEach(ar => {
      groups[ar] = {};
      genders.forEach(g => {
        groups[ar][g] = { sum: 0, count: 0 };
      });
    });

    this.rawData.forEach(d => {
      const range = this.getAgeRange(d.age);
      if (!range) return;
      const gender = this.normalizeGender(d.gender);
      if (!gender || !groups[range][gender]) return;

      const val = d.indicators[indicatorKey];
      if (val === null || val === undefined) return;

      groups[range][gender].sum += val;
      groups[range][gender].count++;
    });

    const result = {};
    ageRanges.forEach(ar => {
      result[ar] = {};
      genders.forEach(g => {
        const gd = groups[ar][g];
        result[ar][g] = gd.count > 0 ? gd.sum / gd.count : null;
      });
    });

    return result;
  },

  handleOptionClick(indicatorKey) {
    if (indicatorKey !== this.selectedIndicator) {
      this.selectedIndicator = indicatorKey;
      this.groupedData = this.computeGroupedData(this.selectedIndicator);
    }
  },

  draw(p, manager, ai) {
    if (ai !== 7) {
      // Reset mouse state when not in this section
      this.prevMousePressed = false;
      return;
    }

    // Load data if needed
    if (!this.rawData && !this.loading && !this.error) {
      this.loadData(p, manager);
    }

    const canvasW = (manager && manager.canvasWidth) || (manager && manager.width) || 700;
    // Increase canvas height to accommodate buttons below the chart
    const canvasH = (manager && manager.canvasHeight) || (manager && manager.height) || 600;
    p.resizeCanvas(canvasW, canvasH);
    p.background("#FAFAFA");
    
    // Set font to match article
    p.textFont("Times New Roman");

    if (this.error) {
      p.fill("#3a3a3a");
      p.textSize(16);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.error, canvasW / 2, canvasH / 2);
      return;
    }

    if (this.loading || !this.rawData) {
      p.fill("#6c7a96");
      p.textSize(16);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Loading grouped bar chart data…", canvasW / 2, canvasH / 2);
      return;
    }

    // Get current indicator label
    const currentInd = this.INDICATORS.find(ind => ind.key === this.selectedIndicator);
    const indicatorLabel = currentInd ? currentInd.label : "Emotional Difficulty";

    const margin = { top: 90, right: 60, bottom: 140, left: 130 }; // Increased left margin for longer Y-axis label with indicator name
    const plotW = canvasW - margin.left - margin.right;
    const plotH = canvasH - margin.top - margin.bottom;
    const plotX = margin.left;
    const plotY = margin.top;

    const ageRanges = ["16-19", "20-22", "23-25", "26-29"];
    const genders = ["Female", "Male"];
    const genderColors = {
      Female: [230, 73, 128],
      Male: [76, 110, 245]
    };

    const groupWidth = plotW / ageRanges.length;
    const barWidth = (groupWidth * 0.7) / genders.length;
    const barGap = (groupWidth * 0.3) / (genders.length + 1);

    // Fixed y-axis range: 1-5
    const minVal = 1;
    const maxVal = 5;

    const yFor = val => plotY + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;

    // Title
    p.fill("#1f2a44");
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(22);
    p.text("Emotional Difficulty by Age and Gender", canvasW / 2, margin.top - 50);

    // Subtitle removed - scale explanation moved to Y-axis label

    // Y-axis
    p.stroke("#bcc6dd");
    p.strokeWeight(2);
    p.line(plotX, plotY, plotX, plotY + plotH);
    p.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);

    // Y-axis ticks and labels (1-5)
    for (let i = 1; i <= 5; i++) {
      const val = i;
      const y = yFor(val);
      p.stroke("#96a2c2");
      p.strokeWeight(1);
      p.line(plotX - 6, y, plotX + 6, y);
      p.noStroke();
      p.fill("#4b5670");
      p.textSize(11);
      p.textAlign(p.RIGHT, p.CENTER);
      p.text(val.toFixed(0), plotX - 12, y);
    }

    // Y-axis label with selected indicator and scale explanation
    p.push();
    p.translate(plotX - 90, plotY + plotH / 2);
    p.rotate(-p.HALF_PI);
    p.fill("#54627a");
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`Average '${indicatorLabel}' Score (1 = least, 5 = most)`, 0, 0);
    p.pop();

    // Draw bars
    ageRanges.forEach((ar, arIdx) => {
      const groupX = plotX + arIdx * groupWidth;
      genders.forEach((g, gIdx) => {
        const val = this.groupedData[ar][g];
        if (val === null) return;

        const barX = groupX + barGap + gIdx * (barWidth + barGap);
        const barH = plotH - (yFor(val) - plotY);
        const barY = yFor(val);

        const col = genderColors[g];
        p.fill(col[0], col[1], col[2]);
        p.noStroke();
        p.rect(barX, barY, barWidth, barH, 4);

        // Value label on top of bar
        if (barH > 15) {
          p.fill("#1f2a44");
          p.textSize(10);
          p.textAlign(p.CENTER, p.BOTTOM);
          p.text(val.toFixed(1), barX + barWidth / 2, barY - 4);
        }
      });
    });

    // X-axis labels
    p.fill("#4b5670");
    p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);
    ageRanges.forEach((ar, arIdx) => {
      const groupX = plotX + arIdx * groupWidth + groupWidth / 2;
      p.text(ar, groupX, plotY + plotH + 10);
    });

    // X-axis label
    p.fill("#54627a");
    p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Age Range", canvasW / 2, plotY + plotH + 35);

    // "Select indicator" label - positioned below "Age Range"
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(11);
    p.fill("#54627a");
    p.text("Select indicator:", canvasW / 2, plotY + plotH + 55);

    // Draw clickable option buttons - positioned horizontally below the labels
    const optionsY = plotY + plotH + 75; // Further down, below "Select indicator" label
    const optionHeight = 28;
    const optionWidth = 140;
    const optionSpacing = 8;
    const totalButtonsWidth = this.INDICATORS.length * optionWidth + (this.INDICATORS.length - 1) * optionSpacing;
    const optionsStartX = plotX + (plotW - totalButtonsWidth) / 2; // Center the buttons
    
    // Check for mouse clicks on option buttons (only on click, not while held)
    const justClicked = p.mouseIsPressed && !this.prevMousePressed && p.mouseButton === p.LEFT;
    if (justClicked) {
      this.INDICATORS.forEach((ind, idx) => {
        const optionX = optionsStartX + idx * (optionWidth + optionSpacing);
        if (p.mouseX >= optionX && p.mouseX <= optionX + optionWidth &&
            p.mouseY >= optionsY && p.mouseY <= optionsY + optionHeight) {
          this.handleOptionClick(ind.key);
        }
      });
    }
    this.prevMousePressed = p.mouseIsPressed;
    
    let isHovering = false;
    this.INDICATORS.forEach((ind, idx) => {
      const optionX = optionsStartX + idx * (optionWidth + optionSpacing);
      const isSelected = ind.key === this.selectedIndicator;
      const isHover = p.mouseX >= optionX && p.mouseX <= optionX + optionWidth &&
                      p.mouseY >= optionsY && p.mouseY <= optionsY + optionHeight;
      
      if (isHover) isHovering = true;
      
      // Button background
      if (isSelected) {
        p.fill(76, 110, 245, 200); // Selected: blue with transparency
        p.stroke(76, 110, 245);
        p.strokeWeight(2);
      } else if (isHover) {
        p.fill(240, 240, 240);
        p.stroke(150, 150, 150);
        p.strokeWeight(1.5);
      } else {
        p.fill(255, 255, 255);
        p.stroke(200, 200, 200);
        p.strokeWeight(1);
      }
      p.rect(optionX, optionsY, optionWidth, optionHeight, 6);
      
      // Button text
      p.fill(isSelected ? 255 : 60);
      p.textSize(11);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(ind.label, optionX + optionWidth / 2, optionsY + optionHeight / 2);
    });
    
    // Set cursor based on hover state
    if (isHovering) {
      p.cursor(p.HAND);
    } else {
      p.cursor(p.ARROW);
    }

    // Legend
    const legendX = canvasW - margin.right - 20;
    const legendY = margin.top + 20;
    const legendItemH = 20;

    genders.forEach((g, idx) => {
      const col = genderColors[g];
      p.fill(col[0], col[1], col[2]);
      p.noStroke();
      p.rect(legendX, legendY + idx * legendItemH, 14, 14, 3);

      p.fill("#1f2a44");
      p.textSize(12);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(g, legendX + 20, legendY + idx * legendItemH + 7);
    });
  }
};
