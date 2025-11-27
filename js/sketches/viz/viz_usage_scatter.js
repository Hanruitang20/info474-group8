// viz_usage_scatter.js
(function () {
  window.VizUsageScatter = {
    data: null,

    setData: async function () {
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
          return {
            usage: Number(c[idxUsage]),
            mh: Number(c[idxMH])
          };
        });

        return this.data;
      } catch (err) {
        console.error("❌ Scatter load error:", err);
        this.data = [];
        return this.data;
      }
    },

    draw: function (p, manager) {
      p.push();
      p.translate(manager.margin.left, manager.margin.top);

      if (!this.data || this.data.length === 0) {
        p.fill(0);
        p.textSize(16);
        p.text("Loading mental health data...", 20, 40);
        p.pop();
        return;
      }

      const xs = this.data.map(d => d.usage);
      const ys = this.data.map(d => d.mh);

      const xMin = 0, xMax = Math.max(...xs);
      const yMin = 0, yMax = 10;

      p.noStroke();
      p.fill(80, 120, 200, 140);

      this.data.forEach(d => {
        const x = p.map(d.usage, xMin, xMax, 0, manager.width);
        const y = p.map(d.mh, yMin, yMax, manager.height, 0);
        p.circle(x, y, 6);
      });

      p.fill(0);
      p.textSize(14);
      p.text("Usage (hrs/day)", manager.width / 2 - 40, manager.height + 10);
      p.rotate(-p.HALF_PI);
      p.text("Mental Health Score", -manager.height / 2 - 40, -20);

      p.pop();
    }
  };
})();
