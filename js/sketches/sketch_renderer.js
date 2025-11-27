(function () {
  window.Renderer = {

    setData: function (manager) {
      manager.offsetX = 20;
      manager.offsetY = 0;
      manager.data = [];
      return Promise.resolve(manager.data);
    },

    draw: function (p, manager, ai, progress) {

      // SECTION 2 — Boxplot
      if (ai === 2 && window.VizPhoneBoxplot) {
        window.VizPhoneBoxplot.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 3 — Histogram
      if (ai === 3 && window.VizUsageHistogram) {
        window.VizUsageHistogram.preload?.();
        window.VizUsageHistogram.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 4 — Scatter
      if (ai === 4 && window.VizUsageScatter) {
        window.VizUsageScatter.preload?.();
        window.VizUsageScatter.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 5 — Heatmap
      if (ai === 5 && window.VizHeatmapMentalHealth) {
        window.VizHeatmapMentalHealth.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 6 — Emotions
      if (ai === 6 && window.VizEmotions) {
        window.VizEmotions.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 7 — Grouped Bar
      if (ai === 7 && window.VizGroupedBar) {
        window.VizGroupedBar.draw(p, manager, ai, progress);
        return;
      }

      p.clear();
    }
  };
})();