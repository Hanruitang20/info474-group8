(function () {
  window.Renderer = {

    setData: function (manager) {
      manager.offsetX = (manager.margin && manager.margin.left) || 20;
      manager.offsetY = (manager.margin && manager.margin.top) || 0;
      manager.data = [];
      return Promise.resolve(manager.data);
    },

    draw: function (p, manager, ai, progress) {
      // `ai` = activeIndex from scroller
      // console.log("Renderer draw ai =", ai);

      // SECTION 2 — Phone Addiction Boxplot
      if (ai === 2 && window.VizPhoneBoxplot) {
        window.VizPhoneBoxplot.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 5 — Heatmap
      if (ai === 5 && window.VizHeatmapMentalHealth) {
        window.VizHeatmapMentalHealth.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 6 — Emotions
      if (ai === 6 && window.VizEmotions) {
        window.VizEmotions.draw(p, manager, ai, progress); // pass activeIndex
        return;
      }

      // SECTION 7 — Grouped Bar Chart
      if (ai === 7 && window.VizGroupedBar) {
        window.VizGroupedBar.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 0–1 — Title (removed)

      // SECTION 8–9 — basic examples
      if (ai >= 8 && ai < 10 && window.VizScatter) {
        window.VizScatter.draw(p, manager, ai, progress);
        return;
      }

      // fallback: clear canvas
      p.clear();
    }
  };
})();
