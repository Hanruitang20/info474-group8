// viz_grouped_bar.js
// Grouped bar chart showing emotional difficulty by age range and gender
// Supports multiple emotional indicators via dropdown selector
window.VizGroupedBar = {
  rawData: null,
  groupedData: null,
  loading: false,
  error: null,
  selectedIndicator: null,
  dropdown: null,

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

  draw(p, manager, ai) {
    if (ai !== 7) {
      // Hide dropdown when not in this section
      if (this.dropdown) {
        this.dropdown.style('display', 'none');
      }
      return;
    }

    // Load data if needed
    if (!this.rawData && !this.loading && !this.error) {
      this.loadData(p, manager);
    }

    const canvasW = (manager && manager.canvasWidth) || (manager && manager.width) || 700;
    const canvasH = (manager && manager.canvasHeight) || (manager && manager.height) || 520;
    p.resizeCanvas(canvasW, canvasH);
    p.background("#f7f9fc");

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

    // Create dropdown if it doesn't exist
    if (!this.dropdown) {
      this.dropdown = p.createSelect();
      this.INDICATORS.forEach(ind => {
        this.dropdown.option(ind.label, ind.key);
      });
      this.dropdown.changed(() => {
        this.selectedIndicator = this.dropdown.value();
        this.groupedData = this.computeGroupedData(this.selectedIndicator);
      });
      this.dropdown.style('position', 'absolute');
      this.dropdown.style('z-index', '1000');
      this.dropdown.style('font-size', '13px');
      this.dropdown.style('padding', '6px 10px');
      this.dropdown.style('width', '180px');
    }

    // Get current indicator label
    const currentInd = this.INDICATORS.find(ind => ind.key === this.selectedIndicator);
    const indicatorLabel = currentInd ? currentInd.label : "Emotional Difficulty";

    const margin = { top: 90, right: 60, bottom: 80, left: 100 };
    const plotW = canvasW - margin.left - margin.right;
    const plotH = canvasH - margin.top - margin.bottom;
    const plotX = margin.left;
    const plotY = margin.top;

    // Position dropdown below the subtitle (absolute position relative to canvas)
    const canvasRect = p.canvas.getBoundingClientRect();
    const dropdownX = canvasW - 220;
    const dropdownY = margin.top - 15; // Position just below subtitle
    this.dropdown.style('display', 'block');
    this.dropdown.position(canvasRect.left + window.scrollX + dropdownX, canvasRect.top + window.scrollY + dropdownY);

    const ageRanges = ["16-19", "20-22", "23-25", "26-29"];
    const genders = ["Female", "Male"];
    const genderColors = {
      Female: [230, 73, 128],
      Male: [76, 110, 245]
    };

    const groupWidth = plotW / ageRanges.length;
    const barWidth = (groupWidth * 0.7) / genders.length;
    const barGap = (groupWidth * 0.3) / (genders.length + 1);

    // Fixed y-axis range: 0-5
    const minVal = 0;
    const maxVal = 5;

    const yFor = val => plotY + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;

    // Title
    p.fill("#1f2a44");
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(22);
    p.text("Emotional Difficulty by Age and Gender", canvasW / 2, margin.top - 50);

    p.fill("#54627a");
    p.textSize(13);
    p.text(`Average '${indicatorLabel}' score (1 = least, 5 = most)`, canvasW / 2, margin.top - 28);
    
    // Dropdown label
    p.fill("#54627a");
    p.textSize(12);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text("Select indicator:", dropdownX - 10, dropdownY + 12);

    // Y-axis
    p.stroke("#bcc6dd");
    p.strokeWeight(2);
    p.line(plotX, plotY, plotX, plotY + plotH);
    p.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);

    // Y-axis ticks and labels (0-5)
    for (let i = 0; i <= 5; i++) {
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

    // Y-axis label
    p.push();
    p.translate(plotX - 70, plotY + plotH / 2);
    p.rotate(-p.HALF_PI);
    p.fill("#54627a");
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Average Emotional Difficulty Score", 0, 0);
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
