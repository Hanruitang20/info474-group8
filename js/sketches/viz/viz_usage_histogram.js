// viz_usage_histogram.js
(function () {
  window.VizUsageHistogram = {
    data: null,

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
          return {
            usage: Number(c[idxUsage])
          };
        });

        return this.data;
      } catch (err) {
        console.error("❌ Error loading histogram data:", err);
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
        p.text("Loading usage data...", 20, 40);
        p.pop();
        return;
      }

      const usages = this.data.map(d => d.usage);
      const bins = [0,1,2,3,4,5,6,7,8];
      const counts = Array(bins.length).fill(0);

      usages.forEach(u => {
        let i = Math.min(Math.floor(u), bins.length - 1);
        counts[i]++;
      });

      const barW = manager.width / bins.length;
      const maxCount = Math.max(...counts);

      p.textSize(14);
      p.fill(0);

      for (let i = 0; i < bins.length; i++) {
        const barH = p.map(counts[i], 0, maxCount, 0, manager.height - 60);
        p.fill(140, 160, 210);
        p.rect(i * barW, manager.height - barH - 20, barW - 6, barH);

        p.fill(0);
        p.textAlign(p.CENTER);
        p.text(`${bins[i]}h`, i * barW + barW / 2, manager.height - 5);
      }

      p.pop();
    }
  };
})();
