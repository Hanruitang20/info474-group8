// sketch_renderer.js  — fixed to load data for histogram & scatter
(function () {
  window.Renderer = {

    // 这里改成 async，一启动就预加载两个新图需要的数据
    setData: async function (manager) {
      manager.offsetX = 20;
      manager.offsetY = 0;
      manager.data = [];

      const tasks = [];

      // 预加载 Daily Usage Histogram 所需数据
      if (window.VizUsageHistogram && typeof window.VizUsageHistogram.setData === "function") {
        tasks.push(window.VizUsageHistogram.setData());
      }

      // 预加载 Usage × Mental Health Scatter 所需数据
      if (window.VizUsageScatter && typeof window.VizUsageScatter.setData === "function") {
        tasks.push(window.VizUsageScatter.setData());
      }

      // 等待所有数据加载完成（如果有的话）
      if (tasks.length > 0) {
        try {
          await Promise.all(tasks);
        } catch (e) {
          console.error("Error preloading viz data:", e);
        }
      }

      return manager.data;
    },

    draw: function (p, manager, ai, progress) {

      // SECTION 2 — Phone Addiction Boxplot（原来的，不动）
      if (ai === 2 && window.VizPhoneBoxplot) {
        window.VizPhoneBoxplot.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 3 — Daily Usage Histogram（你的 Plot 2）
      if (ai === 3 && window.VizUsageHistogram) {
        window.VizUsageHistogram.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 4 — Usage × Mental Health Scatter（你的 Plot 3）
      if (ai === 4 && window.VizUsageScatter) {
        window.VizUsageScatter.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 5 — Heatmap（原来就有，不动）
      if (ai === 5 && window.VizHeatmapMentalHealth) {
        window.VizHeatmapMentalHealth.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 6 — Emotions card（原来就有，不动）
      if (ai === 6 && window.VizEmotions) {
        window.VizEmotions.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 7 — Grouped Bar（原来就有，不动）
      if (ai === 7 && window.VizGroupedBar) {
        window.VizGroupedBar.draw(p, manager, ai, progress);
        return;
      }

      // 其他 section 清空画布
      p.clear();
    }
  };
})();