// viz_usage_histogram.js
(function () {
  window.VizUsageHistogram = {
    data: null,
    hoverBin: null,

    setData: async function () {
      if (this.data) return this.data;

      let url = "data/Students Social Media Addiction.csv";
      try {
        const raw = await fetch(url).then(r => r.text());
        const rows = raw.split("\n").map(r => r.trim()).filter(r => r.length);
        const header = rows[0].split(",");

        const idxUsage = header.indexOf("Avg_Daily_Usage_Hours");
        if (idxUsage < 0) {
          console.error("❌ Cannot find Avg_Daily_Usage_Hours column");
          return [];
        }

        this.data = rows.slice(1).map(r => {
          const c = r.split(",");
          const val = Number(c[idxUsage]);
          return isNaN(val) ? null : val;
        }).filter(v => v !== null && v >= 0);

        return this.data;
      } catch (err) {
        console.error("❌ Error loading histogram data:", err);
        this.data = [];
        return this.data;
      }
    },

    draw: function (p, manager, ai, progress) {
      if (ai !== 3) return;

      p.background("#FAFAFA");
      p.push();
      p.translate(manager.margin.left, manager.margin.top);
      
      // Set font to match article
      p.textFont("Times New Roman");

      if (!this.data || this.data.length === 0) {
        p.fill(85);
        p.textSize(16);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Loading usage data...", manager.width / 2, manager.height / 2);
        p.pop();
        return;
      }

      const usages = this.data.filter(u => !isNaN(u) && u >= 0);
      const maxUsage = Math.max(...usages);
      const binCount = Math.ceil(maxUsage); // Use integer bins: 0-1, 1-2, 2-3, etc.
      const binSize = 1; // Equal interval of 1 hour

      // Create bins with equal intervals
      const bins = Array(binCount).fill(0);
      const binRanges = [];
      for (let i = 0; i < binCount; i++) {
        binRanges.push({
          min: i,
          max: i + 1,
          count: 0
        });
      }

      usages.forEach(u => {
        let idx = Math.min(Math.floor(u), binCount - 1);
        bins[idx]++;
        binRanges[idx].count++;
      });

      const maxCount = Math.max(...bins);

      // Find tallest bar for annotation placement
      let maxBinIndex = 0;
      for (let i = 0; i < binCount; i++) {
        if (bins[i] > bins[maxBinIndex]) {
          maxBinIndex = i;
        }
      }

      // Plot title - large, centered
      p.fill(34);
      p.textSize(22);
      p.textStyle(p.NORMAL);
      p.textAlign(p.CENTER, p.TOP);
      p.text("Daily Social Media Usage Distribution", manager.width / 2, 10);

      // Subtitle/caption - not bold, informative but subtle
      p.fill(100);
      p.textSize(12);
      p.textStyle(p.NORMAL);
      p.textAlign(p.CENTER, p.TOP);
      p.text("Daily social media usage distribution among young adults", manager.width / 2, 38);

      // Chart area - increased spacing from title
      const chartX = 60;
      const chartY = 60;
      const chartW = manager.width - 100;
      const chartH = manager.height - 150;
      const barW = chartW / binCount;

      // Draw gridlines
      p.stroke(230);
      p.strokeWeight(1);
      for (let i = 0; i <= 5; i++) {
        const y = chartY + (chartH / 5) * i;
        p.line(chartX, y, chartX + chartW, y);
      }

      // Draw bars
      this.hoverBin = null;
      for (let i = 0; i < binCount; i++) {
        const barH = bins[i] > 0 ? (bins[i] / maxCount) * chartH : 0;
        const x = chartX + i * barW;
        const y = chartY + chartH - barH;

        // Hover detection
        const isHover = p.mouseX >= x && p.mouseX <= x + barW &&
                       p.mouseY >= chartY && p.mouseY <= chartY + chartH;

        if (isHover && bins[i] > 0) {
          this.hoverBin = { index: i, range: binRanges[i], count: bins[i] };
          p.fill(255, 120, 160); // Brighter blue on hover
        } else {
          p.fill(255, 170, 200); // Distinct blue color
        }

        p.noStroke();
        p.rect(x, y, barW - 2, barH);

        // Bin label - evenly spaced under each bar with proper spacing
        p.fill(60);
        p.textSize(9);
        p.textAlign(p.CENTER, p.TOP);
        const label = i === binCount - 1 
          ? `${i}+`
          : `${i}-${i + 1}`;
        p.text(label, x + barW / 2, chartY + chartH + 8);
      }

      // Y-axis labels - with proper spacing from axis
      p.fill(85);
      p.textSize(10);
      p.textAlign(p.RIGHT, p.CENTER);
      for (let i = 0; i <= 5; i++) {
        const y = chartY + (chartH / 5) * (5 - i);
        const value = Math.round((maxCount / 5) * i);
        p.text(value.toString(), chartX - 12, y);
      }

      // Axes
      p.stroke(60);
      p.strokeWeight(1.5);
      p.line(chartX, chartY, chartX, chartY + chartH);
      p.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

      // Axis labels - normal weight
      p.fill(34);
      p.textSize(12);
      p.textStyle(p.NORMAL);
      p.textAlign(p.CENTER, p.TOP);
      p.text("Daily Social Media Usage (hrs/day)", chartX + chartW / 2, chartY + chartH + 28);

      p.push();
      p.translate(chartX - 35, chartY + chartH / 2);
      p.rotate(-p.HALF_PI);
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.NORMAL);
      p.text("Number of Students", 0, 0);
      p.pop();

      // Bottom annotation - reinforcing the insight (spaced below x-axis label)
      p.fill(60);
      p.textSize(13);
      p.textStyle(p.NORMAL);
      p.textAlign(p.CENTER, p.TOP);
      p.text("Higher daily usage increases exposure to emotionally stressful content.", manager.width / 2, chartY + chartH + 55);

      // Hover tooltip
      if (this.hoverBin && this.hoverBin.count > 0) {
        const h = this.hoverBin;
        const tooltipX = p.mouseX + 15;
        const tooltipY = p.mouseY - 50;
        
        // Calculate percentage
        const totalStudents = usages.length;
        const percentage = ((h.count / totalStudents) * 100).toFixed(1);
        
        // Prepare tooltip text lines
        p.textSize(12);
        p.textAlign(p.LEFT, p.TOP);
        const rangeText = h.index === binCount - 1
          ? `${h.range.min}+ hrs`
          : `${h.range.min}-${h.range.max} hrs`;
        const line1 = `Range: ${rangeText}`;
        const line2 = `Student count: ${h.count}`;
        const line3 = `Percentage: ${percentage}%`;
        
        // Measure text widths to determine box size
        const padding = 20; // Horizontal padding (10 on each side)
        const lineHeight = 20; // Vertical spacing between lines
        const verticalPadding = 24; // Vertical padding (12 on top and bottom)
        const textWidth1 = p.textWidth(line1);
        const textWidth2 = p.textWidth(line2);
        const textWidth3 = p.textWidth(line3);
        const maxTextWidth = Math.max(textWidth1, textWidth2, textWidth3);
        const boxW = maxTextWidth + padding;
        const boxH = (lineHeight * 3) + verticalPadding;

        // Shadow
        p.fill(0, 15);
        p.noStroke();
        p.rect(tooltipX + 2, tooltipY + 2, boxW, boxH, 6);

        // Tooltip box
        p.fill(255, 245);
        p.stroke(200, 180);
        p.strokeWeight(1);
        p.rect(tooltipX, tooltipY, boxW, boxH, 6);

        // Tooltip text
        p.noStroke();
        p.fill(34);
        p.textSize(12);
        p.textAlign(p.LEFT, p.TOP);
        p.text(line1, tooltipX + 10, tooltipY + 12);
        p.text(line2, tooltipX + 10, tooltipY + 12 + lineHeight);
        p.text(line3, tooltipX + 10, tooltipY + 12 + lineHeight * 2);
      }

      p.pop();
    }
  };
})();
