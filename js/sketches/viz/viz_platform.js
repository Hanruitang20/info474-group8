window.VizPlatform = {
  table: null,
  grouped: null,
  hover: null,
  platformColors: null,
  countryColors: null,
  selectedPlatform: null,
  topCountries: null,
  globalRanges: null,

  async ensureData() {
    if (this.grouped) return;

    const response = await fetch("data/Students Social Media Addiction.csv");
    const text = await response.text();

    const rows = text.trim().split(/\r?\n/);
    const headers = rows[0].split(",");

    this.table = rows.slice(1).map(row => {
      const cols = row.split(",");
      const obj = {};
      headers.forEach((h, i) => {
        obj[h.trim()] = (cols[i] || "").trim();
      });
      return obj;
    });

    this.grouped = this.groupData();
    this.platformColors = this.buildPlatformColors();
    this.topCountries = this.computeTopCountries();
    this.countryColors = this.getCountryColors();
    this.globalRanges = this.computeGlobalRanges();

    // remove unused platforms
    const unused = new Set(["LINE", "KakaoTalk", "LinkedIn", "WeChat", "Youtube", "Snapchat", "WhatsApp", "VKontakte"]);
    Object.keys(this.platformColors).forEach(pf => {
      if (unused.has(pf)) delete this.platformColors[pf];
    });

    this.selectedPlatform = Object.keys(this.platformColors)[0];
  },

  groupData() {
    const grouped = {};

    this.table.forEach(row => {
      const gender = row["Gender"];
      const country = row["Country"];
      const platform = row["Most_Used_Platform"];
      const usage = parseFloat(row["Avg_Daily_Usage_Hours"]);
      const mh = parseFloat(row["Mental_Health_Score"]);

      if (!gender || !country || !platform || isNaN(usage)) return;

      grouped[gender] ??= {};
      grouped[gender][country] ??= {};
      grouped[gender][country][platform] ??= { usageSum: 0, mhSum: 0, count: 0 };

      const g = grouped[gender][country][platform];
      g.usageSum += usage;
      if (!isNaN(mh)) g.mhSum += mh;
      g.count++;
    });

    for (const gender in grouped) {
      for (const country in grouped[gender]) {
        for (const platform in grouped[gender][country]) {
          const g = grouped[gender][country][platform];
          g.avgUsage = g.usageSum / g.count;
          g.avgMH = g.count ? g.mhSum / g.count : NaN;
        }
      }
    }
    return grouped;
  },

  buildPlatformColors() {
    const palette = [
      "#4C6EF5", "#E64980", "#7C3AED",
      "#1DA1F2", "#FF4D4D", "#2ECC71",
      "#FFB347", "#8E44AD", "#FF6F61"
    ];

    const platforms = new Set();
    for (const g in this.grouped) {
      for (const c in this.grouped[g]) {
        for (const pf in this.grouped[g][c]) {
          platforms.add(pf);
        }
      }
    }

    const colors = {};
    Array.from(platforms).forEach((pf, i) => {
      colors[pf] = palette[i % palette.length];
    });
    return colors;
  },

  computeTopCountries() {
    const topCountries = {};

    for (const gender in this.grouped) {
      const countryCounts = {};

      // Count total records per country for this gender
      for (const country in this.grouped[gender]) {
        let totalCount = 0;
        for (const platform in this.grouped[gender][country]) {
          totalCount += this.grouped[gender][country][platform].count;
        }
        countryCounts[country] = totalCount;
      }

      // Get top 10 countries by count
      const sorted = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country]) => country);

      topCountries[gender] = new Set(sorted);
    }

    return topCountries;
  },

  computeGlobalRanges() {
    let minUsage = Infinity;
    let maxUsage = -Infinity;
    let minMH = Infinity;
    let maxMH = -Infinity;

    // Compute ranges across ALL platforms and genders
    for (const gender in this.grouped) {
      for (const country in this.grouped[gender]) {
        for (const platform in this.grouped[gender][country]) {
          const g = this.grouped[gender][country][platform];
          if (!isNaN(g.avgUsage)) {
            minUsage = Math.min(minUsage, g.avgUsage);
            maxUsage = Math.max(maxUsage, g.avgUsage);
          }
          if (!isNaN(g.avgMH)) {
            minMH = Math.min(minMH, g.avgMH);
            maxMH = Math.max(maxMH, g.avgMH);
          }
        }
      }
    }

    return {
      usage: { min: minUsage === Infinity ? 0 : minUsage, max: maxUsage === -Infinity ? 10 : maxUsage },
      mh: { min: minMH === Infinity ? 1 : minMH, max: maxMH === -Infinity ? 5 : maxMH }
    };
  },

  getCountryColors() {
    const colors = {};
    const all = new Set();

    // Only include top countries from all genders
    for (const gender in this.topCountries) {
      this.topCountries[gender].forEach(c => all.add(c));
    }

    // Unified muted qualitative palette
    const unifiedPalette = [
      "#5B8FF9",  // Muted blue
      "#61DDAA",  // Soft green
      "#65789B",  // Slate blue
      "#F6BD16",  // Soft yellow
      "#7262FD",  // Muted purple
      "#78D3F8",  // Light cyan
      "#8D4EDA",  // Soft violet
      "#F08BB4",  // Soft pink
      "#E8684A",  // Warm coral
      "#6DC8EC",  // Light blue
      "#C6E5FF",  // Pale blue
      "#FFB3BA"   // Very soft pink
    ];

    Array.from(all).sort().forEach((c, i) => {
      colors[c] = unifiedPalette[i % unifiedPalette.length];
    });

    return colors;
  },

  draw(p, manager, ai, progress) {
    if (ai !== 2) return;

    if (!this.grouped) {
      this.ensureData();
      p.text("Loading data...", 40, 60);
      return;
    }

    const genders = ["Male", "Female"];
    const selected = this.selectedPlatform;

    p.resizeCanvas(1200, 800);
    p.clear();
    p.background(255); // Clean white background
    this.hover = null;

    // =============================
    // ⭐ MAIN TITLE (Improved)
    // =============================
    const titleY = 45;
    p.fill(34); // #222
    p.textAlign(p.CENTER, p.BASELINE);
    p.textSize(22);
    p.textStyle(p.NORMAL);
    p.text("How Social Media Usage Relates to Mental Health Across Countries", 600, titleY);

    // =============================
    // PLATFORM BUTTONS (Redesigned)
    // =============================
    const platforms = Object.keys(this.platformColors);
    const bw = 90, bh = 28, perRow = 8;
    const btnSpacing = 10;
    const buttonsStartY = titleY + 35;

    // Center buttons horizontally
    const totalButtonsWidth = Math.min(platforms.length, perRow) * (bw + btnSpacing) - btnSpacing;
    const buttonsStartX = (1200 - totalButtonsWidth) / 2;

    platforms.forEach((pf, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const x = buttonsStartX + col * (bw + btnSpacing);
      const y = buttonsStartY + row * (bh + 8);

      const isSelected = this.selectedPlatform === pf;
      const btnColor = isSelected ? "#4C6EF5" : "#E5E7EB";

      // Light shadow on hover (detect mouse proximity)
      const mouseDist = p.dist(p.mouseX, p.mouseY, x + bw / 2, y + bh / 2);
      const isHovering = mouseDist < 50 && !isSelected;

      if (isHovering) {
        p.fill(0, 8);
        p.noStroke();
        p.rect(x + 1, y + 2, bw, bh, 6);
      }

      p.fill(btnColor);
      p.noStroke();
      p.rect(x, y, bw, bh, 6);

      p.fill(isSelected ? 255 : 85);
      p.textSize(12.5);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(pf, x + bw / 2, y + bh / 2);

      if (
        p.mouseIsPressed &&
        p.mouseX >= x && p.mouseX <= x + bw &&
        p.mouseY >= y && p.mouseY <= y + bh
      ) {
        this.selectedPlatform = pf;
      }
    });

    const offset = buttonsStartY + Math.ceil(platforms.length / perRow) * (bh + 8) + 25;

    // =============================
    // ⭐ SINGLE SHARED LEGEND (Top Countries Only - Redesigned)
    // =============================
    const entries = Object.entries(this.countryColors).sort((a, b) => a[0].localeCompare(b[0]));
    const rowH = 14, colW = 115, cols = 2;
    const legendPadding = 8;
    const chartWidth = 500; // Reduced from 650
    const chartMarginLeft = 350; // Center: (1200 - 500) / 2
    const legendX = chartMarginLeft + chartWidth + 60; // Position legend closer to plot

    const legendY = offset;
    const legendRows = Math.ceil(entries.length / cols);

    entries.forEach(([country, col], i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;

      const lx = legendX + c * colW;
      const ly = legendY + r * rowH;

      p.fill(col);
      p.noStroke();
      p.ellipse(lx, ly, 7.5, 7.5);

      p.fill(85); // #555
      p.textSize(11.5);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(country, lx + 11, ly);
    });

    // =============================
    // CHARTS FOR MALE + FEMALE
    // =============================
    const ranges = this.globalRanges;
    const minUsage = ranges.usage.min;
    const maxUsage = ranges.usage.max;
    const minMH = ranges.mh.min;
    const maxMH = ranges.mh.max;

    genders.forEach((gender, gi) => {
      let pts = [];
      const chartGap = 40;
      const chartHeight = 140; // Reduced from 200 (30% reduction)
      const y0 = offset + gi * (chartHeight + chartGap + 25);

      // Only include top 10 countries for this gender
      const topSet = this.topCountries[gender] || new Set();

      for (const c in this.grouped[gender] || {}) {
        if (!topSet.has(c)) continue;

        const d = this.grouped[gender][c][selected];
        if (d && !isNaN(d.avgUsage) && !isNaN(d.avgMH)) {
          pts.push({ country: c, usage: d.avgUsage, mh: d.avgMH });
        }
      }

      // Center charts horizontally with reduced width
      const W = 500; // Reduced from 650 (~25% reduction)
      const chartMarginLeft = 350; // Center: (1200 - 500) / 2
      const margin = { left: chartMarginLeft, top: y0, right: 40, bottom: 50 };
      const H = chartHeight;

      // Gender Label
      p.fill(34); // #222
      p.textSize(16);
      p.textStyle(p.NORMAL);
      p.textAlign(p.LEFT, p.BASELINE);
      p.text(gender, margin.left, margin.top - 18);

      // Subtle gridlines
      p.stroke(221); // #DDDDDD
      p.strokeWeight(1);

      // Vertical gridlines
      for (let i = 0; i <= 5; i++) {
        const v = minUsage + ((maxUsage - minUsage) * i) / 5;
        const x = p.map(v, minUsage, maxUsage, margin.left, margin.left + W);
        p.line(x, margin.top, x, margin.top + H);
      }

      // Horizontal gridlines
      for (let i = 0; i <= 5; i++) {
        const v = minMH + ((maxMH - minMH) * i) / 5;
        const y = p.map(v, minMH, maxMH, margin.top + H, margin.top);
        p.line(margin.left, y, margin.left + W, y);
      }

      // Main Axes
      p.stroke(80);
      p.strokeWeight(1.5);
      p.line(margin.left, margin.top, margin.left, margin.top + H);
      p.line(margin.left, margin.top + H, margin.left + W, margin.top + H);

      // X Ticks (using global range)
      p.stroke(150);
      p.strokeWeight(1);
      for (let i = 0; i <= 5; i++) {
        const v = minUsage + ((maxUsage - minUsage) * i) / 5;
        const x = p.map(v, minUsage, maxUsage, margin.left, margin.left + W);

        p.line(x, margin.top + H - 3, x, margin.top + H + 3);
        p.noStroke();
        p.fill(85); // #555
        p.textSize(10);
        p.textAlign(p.CENTER, p.TOP);
        p.text(v.toFixed(1), x, margin.top + H + 10);
      }

      // Y Ticks (using global range)
      p.stroke(150);
      p.strokeWeight(1);
      for (let i = 0; i <= 5; i++) {
        const v = minMH + ((maxMH - minMH) * i) / 5;
        const y = p.map(v, minMH, maxMH, margin.top + H, margin.top);

        p.line(margin.left - 3, y, margin.left + 3, y);
        p.noStroke();
        p.fill(85); // #555
        p.textSize(10);
        p.textAlign(p.RIGHT, p.CENTER);
        p.text(v.toFixed(1), margin.left - 10, y);
      }

      // Data Points (using global range)
      pts.forEach(pt => {
        const x = p.map(pt.usage, minUsage, maxUsage, margin.left, margin.left + W);
        const y = p.map(pt.mh, minMH, maxMH, margin.top + H, margin.top);

        // Ensure points don't touch edges
        const clampedX = p.constrain(x, margin.left + 6, margin.left + W - 6);
        const clampedY = p.constrain(y, margin.top + 6, margin.top + H - 6);

        const col = this.countryColors[pt.country];

        // Draw point with subtle outline for better visibility
        p.stroke(255, 200);
        p.strokeWeight(1.5);
        p.fill(col);
        p.ellipse(clampedX, clampedY, 10, 10);
        p.noStroke();

        if (p.dist(p.mouseX, p.mouseY, clampedX, clampedY) < 8) {
          this.hover = { x: clampedX, y: clampedY, gender, ...pt };
        }
      });

      // Axis Labels
      p.fill(85); // #555
      p.textSize(11);
      p.textAlign(p.CENTER, p.TOP);
      p.text("Usage Hours", margin.left + W / 2, margin.top + H + 28);

      p.push();
      p.translate(margin.left - 50, margin.top + H / 2);
      p.rotate(-p.HALF_PI);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Mental Health Score", 0, 0);
      p.pop();
    });

    // =============================
    // Mental Health Scale Explanation (Redesigned & Centered)
    // =============================
    const chartHeight = 140;
    const chartGap = 40;
    const lastChartBottom = offset + genders.length * (chartHeight + chartGap + 25) - chartGap;
    const explanationY = lastChartBottom + 30;
    p.fill(102); // #666
    p.textSize(12.5);
    p.textAlign(p.CENTER, p.TOP);
    p.textStyle(p.NORMAL);
    const explanationText = "Mental Health Score ranges from 1 (better well-being) to 5 (worse well-being). Lower scores represent healthier emotional states.";
    p.text(explanationText, 600, explanationY);

    // =============================
    // Hover Tooltip (Redesigned - Premium)
    // =============================
    if (this.hover) {
      const h = this.hover;

      const boxW = 160;
      const boxH = 85;
      const padding = 12;

      let bx = h.x - boxW / 2;
      let by = h.y - boxH - 25;

      // Auto-adjust position to avoid going off screen
      if (bx + boxW > p.width - 20) bx = p.width - boxW - 20;
      if (bx < 20) bx = 20;
      if (by < 20) by = h.y + 25;
      if (by + boxH > p.height - 20) by = p.height - boxH - 20;

      // Drop shadow (soft, premium)
      p.fill(0, 12);
      p.noStroke();
      p.rect(bx + 2, by + 2, boxW, boxH, 8);
      p.fill(0, 8);
      p.rect(bx + 1, by + 1, boxW, boxH, 8);

      // Main tooltip background (~95% white)
      p.fill(255, 242); // ~95% opacity
      p.stroke(220, 200);
      p.strokeWeight(1);
      p.rect(bx, by, boxW, boxH, 8);

      // Text content
      const tx = bx + padding;
      const ty = by + padding + 12;

      p.noStroke();

      // Country name (bold, larger)
      p.fill(34); // #222
      p.textSize(14.5);
      p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.BASELINE);
      p.text(h.country, tx, ty);

      // Usage and MH Score
      p.fill(85); // #555
      p.textSize(12.5);
      p.textStyle(p.NORMAL);
      p.text(`Usage: ${h.usage.toFixed(2)}h`, tx, ty + 22);
      p.text(`MH Score: ${h.mh.toFixed(2)}`, tx, ty + 38);
    }
  }
};
