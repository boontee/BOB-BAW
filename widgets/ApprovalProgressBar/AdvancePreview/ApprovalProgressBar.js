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
        var stages = [
            { label: "Submitted", status: "completed" },
            { label: "Review",    status: "completed" },
            { label: "Approval",  status: "current" },
            { label: "Done",      status: "pending" }
        ];
        var wrapper = domConstruct.create("div", null, this.context.coachViewData.inputDiv);
        domClass.add(wrapper, "apb-wrapper");
        var stagesDiv = domConstruct.create("div", null, wrapper);
        domClass.add(stagesDiv, "apb-stages");
        for (var i = 0; i < stages.length; i++) {
            if (i > 0) {
                var conn = domConstruct.create("div", null, stagesDiv);
                domClass.add(conn, "apb-connector" + (stages[i - 1].status === "completed" ? " completed" : ""));
            }
            var node = domConstruct.create("div", null, stagesDiv);
            domClass.add(node, "apb-node");
            var circle = domConstruct.create("div", null, node);
            domClass.add(circle, "apb-circle " + stages[i].status);
            circle.appendChild(document.createTextNode(stages[i].status === "completed" ? "✓" : String(i + 1)));
            var lbl = domConstruct.create("div", null, node);
            domClass.add(lbl, "apb-stage-label" + (stages[i].status === "current" ? " current" : ""));
            lbl.appendChild(document.createTextNode(stages[i].label));
        }
        var btn = domConstruct.create("button", null, wrapper);
        domClass.add(btn, "apb-cta-btn");
        btn.appendChild(document.createTextNode("Submit for Approval"));
    },
    propertyChanged: function () {},
    modelChanged: function () {}
};
