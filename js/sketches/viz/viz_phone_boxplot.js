 window.VizPhoneBoxplot = {
    values: null,
    stats: null,
    sampleInfo: null,
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
        
        const ageIdx = headers.findIndex(h => /^age$/i.test(h.trim()));
  
        if (scoreIdx === -1) {
          throw new Error("Could not find a total phone addiction score column.");
        }
  
        const ages = [];
        this.values = rows
          .slice(1)
          .map(row => {
            const cols = row.split(",");
            const val = parseFloat((cols[scoreIdx] || "").trim());
            if (ageIdx !== -1) {
              const age = parseFloat((cols[ageIdx] || "").trim());
              if (!isNaN(age)) ages.push(age);
            }
            return isNaN(val) ? null : val;
          })
          .filter(v => v !== null);
  
        if (!this.values.length) {
          throw new Error("No valid addiction scores were found.");
        }
  
        this.stats = this.computeStats(this.values);
        
        // Store participant count for display
        this.participantCount = this.values.length;
        
        // Extract sample info
        if (ages.length > 0) {
          const sortedAges = ages.sort((a, b) => a - b);
          this.sampleInfo = {
            n: this.values.length,
            ageMin: sortedAges[0],
            ageMax: sortedAges[sortedAges.length - 1],
            datasetName: "teen phone addiction dataset"
          };
        } else {
          this.sampleInfo = {
            n: this.values.length,
            ageMin: null,
            ageMax: null,
            datasetName: "teen phone addiction dataset"
          };
        }
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
      p.background("#FAFAFA");
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
        const sampleInfo = this.sampleInfo || { n: stats.count, ageMin: null, ageMax: null, datasetName: "teen phone addiction dataset" };
      
        // Layout with improved spacing - increased right margin for labels further from boxplot
        const margin = { top: 90, right: 120, bottom: 60, left: 70 };
      
        const plotTop = margin.top + 50;
        const plotBottom = p.height - margin.bottom - 70;
      
        const layoutCenter = p.width / 2;
        const axisX = layoutCenter - 140;
        const boxCenterX = layoutCenter + 40;
      
        // Score range - start at 1, not 0
        const axisMin = 1;
        const axisMax = 10;
        const yFor = val => p.map(val, axisMin, axisMax, plotBottom, plotTop);
      
        // ----------------- TITLE -----------------
        p.fill("#1f2a44");
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(24);
        p.text("Are Teens Too Online? Here's the Data.", p.width / 2, margin.top - 30);
      
        // Sample info under title
        p.fill("#54627a");
        p.textSize(12);
        let sampleText = `N = ${sampleInfo.n} teens`;
        if (sampleInfo.ageMin !== null && sampleInfo.ageMax !== null) {
          sampleText += `, ages ${sampleInfo.ageMin}–${sampleInfo.ageMax}`;
        }
        sampleText += `, from ${sampleInfo.datasetName}`;
        p.text(sampleText, p.width / 2, margin.top - 10);
      
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
        // Start from 2 to avoid showing 0 tick (since axisMin is now 1)
        for (let value = 2; value <= axisMax; value += 2) {
          const y = yFor(value);
      
          p.stroke("#96a2c2");
          p.line(axisX - 6, y, axisX + 6, y);
      
          p.noStroke();
          p.fill("#4b5670");
          p.textSize(12);
          p.textAlign(p.RIGHT, p.CENTER);
          p.text(value.toFixed(0), axisX - 12, y);
        }
      
        // Add tick for 1 at the bottom
        const y1Tick = yFor(1);
        p.stroke("#96a2c2");
        p.line(axisX - 6, y1Tick, axisX + 6, y1Tick);
        p.noStroke();
        p.fill("#4b5670");
        p.textSize(12);
        p.textAlign(p.RIGHT, p.CENTER);
        p.text("1", axisX - 12, y1Tick);
      
        // Scale annotations removed to avoid overlap with integrated markers
      
        // ----------------- BOX PLOT -----------------
        // Reduced box width to only span Q1-Q3 range (narrower, not stretched)
        const boxWidth = Math.min(100, Math.max(80, p.width * 0.14));
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
      
        const whiskerHalf = Math.min(40, boxWidth * 0.4);
        p.line(boxCenterX - whiskerHalf, maxY, boxCenterX + whiskerHalf, maxY);
        p.line(boxCenterX - whiskerHalf, minY, boxCenterX + whiskerHalf, minY);
      
        // Box - spans only Q1 to Q3
        p.noStroke();
        p.fill("#dbe8ff");
        p.rect(boxX1, q3Y, boxWidth, q1Y - q3Y, 12);
        // Add subtle border for visibility
        p.stroke("#8da2d5");
        p.strokeWeight(2);
        p.noFill();
        p.rect(boxX1, q3Y, boxWidth, q1Y - q3Y, 12);
      
        // Median - more visible
        p.stroke("#3b5bdb");
        p.strokeWeight(5);
        p.line(boxX1 + 6, medianY, boxX2 - 6, medianY);
      
        // Min/max dots
        p.fill("#3b5bdb");
        p.noStroke();
        p.circle(boxCenterX, minY, 10);
        p.circle(boxCenterX, maxY, 10);
      
        // ----------------- INTEGRATED STAT MARKERS ON PLOT -----------------
        // Add labels and tick marks directly on the boxplot for Min, Q1, Median, Q3, Max
        const labelOffsetX = 40; // Distance from box/whiskers to labels
        const tickLength = 18; // Length of tick marks
        
        // Separate Max (horizontal) from others (vertical stack)
        const maxStat = { name: "Max", value: stats.max, y: maxY };
        const verticalStats = [
          { name: "Q3", value: stats.q3, y: q3Y },
          { name: "Median", value: stats.median, y: medianY },
          { name: "Q1", value: stats.q1, y: q1Y }
        ];
        const minStat = { name: "Min", value: stats.min, y: minY };
        
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(13);
        
        // Calculate text dimensions for background boxes
        const labelPadding = 8;
        const labelHeight = 28;
        const verticalSpacing = 45; // Spacing between vertically stacked labels
        
        // Position for vertical stack
        const stackStartX = boxX2 + tickLength + labelOffsetX;
        
        // Pre-calculate label positions
        const labelPositions = [];
        
        // Handle Max - keep it horizontal at the upper line
        const maxLabelText = `${maxStat.name} = ${maxStat.value.toFixed(1)}`;
        const maxTextWidth = p.textWidth(maxLabelText);
        const maxExtraOffset = 45; // Extra offset to move Max further right
        const maxLabelX = boxCenterX + tickLength + labelOffsetX + maxExtraOffset;
        const maxLabelY = maxY; // Keep Max horizontal with the upper whisker line
        
        labelPositions.push({
          point: maxStat,
          tickStartX: boxCenterX,
          labelX: maxLabelX,
          labelY: maxLabelY,
          labelText: maxLabelText,
          textWidth: maxTextWidth,
          needsConnector: false // No connector needed, it's horizontal
        });
        
        // Handle Q3, Median, Q1 - stack them vertically below Max
        const stackStartY = maxY + verticalSpacing; // Start vertical stack below Max
        
        verticalStats.forEach((point, idx) => {
          const labelText = `${point.name} = ${point.value.toFixed(1)}`;
          const textWidth = p.textWidth(labelText);
          
          // Stack vertically from top to bottom
          const labelY = stackStartY + idx * verticalSpacing;
          
          // Determine tick start position
          const tickStartX = boxX2; // Q3, Median, Q1 are all on box
          
          labelPositions.push({
            point: point,
            tickStartX: tickStartX,
            labelX: stackStartX,
            labelY: labelY,
            labelText: labelText,
            textWidth: textWidth,
            needsConnector: true // Always show connector since labels are stacked
          });
        });
        
        // Handle Min separately - keep it horizontal with the whisker line
        const minLabelText = `${minStat.name} = ${minStat.value.toFixed(1)}`;
        const minTextWidth = p.textWidth(minLabelText);
        const minLabelX = boxCenterX + tickLength + labelOffsetX;
        const minLabelY = minY; // Keep Min horizontally aligned with its whisker position
        
        labelPositions.push({
          point: minStat,
          tickStartX: boxCenterX,
          labelX: minLabelX,
          labelY: minLabelY,
          labelText: minLabelText,
          textWidth: minTextWidth,
          needsConnector: false // No connector needed, it's at the whisker
        });
        
        // Draw all markers
        labelPositions.forEach((labelPos) => {
          const point = labelPos.point;
          
          // Draw prominent tick mark extending from the boxplot
          p.stroke("#54627a");
          p.strokeWeight(2.5);
          p.line(labelPos.tickStartX, point.y, labelPos.tickStartX + tickLength, point.y);
          
          // Add visible dot at the exact value position (only for Q1, Median, Q3; Min/Max already have dots)
          if (point.name !== "Min" && point.name !== "Max") {
            p.fill("#54627a");
            p.noStroke();
            p.circle(labelPos.tickStartX, point.y, 5);
          }
          
          // Draw connecting line if label is offset - make it more visible
          if (labelPos.needsConnector) {
            p.stroke("#54627a");
            p.strokeWeight(2);
            p.line(labelPos.tickStartX + tickLength, point.y, labelPos.labelX - labelPadding, labelPos.labelY);
            p.noStroke();
          }
          
          // Draw background box for label to make it more prominent
          p.fill("#FAFAFA"); // Match article background
          p.stroke("#54627a");
          p.strokeWeight(1.5);
          p.rect(labelPos.labelX - labelPadding, labelPos.labelY - labelHeight/2, labelPos.textWidth + labelPadding * 2, labelHeight, 5);
          
          // Draw label with value on top of background
          p.noStroke();
          p.fill("#1f2a44");
          p.text(labelPos.labelText, labelPos.labelX, labelPos.labelY);
        });
      
        // ----------------- NARRATIVE -----------------
        const annotation =
          `Middle 50% (IQR) of teens fall between ${stats.q1.toFixed(1)} and ${stats.q3.toFixed(1)}, ` +
          `with a median addiction score of ${stats.median.toFixed(1)} — suggesting consistently high engagement.`;
      
        p.fill("#4b5670");
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(13);

        const annotationWidth = p.width - margin.left - margin.right;
        p.text(annotation, margin.left, plotBottom + 40, annotationWidth, 50);
      }      
  };
  
  
  
