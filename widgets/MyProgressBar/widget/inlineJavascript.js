// MyProgressBar Widget — BAW inline JavaScript
// Binds to a plain Integer variable (0-100).

// ── Read bound value ──────────────────────────────────────────────────────────
var rawData = this.getData();
var progressValue = 0;
if (typeof rawData === "number") {
  progressValue = rawData;
} else if (rawData !== null && rawData !== undefined) {
  progressValue = parseInt(rawData, 10) || 0;
}
progressValue = Math.max(0, Math.min(100, progressValue));

// ── Read config options ───────────────────────────────────────────────────────
var showPercentage = this.getOption("showPercentage") !== false;
var showStatus     = this.getOption("showStatus")     !== false;
var animated       = this.getOption("animated")       !== false;

// ── Register boundary event ───────────────────────────────────────────────────
this.registerEventHandlingFunction(this, "progressChanged", "value");

// ── DOM references ────────────────────────────────────────────────────────────
var container     = this.context.element.querySelector(".myprogressbar_maincontentbox");
var track         = container.querySelector(".myprogressbar-track");
var fill          = container.querySelector(".myprogressbar-fill");
var pctWrapper    = container.querySelector(".myprogressbar-percentage");
var pctEl         = container.querySelector(".mypb-percentage-value");
var statusWrapper = container.querySelector(".myprogressbar-status");
var statusEl      = container.querySelector(".mypb-status-message");

// ── Helpers ───────────────────────────────────────────────────────────────────
function colorState(v) {
  if (v < 50)  return "state-low";
  if (v < 75)  return "state-moderate";
  return "state-high";
}

function statusState(v) {
  if (v === 0)   return "state-not-started";
  if (v < 100)   return "state-in-progress";
  return "state-complete";
}

function statusText(v) {
  if (v === 0)   return "Not started";
  if (v < 100)   return "In progress...";
  return "Complete";
}

// ── Core update function ──────────────────────────────────────────────────────
function updateProgress(v) {
  v = Math.max(0, Math.min(100, v));

  var cs = colorState(v);
  var ss = statusState(v);

  // Fill width
  fill.style.width = v + "%";

  // Color state classes — fill
  fill.classList.remove("state-low", "state-moderate", "state-high");
  fill.classList.add(cs);

  // Disable animation if configured off
  fill.style.transition = animated
    ? "width 0.5s ease-in-out, background-color 0.3s ease"
    : "none";

  // Percentage text
  pctEl.textContent = v + "%";
  pctEl.classList.remove("state-low", "state-moderate", "state-high");
  pctEl.classList.add(cs);
  pctWrapper.style.display = showPercentage ? "flex" : "none";

  // Status message
  statusEl.textContent = statusText(v);
  statusEl.classList.remove("state-not-started", "state-in-progress", "state-complete");
  statusEl.classList.add(ss);
  statusWrapper.style.display = showStatus ? "flex" : "none";

  // ARIA
  track.setAttribute("aria-valuenow",  v);
  track.setAttribute("aria-valuetext", v + "% — " + statusText(v));
}

// ── Initial render ────────────────────────────────────────────────────────────
updateProgress(progressValue);

// ── React to data-binding changes ────────────────────────────────────────────
var me = this;

if (this.context && this.context.binding && this.context.binding.addDataChangeListener) {
  this.context.binding.addDataChangeListener(function(newValue) {
    var nv = 0;
    if (typeof newValue === "number") {
      nv = newValue;
    } else if (newValue !== null && newValue !== undefined) {
      nv = parseInt(newValue, 10) || 0;
    }
    nv = Math.max(0, Math.min(100, nv));

    updateProgress(nv);

    // Fire boundary event
    if (me.ui && me.ui.fireEvent) {
      me.ui.fireEvent("progressChanged", {
        value:  nv,
        state:  colorState(nv),
        status: statusText(nv)
      });
    }
  });
}

// ── Public API for programmatic updates ──────────────────────────────────────
this.updateProgress = function(newValue) {
  var v = Math.max(0, Math.min(100, parseInt(newValue, 10) || 0));
  updateProgress(v);

  if (me.context && me.context.binding && me.context.binding.set) {
    me.context.binding.set(v);
  }

  if (me.ui && me.ui.fireEvent) {
    me.ui.fireEvent("progressChanged", {
      value:  v,
      state:  colorState(v),
      status: statusText(v)
    });
  }
};

// Made with Bob
