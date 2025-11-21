(function () {
  window.Renderer = {

    setData: function (manager) {
      manager.offsetX = (manager.margin && manager.margin.left) || 20;
      manager.offsetY = (manager.margin && manager.margin.top) || 0;
      manager.data = [];
      return Promise.resolve(manager.data);
    },

    draw: function (p, manager, ai, progress) {
      console.log("Renderer draw ai =", ai);

      // SECTION 2 — Platform Viz
      if (ai === 2 && window.VizPlatform) {
        window.VizPlatform.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 3 — Heatmap
      if (ai === 3 && window.VizHeatmapMentalHealth) {
        window.VizHeatmapMentalHealth.draw(p, manager);
        return;
      }

      // SECTION 4 — Placeholder
      if (ai === 4 && window.VizPlaceholder) {
        window.VizPlaceholder.draw(p, manager);
        return;
      }

      // SECTION 0–1 — Title
      if (ai === 0 || ai === 1) {
        window.VizTitle.draw(p, manager, ai, progress);
        return;
      }

      // SECTION 5–6 — basic examples
      if (ai >= 5 && ai < 7) {
        window.VizScatter.draw(p, manager, ai, progress);
        return;
      }

      // fallback
      p.clear();
    }
  };
})();