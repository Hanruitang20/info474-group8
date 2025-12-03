window.VizPhoneBoxplot = {
    values: null,
    stats: null,
    loadingPromise: null,
    error: null,
  
    async ensureData() {
      if (this.stats || this.error) return;
      if (this.loadingPromise) return this.loadingPromise;
  
      this.loadingPromise = (async () => {
        const response = await fetch("data/teen_phone_addiction_dataset.csv");
        if (!response.ok) {
          throw new Error("Unable to load teen phone addiction data.");
        }
  
        const text = await response.text();
        const rows = text.trim().split(/\r?\n/).filter(Boolean);
        if (!rows.length) throw new Error("Teen phone addiction dataset is empty.");
  
        const headers = rows[0].split(",").map(h => h.trim());
  
        const scoreIdx = headers.findIndex(h =>
          /total.*addiction.*score/i.test(h) ||
          /addiction.*level/i.test(h) ||
          /addiction/i.test(h)
        );
  
        if (scoreIdx === -1) {
          throw new Error("Could not find a total phone addiction score column.");
        }
  
        this.values = rows
          .slice(1)
          .map(row => {
            const cols = row.split(",");
            const val = parseFloat((cols[scoreIdx] || "").trim());
            return isNaN(val) ? null : val;
          })
          .filter(v => v !== null);
  
        if (!this.values.length) {
          throw new Error("No valid addiction scores were found.");
        }
  
        this.stats = this.computeStats(this.values);
      })().catch(err => {
        console.error("VizPhoneBoxplot:", err);
        this.error = err.message || "Unable to render the boxplot.";
      });
  
      return this.loadingPromise;
    },
  
    computeStats(values) {
      const sorted = values.slice().sort((a, b) => a - b);
      const n = sorted.length;
  
      const quantile = (arr, q) => {
        if (!arr.length) return NaN;
        const pos = (arr.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (!arr[base + 1]) return arr[base];
        return arr[base] + rest * (arr[base + 1] - arr[base]);
      };
  
      return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        q1: quantile(sorted, 0.25),
        median: quantile(sorted, 0.5),
        q3: quantile(sorted, 0.75),
        count: n,
        iqr: quantile(sorted, 0.75) - quantile(sorted, 0.25)
      };
    },
  
    drawBackground(p, manager) {
      const w = (manager && manager.canvasWidth) || (manager && manager.width) || 700;
      const h = (manager && manager.canvasHeight) || (manager && manager.height) || 520;
      p.resizeCanvas(w, h);
      p.background("#f7f9fc");
    },
  
    
    draw(p, manager, ai) {
        if (ai !== 2) return;
      
        if (!this.stats && !this.error) {
          this.ensureData();
        }
      
        this.drawBackground(p, manager);
      
        // Set font to match article
        p.textFont("Times New Roman");
      
        if (this.error) {
          p.fill("#3a3a3a");
          p.textSize(16);
          p.textAlign(p.CENTER, p.CENTER);
          p.text(this.error, p.width / 2, p.height / 2);
          return;
        }
      
        if (!this.stats) {
          p.fill("#6c7a96");
          p.textSize(16);
          p.textAlign(p.CENTER, p.CENTER);
          p.text("Loading teen phone addiction scores…", p.width / 2, p.height / 2);
          return;
        }
      
        const stats = this.stats;
      
        // Layout with improved spacing
        const margin = { top: 70, right: 120, bottom: 60, left: 70 };
      
        const plotTop = margin.top + 50;
        const plotBottom = p.height - margin.bottom - 70;
      
        const layoutCenter = p.width / 2;
        const axisX = layoutCenter - 140;
        const boxCenterX = layoutCenter + 40;
      
        // Score range
        const axisMin = 0;
        const axisMax = 10;
        const yFor = val => p.map(val, axisMin, axisMax, plotBottom, plotTop);
      
        // ----------------- TITLE -----------------
        p.fill("#1f2a44");
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(24);
        p.text("Are Teens Too Online? Here's the Data.", p.width / 2, margin.top - 10);
      
        p.fill("#54627a");
        p.textSize(14);
        p.text(
          "Most teens cluster at the top of the phone-addiction scale.",
          p.width / 2,
          margin.top + 15
        );
      
        // ----------------- Y-AXIS LABEL -----------------
        p.push();
        p.translate(axisX - 35, (plotTop + plotBottom) / 2);
        p.rotate(-p.HALF_PI);
        p.fill("#54627a");
        p.textSize(11);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Total phone-addiction score (1–10 scale)", 0, 0);
        p.pop();
      
        // ----------------- Y-AXIS LINE -----------------
        p.stroke("#bcc6dd");
        p.strokeWeight(2);
        p.line(axisX, plotTop, axisX, plotBottom);
      
        // ----------------- TICKS + LABELS -----------------
        for (let value = axisMin; value <= axisMax; value += 2) {
          const y = yFor(value);
      
          p.stroke("#96a2c2");
          p.line(axisX - 6, y, axisX + 6, y);
      
          p.noStroke();
          p.fill("#4b5670");
          p.textSize(12);
          p.textAlign(p.RIGHT, p.CENTER);
          p.text(value.toFixed(0), axisX - 12, y);
        }
      
        // ----------------- SCALE ANNOTATIONS (separated, avoiding box plot and y-axis label) -----------------
        p.fill("#54627a");
        p.textSize(11);
        p.textAlign(p.RIGHT, p.CENTER);
        // Annotation for 10 (top of scale) - on left side to avoid box plot
        const y10 = yFor(10);
        p.text("10 = more addicted", axisX - 25, y10);
        // Annotation for 1 (bottom of scale) - on left side to avoid y-axis label
        const y1 = yFor(1);
        p.text("1 = less addicted", axisX - 25, y1);
      
        // ----------------- BOX PLOT -----------------
        const boxWidth = Math.min(160, Math.max(120, p.width * 0.22));
        const boxX1 = boxCenterX - boxWidth / 2;
        const boxX2 = boxCenterX + boxWidth / 2;
      
        const q1Y = yFor(stats.q1);
        const q3Y = yFor(stats.q3);
        const medianY = yFor(stats.median);
        const minY = yFor(stats.min);
        const maxY = yFor(stats.max);
      
        // Whiskers - more visible
        p.stroke("#8da2d5");
        p.strokeWeight(4);
        p.line(boxCenterX, q3Y, boxCenterX, maxY);
        p.line(boxCenterX, q1Y, boxCenterX, minY);
      
        const whiskerHalf = Math.min(50, boxWidth * 0.35);
        p.line(boxCenterX - whiskerHalf, maxY, boxCenterX + whiskerHalf, maxY);
        p.line(boxCenterX - whiskerHalf, minY, boxCenterX + whiskerHalf, minY);
      
        // Box - more visible
        p.noStroke();
        p.fill("#dbe8ff");
        p.rect(boxX1, q3Y, boxWidth, q1Y - q3Y, 16);
        // Add subtle border for visibility
        p.stroke("#8da2d5");
        p.strokeWeight(2);
        p.noFill();
        p.rect(boxX1, q3Y, boxWidth, q1Y - q3Y, 16);
      
        // Median - more visible
        p.stroke("#3b5bdb");
        p.strokeWeight(5);
        p.line(boxX1 + 8, medianY, boxX2 - 8, medianY);
      
        // Min/max dots
        p.fill("#3b5bdb");
        p.noStroke();
        p.circle(boxCenterX, minY, 10);
        p.circle(boxCenterX, maxY, 10);
      
        // ----------------- ANNOTATIONS FOR MEDIAN AND Q3 -----------------
        // Check if median and Q3 are both 10 (or very close to 10)
        const isMedianAtMax = Math.abs(stats.median - 10) < 0.1;
        const isQ3AtMax = Math.abs(stats.q3 - 10) < 0.1;
        const areBothAtMax = isMedianAtMax && isQ3AtMax && Math.abs(medianY - q3Y) < 5;
      
        if (isMedianAtMax || isQ3AtMax) {
          p.textAlign(p.LEFT, p.CENTER);
          p.textSize(12);
          p.fill("#1f2a44");
          
          if (areBothAtMax) {
            // Both are at 10, show combined annotation
            const annotationX = boxX2 + 15;
            const annotationY = medianY;
            p.stroke("#3b5bdb");
            p.strokeWeight(1.5);
            p.line(boxX2, medianY, annotationX - 5, annotationY);
            p.noStroke();
            p.fill("#ffffff");
            p.rect(annotationX - 3, annotationY - 12, 110, 24, 4);
            p.fill("#1f2a44");
            p.text("Median & Q3 = 10", annotationX, annotationY);
          } else {
            // Annotation for Q3 = 10
            if (isQ3AtMax) {
              const annotationX = boxX2 + 15;
              const annotationY = q3Y;
              p.stroke("#3b5bdb");
              p.strokeWeight(1.5);
              p.line(boxX2, q3Y, annotationX - 5, annotationY);
              p.noStroke();
              p.fill("#ffffff");
              p.rect(annotationX - 3, annotationY - 10, 70, 20, 4);
              p.fill("#1f2a44");
              p.text("Q3 = 10", annotationX, annotationY);
            }
            
            // Annotation for Median = 10
            if (isMedianAtMax) {
              const annotationX = boxX2 + 15;
              const annotationY = medianY;
              p.stroke("#3b5bdb");
              p.strokeWeight(1.5);
              p.line(boxX2, medianY, annotationX - 5, annotationY);
              p.noStroke();
              p.fill("#ffffff");
              p.rect(annotationX - 3, annotationY - 10, 85, 20, 4);
              p.fill("#1f2a44");
              p.text("Median = 10", annotationX, annotationY);
            }
          }
        }
      
        // ----------------- STATS CALLOUT -----------------
        const statX = p.width - margin.right + 10;
        const statYStart = margin.top + 40;
        const statSpacing = 22;
      
        const statLines = [
          { label: "Max", value: stats.max },
          { label: "Q3", value: stats.q3 },
          { label: "Median", value: stats.median },
          { label: "Q1", value: stats.q1 },
          { label: "Min", value: stats.min }
        ];
      
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(13);
      
        statLines.forEach((entry, idx) => {
          p.fill("#8da2d5");
          p.text(entry.label, statX, statYStart + idx * statSpacing);
      
          p.fill("#1f2a44");
          p.text(entry.value.toFixed(1), statX + 78, statYStart + idx * statSpacing);
        });
      
        // ----------------- NARRATIVE -----------------
        const annotation =
          `Middle 50% of teens fall between ${stats.q1.toFixed(1)} and ${stats.q3.toFixed(1)}, ` +
          `with a median addiction score of ${stats.median.toFixed(1)} — suggesting consistently high engagement.`;
      
        p.fill("#4b5670");
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(13);

        const annotationWidth = p.width - margin.left - margin.right;
        p.text(annotation, margin.left, plotBottom + 40, annotationWidth, 50);
      }      
  };
  
  
  
