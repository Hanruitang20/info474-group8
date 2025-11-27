# How Social Media Shapes the Emotional World of Young Adults

An interactive data storytelling project that explores the complex relationship between social media usage and emotional well-being among young adults. This scrollytelling visualization uses multiple datasets and interactive charts to reveal how different platforms, usage patterns, and content types influence emotional outcomes.

## Project Overview

This project presents a data-driven narrative that moves through multiple layers of analysis:

1. **Baseline Usage Patterns** - Understanding how much time young adults spend on social media
2. **Platform-Level Effects** - Examining how different platforms create distinct emotional environments
3. **Content-Level Influences** - Exploring how specific engagement behaviors affect emotional well-being
4. **Demographic Patterns** - Identifying which groups may be most vulnerable to emotional impacts

## The Narrative Structure

The article is organized as a scrolling narrative with 10 sections:

- **Sections 0-1**: Introduction and framing (full-width text layout)
- **Section 2**: Phone addiction baseline (boxplot visualization)
- **Section 3**: Daily usage distribution (histogram)
- **Section 4**: Usage vs. mental health relationship (scatterplot with trend line)
- **Section 5**: Platform emotional climates (heatmap)
- **Section 6**: Content-level effects (interactive emotion card)
- **Section 7**: Demographic patterns (grouped bar chart)
- **Sections 8-9**: Reflection and conclusion

As users scroll, visualizations appear and update on the right side of the screen, creating an immersive data storytelling experience.

## Datasets

The project uses three key datasets:

### 1. Students Social Media Addiction Dataset
- **Source**: `data/Students Social Media Addiction.csv`
- **Key Variables**: 
  - `Avg_Daily_Usage_Hours` - Average hours spent on social media per day
  - `Mental_Health_Score` - Self-reported mental health score (1-5 scale, higher = more distress)
  - `Country`, `Gender` - Demographic variables
  - `Most_Used_Platform` - Primary social media platform
- **Used in**: Histogram (Section 3), Scatterplot (Section 4), Platform scatterplot visualization

### 2. Social Media and Mental Health Dataset
- **Source**: `data/social_media_and_mental_health.csv`
- **Key Variables**:
  - Platform usage indicators
  - Emotional difficulty scores across multiple dimensions:
    - Bothered by worries
    - Difficulty concentrating
    - Social comparison frequency
    - Feeling depressed
- **Used in**: Heatmap visualization (Section 5) showing platform emotional climates

### 3. Emotional Well-Being Dataset
- **Source**: `data/emotional_well_being.csv`
- **Key Variables**:
  - User engagement metrics
  - Dominant emotions by platform
  - Age and demographic information
- **Used in**: Interactive emotion card visualization (Section 6)

## Visualizations

### Histogram (Section 3)
- **File**: `js/sketches/viz/viz_usage_histogram.js`
- **Shows**: Distribution of daily social media usage hours
- **Features**: 
  - Equal-interval bins (0-1, 1-2, 2-3 hours, etc.)
  - Hover tooltips showing usage range and student count
  - Reveals clustering around 3-5 hour range

### Scatterplot (Section 4)
- **File**: `js/sketches/viz/viz_usage_scatter.js`
- **Shows**: Relationship between usage hours and mental health scores
- **Features**:
  - Linear regression trend line
  - Point jitter to reduce overlap
  - Hover tooltips with interpretation (positive/moderate/strain/distress)
  - Reveals downward trend: more usage correlates with lower well-being

### Platform Heatmap (Section 5)
- **File**: `js/sketches/viz/viz_heatmap_mental_health.js`
- **Shows**: Emotional difficulty scores across platforms and indicators
- **Features**:
  - Color-coded cells (cooler = better, warmer = more strain)
  - Platforms: Instagram, TikTok, Reddit, YouTube
  - Indicators: worries, concentration, comparison, depression
  - Reveals TikTok as most emotionally demanding

### Phone Addiction Boxplot (Section 2)
- **File**: `js/sketches/viz/viz_phone_boxplot.js`
- **Shows**: Distribution of phone addiction scores
- **Features**: Standard boxplot showing quartiles and outliers
- **Reveals**: High baseline attachment to devices

### Interactive Emotion Card (Section 6)
- **File**: `js/sketches/viz/viz_emotions.js`
- **Shows**: Relationship between engagement and dominant emotions
- **Features**: 
  - Platform filter dropdown
  - Age slider
  - Real-time updates of emoji, colors, and metrics

