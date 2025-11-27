// viz_usage_scatter.js
(function () {
  window.VizUsageScatter = {
    data: null,
    hoverPoint: null,
    regression: null,

    async setData() {
      if (this.data) return this.data;

      const url = "data/Students Social Media Addiction.csv";

      try {
        const raw = await fetch(url).then(r => r.text());
        const rows = raw.split("\n").map(r => r.trim()).filter(r => r.length);
        const header = rows[0].split(",");

        const idxUsage = header.indexOf("Avg_Daily_Usage_Hours");
        const idxMH = header.indexOf("Mental_Health_Score");

        if (idxUsage < 0 || idxMH < 0) {
          console.error("❌ Missing required columns in CSV");
          return [];
        }

        this.data = rows.slice(1).map(r => {
          const c = r.split(",");
          const usage = Number(c[idxUsage]);
          const mh = Number(c[idxMH]);
          return {
            usage: isNaN(usage) ? null : usage,
            mh: isNaN(mh) ? null : mh
          };
        }).filter(d => d.usage !== null && d.mh !== null && d.usage >= 0 && d.mh >= 0);

        // Calculate linear regression
        if (this.data.length > 0) {
          const xs = this.data.map(d => d.usage);
          const ys = this.data.map(d => d.mh);
          const n = xs.length;

          const meanX = xs.reduce((a, b) => a + b, 0) / n;
          const meanY = ys.reduce((a, b) => a + b, 0) / n;

          let num = 0, den = 0;
          for (let i = 0; i < n; i++) {
            num += (xs[i] - meanX) * (ys[i] - meanY);
            den += (xs[i] - meanX) * (xs[i] - meanX);
          }

          const slope = den !== 0 ? num / den : 0;
          const intercept = meanY - slope * meanX;

          this.regression = { slope, intercept, meanX, meanY };
        }

        return this.data;
      } catch (err) {
        console.error("❌ Scatter load error:", err);
        this.data = [];
        return this.data;
      }
    },

    getInterpretation(mhScore) {
      if (mhScore <= 2) return "Positive well-being";
      if (mhScore <= 3.5) return "Moderate well-being";
      if (mhScore <= 4.5) return "Emotional strain";
      return "Significant distress";
    },

    draw(p, manager, ai, progress) {
      if (ai !== 4) return;

      p.background(255);
      p.push();
      p.translate(manager.margin.left, manager.margin.top);

      if (!this.data || this.data.length === 0) {
        p.fill(85);
        p.textSize(16);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Loading mental health data...", manager.width / 2, manager.height / 2);
        p.pop();
        return;
      }

      // Chart area
      const chartX = 60;
      const chartY = 40;
      const chartW = manager.width - 100;
      const chartH = manager.height - 100;

      // Data ranges
      const xs = this.data.map(d => d.usage);
      const ys = this.data.map(d => d.mh);
      const xMin = 0;
      const xMax = Math.max(...xs) * 1.05;
      const yMin = 0;
      const yMax = Math.max(...ys) * 1.1;

      // Draw gridlines
      p.stroke(230);
      p.strokeWeight(1);
      for (let i = 0; i <= 5; i++) {
        const x = chartX + (chartW / 5) * i;
        const y = chartY + (chartH / 5) * i;
        p.line(x, chartY, x, chartY + chartH);
        p.line(chartX, y, chartX + chartW, y);
      }

      // Draw trend line
      if (this.regression) {
        const { slope, intercept } = this.regression;
        const x1 = xMin;
        const y1 = intercept + slope * x1;
        const x2 = xMax;
        const y2 = intercept + slope * x2;

        const px1 = chartX + p.map(x1, xMin, xMax, 0, chartW);
        const py1 = chartY + chartH - p.map(y1, yMin, yMax, 0, chartH);
        const px2 = chartX + p.map(x2, xMin, xMax, 0, chartW);
        const py2 = chartY + chartH - p.map(y2, yMin, yMax, 0, chartH);

        p.stroke(255, 100, 100);
        p.strokeWeight(2);
        p.line(px1, py1, px2, py2);
      }

      // Draw points with slight jitter for overlapping
      this.hoverPoint = null;
      p.noStroke();
      
      this.data.forEach((d, i) => {
        const baseX = chartX + p.map(d.usage, xMin, xMax, 0, chartW);
        const baseY = chartY + chartH - p.map(d.mh, yMin, yMax, 0, chartH);
        
        // Slight jitter to reduce overlap
        const jitterX = (Math.sin(i * 0.5) * 1.5);
        const jitterY = (Math.cos(i * 0.3) * 1.5);
        const px = baseX + jitterX;
        const py = baseY + jitterY;

        // Hover detection
        const dist = p.dist(p.mouseX, p.mouseY, px, py);
        if (dist < 8) {
          this.hoverPoint = { x: px, y: py, usage: d.usage, mh: d.mh };
          p.fill(255, 80, 80); // Red on hover
        } else {
          p.fill(80, 120, 200, 180); // Consistent blue
        }

        p.circle(px, py, 7);
      });

      // Axes
      p.stroke(60);
      p.strokeWeight(1.5);
      p.line(chartX, chartY, chartX, chartY + chartH);
      p.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

      // X-axis ticks and labels
      p.fill(85);
      p.textSize(10);
      p.textAlign(p.CENTER, p.TOP);
      for (let i = 0; i <= 5; i++) {
        const x = chartX + (chartW / 5) * i;
        const value = (xMax / 5) * i;
        p.stroke(150);
        p.strokeWeight(1);
        p.line(x, chartY + chartH - 3, x, chartY + chartH + 3);
        p.noStroke();
        p.text(value.toFixed(1), x, chartY + chartH + 8);
      }

      // Y-axis ticks and labels
      p.textAlign(p.RIGHT, p.CENTER);
      for (let i = 0; i <= 5; i++) {
        const y = chartY + (chartH / 5) * (5 - i);
        const value = (yMax / 5) * i;
        p.stroke(150);
        p.strokeWeight(1);
        p.line(chartX - 3, y, chartX + 3, y);
        p.noStroke();
        p.text(value.toFixed(1), chartX - 8, y);
      }

      // Axis labels
      p.fill(34);
      p.textSize(12);
      p.textAlign(p.CENTER, p.TOP);
      p.text("Daily Social Media Usage (hrs/day)", chartX + chartW / 2, chartY + chartH + 25);

      p.push();
      p.translate(chartX - 35, chartY + chartH / 2);
      p.rotate(-p.HALF_PI);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Mental Health Score", 0, 0);
      p.pop();

      // Hover tooltip
      if (this.hoverPoint) {
        const h = this.hoverPoint;
        const tooltipX = h.x + 15;
        const tooltipY = h.y - 80;
        const boxW = 200;
        const boxH = 90;
        const interpretation = this.getInterpretation(h.mh);

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
        p.text(`Usage Hours: ${h.usage.toFixed(2)} hrs/day`, tooltipX + 10, tooltipY + 12);
        p.text(`Mental Health Score: ${h.mh.toFixed(2)}`, tooltipX + 10, tooltipY + 32);
        p.fill(102);
        p.textSize(11);
        p.text(interpretation, tooltipX + 10, tooltipY + 52);
      }

      p.pop();
    }
  };
})();
