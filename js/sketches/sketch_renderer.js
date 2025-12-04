// sketch_renderer.js  — fixed to load data for histogram & scatter
(function () {
  window.Renderer = {
    // Store the section image for sections 0 and 1
    sectionImage: null,
    // Store the section image for section 9
    sectionImage9: null,

    // 这里改成 async，一启动就预加载两个新图需要的数据
    setData: async function (manager) {
      manager.offsetX = (manager.margin && manager.margin.left) || 20;
      manager.offsetY = (manager.margin && manager.margin.top) || 0;
      manager.data = [];

      const tasks = [];

      // Initialize stress dashboard visualization if available
      if (window.StressDashboardViz) {
        window.StressDashboardViz.setData(manager, null);
      }

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


    // Load the section image (called from p5 draw)
    loadImage: function (p) {
      if (!this.sectionImage && p) {
        this.sectionImage = p.loadImage('pic/section1.png');
      }
    },

    // Load the section 9 image (called from p5 draw)
    loadImage9: function (p) {
      if (!this.sectionImage9 && p) {
        this.sectionImage9 = p.loadImage('pic/picture2.png');
      }
    },

    draw: function (p, manager, ai, progress) {

      // SECTION 0 — Title and group members text visualization
      if (ai === 0) {
        var canvasW = manager.canvasWidth || manager.width || 640;
        var canvasH = manager.canvasHeight || manager.height || 480;
        p.resizeCanvas(canvasW, canvasH);
        p.background("#f7f9fc");
        
        var cx = canvasW / 2;
        var cy = canvasH / 2;
        
        // Set font to match article (Times New Roman)
        p.textFont("Times New Roman");
        
        // Title - split into multiple lines with larger font
        p.fill("#111");
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(36);
        p.textStyle(p.BOLD);
        
        var titleLine1 = "Scrolling Through Our Minds:";
        var titleLine2 = "How Social Media Shapes the";
        var titleLine3 = "Emotional World of Young Adults";
        
        var lineHeight = 42;
        p.text(titleLine1, cx, cy - 70);
        p.text(titleLine2, cx, cy - 70 + lineHeight);
        p.text(titleLine3, cx, cy - 70 + lineHeight * 2);
        
        // Group members - using article font (increased spacing from title)
        p.fill("#444");
        p.textSize(17);
        p.textStyle(p.NORMAL);
        p.text("Phoebe Dong, Daphni A George, Hanrui Tang", cx, cy + 80);
        
        return;
      }

      // Load image if not already loaded
      this.loadImage(p);

      // SECTION 1 — Display header image
      if (ai === 1) {
        p.background(255);
        if (this.sectionImage && this.sectionImage.width > 0) {
          // Calculate dimensions to fit canvas while maintaining aspect ratio
          var imgW = this.sectionImage.width;
          var imgH = this.sectionImage.height;
          var canvasW = manager.canvasWidth || manager.width || 640;
          var canvasH = manager.canvasHeight || manager.height || 480;
          
          // Calculate scaling to fit within canvas with some padding
          var scale = Math.min(
            (canvasW - 40) / imgW,
            (canvasH - 40) / imgH
          );
          
          var displayW = imgW * scale;
          var displayH = imgH * scale;
          var x = (canvasW - displayW) / 2;
          var y = (canvasH - displayH) / 2;
          
          p.image(this.sectionImage, x, y, displayW, displayH);
        } else {
          // Show loading message while image loads
          p.fill(150);
          p.textSize(14);
          p.text('Loading image...', 20, 30);
        }
        return;
      }

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

      // SECTION 8 — Scatter 
      if (ai == 8 && window.VizScatter) {
        window.VizScatter.draw(p, manager, ai, progress);
        return;
      }

      // Stress Dashboard sections (81-83)
      if (ai >= 81 && ai <= 83) {
        console.log("=== Stress Dashboard Section Active! ai =", ai, "progress =", progress);
        if (window.StressDashboardViz) {
          console.log("=== Calling StressDashboardViz.draw ===");
          window.StressDashboardViz.draw(p, manager, ai, progress);
          return;
        } else {
          console.log("=== StressDashboardViz NOT FOUND ===");
        }
      }

      // Load image if not already loaded
      this.loadImage9(p);

      // SECTION 9 — Display picture2.png
      if (ai === 9) {
        p.background(255);
        if (this.sectionImage9 && this.sectionImage9.width > 0) {
          // Calculate dimensions to fit canvas while maintaining aspect ratio
          var imgW = this.sectionImage9.width;
          var imgH = this.sectionImage9.height;
          var canvasW = manager.canvasWidth || manager.width || 640;
          var canvasH = manager.canvasHeight || manager.height || 480;
          
          // Calculate scaling to fit within canvas with some padding
          var scale = Math.min(
            (canvasW - 40) / imgW,
            (canvasH - 40) / imgH
          );
          
          var displayW = imgW * scale;
          var displayH = imgH * scale;
          var x = (canvasW - displayW) / 2;
          var y = (canvasH - displayH) / 2;
          
          p.image(this.sectionImage9, x, y, displayW, displayH);
        } else {
          // Show loading message while image loads
          p.fill(150);
          p.textSize(14);
          p.text('Loading image...', 20, 30);
        }
        return;
      }

      // fallback: clear canvas
      p.clear();
    }
  };
})();