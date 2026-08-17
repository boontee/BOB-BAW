var mixObject = {
    createPreview: function (containingDiv, labelText, callback) {
        var previewLayerUri = this.context.getManagedAssetUrl("BPMExt-Controls.preview.js", this.context.assetType_WEB, "SYSBPMUI");
        require([previewLayerUri], this.lang.hitch(this, function () {
            require(["dojo/dom-construct", "dojo/dom-class", "bpmui/preview/BPMExt-Core-Designer"],
                this.lang.hitch(this, function (domConstruct, domClass, bpmext) {
                    bpmext.uidesign.css.ensureGlyphsLoaded(this);
                    bpmext.uidesign.css.ensureSparkUIClass(containingDiv);
                    var inputDiv = domConstruct.create("div", null, containingDiv);
                    this.context.coachViewData.inputDiv = inputDiv;
                    this._buildPreview(domConstruct, domClass);
                    callback();
                }));
        }));
    },
    getLabelDomElement: function () { return null; },
    _buildPreview: function (domConstruct, domClass) {
        var card = domConstruct.create("div", null, this.context.coachViewData.inputDiv);
        domClass.add(card, "psc-card");
        var banner = domConstruct.create("div", null, card);
        domClass.add(banner, "psc-route-banner");
        banner.appendChild(document.createTextNode("Sequential Approval (3 Layers)"));
        var body = domConstruct.create("div", null, card);
        domClass.add(body, "psc-body");
        var metaRow = domConstruct.create("div", null, body);
        domClass.add(metaRow, "psc-meta-row");
        var items = [["SUBMITTED", "2026-08-15 09:32"], ["EST. COMPLETION", "2026-08-18"]];
        for (var i = 0; i < items.length; i++) {
            var item = domConstruct.create("div", null, metaRow);
            domClass.add(item, "psc-meta-item");
            var lbl = domConstruct.create("div", null, item);
            domClass.add(lbl, "psc-meta-label");
            lbl.appendChild(document.createTextNode(items[i][0]));
            var val = domConstruct.create("div", null, item);
            domClass.add(val, "psc-meta-value");
            val.appendChild(document.createTextNode(items[i][1]));
        }
        var div = domConstruct.create("div", null, body);
        domClass.add(div, "psc-divider");
        var ai = domConstruct.create("div", null, body);
        domClass.add(ai, "psc-ai-section");
        var ailbl = domConstruct.create("div", null, ai);
        domClass.add(ailbl, "psc-ai-label");
        ailbl.appendChild(document.createTextNode("AI RISK SCORE"));
        var track = domConstruct.create("div", null, ai);
        domClass.add(track, "psc-ai-gauge-track");
        var fill = domConstruct.create("div", null, track);
        domClass.add(fill, "psc-ai-gauge-fill");
        fill.style.width = "72%";
        var score = domConstruct.create("div", null, ai);
        domClass.add(score, "psc-ai-score-text");
        score.appendChild(document.createTextNode("72 / 100"));
        var sugg = domConstruct.create("button", null, ai);
        domClass.add(sugg, "psc-ai-suggestion");
        sugg.appendChild(document.createTextNode("View Risk Factors"));
    },
    propertyChanged: function () {},
    modelChanged: function () {}
};
