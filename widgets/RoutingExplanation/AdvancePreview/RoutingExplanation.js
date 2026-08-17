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
        domClass.add(card, "re-card");
        var hdr = domConstruct.create("div", null, card);
        domClass.add(hdr, "re-header");
        var ht = domConstruct.create("h3", null, hdr);
        domClass.add(ht, "re-header-title");
        ht.appendChild(document.createTextNode("Routing Rule Triggered"));
        var rid = domConstruct.create("span", null, hdr);
        domClass.add(rid, "re-rule-id");
        rid.appendChild(document.createTextNode("FIN-2024-03"));
        var body = domConstruct.create("div", null, card);
        domClass.add(body, "re-body");
        var expl = domConstruct.create("div", null, body);
        domClass.add(expl, "re-explanation");
        expl.appendChild(document.createTextNode("This contract request exceeds the standard approval threshold and has been escalated to VP Finance."));
        var thr = domConstruct.create("div", null, body);
        domClass.add(thr, "re-thresholds");
        var items = [["REQUEST AMOUNT", "USD 125,000", true], ["THRESHOLD", "USD 100,000", false]];
        for (var i = 0; i < items.length; i++) {
            var item = domConstruct.create("div", null, thr);
            domClass.add(item, "re-threshold-item");
            var lbl = domConstruct.create("div", null, item);
            domClass.add(lbl, "re-threshold-label");
            lbl.appendChild(document.createTextNode(items[i][0]));
            var val = domConstruct.create("div", null, item);
            domClass.add(val, "re-threshold-value" + (items[i][2] ? " triggered" : ""));
            val.appendChild(document.createTextNode(items[i][1]));
        }
        var nextRow = domConstruct.create("div", null, body);
        domClass.add(nextRow, "re-next-action-row");
        var nl = domConstruct.create("span", null, nextRow);
        domClass.add(nl, "re-next-label");
        nl.appendChild(document.createTextNode("Recommended Action:"));
        var nk = domConstruct.create("button", null, nextRow);
        domClass.add(nk, "re-next-link");
        nk.appendChild(document.createTextNode("Escalate to VP Finance"));
    },
    propertyChanged: function () {},
    modelChanged: function () {}
};
