/*
 * #BEGIN COPYRIGHT
 *
 * Licensed Materials - Property of IBM
 * 5725-C95
 * (C) Copyright IBM Corporation 2026
 *
 * #END COPYRIGHT
 */

var mixObject = {

    createPreview: function (containingDiv, labelText, callback) {
        var previewLayerUri = this.context.getManagedAssetUrl(
            "BPMExt-Controls.preview.js",
            this.context.assetType_WEB,
            "SYSBPMUI"
        );

        require([previewLayerUri], this.lang.hitch(this, function () {
            require([
                "dojo/dom-construct",
                "dojo/dom-class",
                "dojo/dom-attr",
                "bpmui/preview/BPMExt-Core-Designer"
            ], this.lang.hitch(this, function (domConstruct, domClass, domAttr, bpmext) {

                bpmext.uidesign.css.ensureGlyphsLoaded(this);
                bpmext.uidesign.css.ensureSparkUIClass(containingDiv);

                this.context.coachViewData.containingDiv = containingDiv;

                // Form group wrapper
                var formGroupDiv = domConstruct.create("div", null, containingDiv);
                domClass.add(formGroupDiv, "form-group");
                this.context.coachViewData.formGroupDiv = formGroupDiv;

                // Label
                var label = domConstruct.create("span", null, formGroupDiv);
                domClass.add(label, "control-label");
                label.appendChild(document.createTextNode(labelText));
                this.context.coachViewData.label = label;

                // Input wrapper
                var inputDiv = domConstruct.create("div", null, formGroupDiv);
                domClass.add(inputDiv, "input");
                this.context.coachViewData.inputDiv = inputDiv;

                this.generateSampleData(domConstruct, domAttr, domClass);

                callback();
            }));
        }));
    },

    getLabelDomElement: function () {
        return this.context.coachViewData.label;
    },

    generateSampleData: function (domConstruct, domAttr, domClass) {
        var progressValue = 65; // moderate / yellow preview

        // Root container
        var mainBox = domConstruct.create("div", null, this.context.coachViewData.inputDiv);
        domClass.add(mainBox, "myprogressbar_maincontentbox");

        var container = domConstruct.create("div", null, mainBox);
        domClass.add(container, "DesignContentBox");
        domClass.add(container, "myprogressbar-container");

        // Percentage
        var pctWrapper = domConstruct.create("div", null, container);
        domClass.add(pctWrapper, "DesignContentBox");
        domClass.add(pctWrapper, "myprogressbar-percentage");
        var pctEl = domConstruct.create("span", null, pctWrapper);
        domClass.add(pctEl, "mypb-percentage-value");
        domClass.add(pctEl, "state-moderate");
        pctEl.textContent = progressValue + "%";

        // Track + fill
        var track = domConstruct.create("div", null, container);
        domClass.add(track, "DesignContentBox");
        domClass.add(track, "myprogressbar-track");
        var fill = domConstruct.create("div", null, track);
        domClass.add(fill, "myprogressbar-fill");
        domClass.add(fill, "state-moderate");
        domAttr.set(fill, "style", "width:" + progressValue + "%;");

        // Status
        var statusWrapper = domConstruct.create("div", null, container);
        domClass.add(statusWrapper, "DesignContentBox");
        domClass.add(statusWrapper, "myprogressbar-status");
        var statusEl = domConstruct.create("span", null, statusWrapper);
        domClass.add(statusEl, "mypb-status-message");
        domClass.add(statusEl, "state-in-progress");
        statusEl.textContent = "In progress...";

        // Store refs for propertyChanged
        this.context.coachViewData.fill      = fill;
        this.context.coachViewData.pctEl     = pctEl;
        this.context.coachViewData.statusEl  = statusEl;
        this.context.coachViewData.pctWrapper    = pctWrapper;
        this.context.coachViewData.statusWrapper = statusWrapper;
    },

    propertyChanged: function (propertyName, propertyValue) {
        var cvd = this.context.coachViewData;
        if (!cvd.inputDiv) { return; }

        if (propertyName === "showPercentage") {
            if (cvd.pctWrapper) {
                cvd.pctWrapper.style.display = propertyValue ? "flex" : "none";
            }
        } else if (propertyName === "showStatus") {
            if (cvd.statusWrapper) {
                cvd.statusWrapper.style.display = propertyValue ? "flex" : "none";
            }
        } else if (propertyName === "animated") {
            if (cvd.fill) {
                cvd.fill.style.transition = propertyValue
                    ? "width 0.5s ease-in-out, background-color 0.3s ease"
                    : "none";
            }
        }
    },

    modelChanged: function (propertyName, propertyValue) {
        // Not required for preview
    }
};

// Made with Bob