### Grouped Bar Chart (Section 7)
- **File**: `js/sketches/viz/viz_grouped_bar.js`
- **Shows**: Emotional difficulty by age group and gender
- **Features**: Grouped bars comparing demographic segments

## Technical Architecture

### Scrolling Interaction Design

The project uses a scroll-driven visualization system where:

- **Sections** in the HTML (`<section class="step">`) drive the visual state
- **Scroller** (`js/helpers/scroller.js`) computes the active section index based on scroll position
- **Visual Controller** (`js/helpers/visual_controller.js`) shows/hides the canvas based on active index
- **Sketch Manager** (`js/sketches/sketch_manager.js`) manages the p5.js lifecycle
- **Renderer** (`js/sketches/sketch_renderer.js`) delegates drawing to specific visualization modules

The visualization canvas appears starting at Section 2 and remains visible for data-driven sections. Sections 0 and 1 use a full-width text layout without the canvas.

### Codebase Structure

```
info474-group8/
├── index.html              # Main HTML with narrative sections
├── css/
│   └── style.css           # Layout and typography styles
├── data/                   # CSV datasets
│   ├── Students Social Media Addiction.csv
│   ├── social_media_and_mental_health.csv
│   └── emotional_well_being.csv
├── js/
│   ├── helpers/
│   │   ├── data_loader.js      # TSV parsing utilities
│   │   ├── scroller.js         # Scroll position tracking
│   │   ├── visual_controller.js # Canvas show/hide logic
│   │   └── sections.js         # Orchestrator wiring everything together
│   └── sketches/
│       ├── sketch_manager.js   # p5.js lifecycle management
│       ├── sketch_renderer.js  # Delegates to visualization modules
│       └── viz/                # Individual visualization modules
│           ├── viz_usage_histogram.js
│           ├── viz_usage_scatter.js
│           ├── viz_heatmap_mental_health.js
│           ├── viz_phone_boxplot.js
│           ├── viz_emotions.js
│           └── viz_grouped_bar.js
└── README.md
```

### Key Components

**Sketch Manager** (`sketch_manager.js`):
- Creates and manages the p5.js instance
- Exposes API: `setState()`, `setData()`, `ready` Promise
- Handles canvas creation and frame rendering

**Renderer** (`sketch_renderer.js`):
- Routes draw calls to appropriate visualization based on `activeIndex`
- Each visualization module exports `window.VizName.draw(p, manager, ai, progress)`

**Visualization Modules**:
- Each module in `viz/` is self-contained
- Implements `setData()` for async data loading
- Implements `draw()` for rendering
- Uses manager's `width`, `height`, and `margin` for layout

## Running Locally

1. **Start a local server** (required for loading CSV files):

	 ```bash
   # Using Python 3
	 python3 -m http.server 8000
   
   # Or using Node.js http-server
   npx http-server -p 8000
   ```

2. **Open in browser**:
   ```
   http://localhost:8000
   ```

3. **Scroll through the article** to see visualizations appear and update.

## Deployment

The project can be deployed to any static hosting service:

- **GitHub Pages**: Push to `gh-pages` branch or use `docs/` folder
- **Netlify**: Connect repository for automatic deployments
- **Vercel**: Deploy as static site

Ensure all files maintain their relative paths.

## Limitations

- **Data Loading**: Visualizations load data asynchronously, so there may be a brief "Loading..." state
- **Browser Compatibility**: Requires modern browser with ES6+ support
- **Screen Size**: Optimized for desktop/laptop viewing (1040px container width)
- **CSV Parsing**: Simple comma-splitting (may not handle complex CSV with quoted fields containing commas)

## Future Improvements

- [ ] Improve CSV parsing to handle quoted fields and edge cases
- [ ] Add responsive design for mobile devices
- [ ] Implement smooth transitions between visualizations
- [ ] Add export functionality for charts
- [ ] Include statistical significance indicators
- [ ] Add more interactive filtering options
- [ ] Improve accessibility (ARIA labels, keyboard navigation)
- [ ] Add data source citations and methodology notes

## Credits

Built using:
- [p5.js](https://p5js.org/) for rendering
- [Inter](https://rsms.me/inter/) font family
- Custom scrollytelling framework

## License

This project is for educational purposes as part of INFO 474 coursework.
