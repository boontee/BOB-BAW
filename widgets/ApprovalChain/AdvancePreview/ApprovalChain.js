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
        var approvers = [
            { name: "Alice Chen", init: "A", role: "Manager", dept: "Finance", status: "approved", color: "#198038", bg: "#d4edda", text: "#198038" },
            { name: "Bob Nguyen", init: "B", role: "Director", dept: "Finance", status: "current",  color: "#0043ce", bg: "#d0e2ff", text: "#0043ce" }
        ];
        var card = domConstruct.create("div", null, this.context.coachViewData.inputDiv);
        domClass.add(card, "ac-card");
        var hdr = domConstruct.create("div", null, card);
        domClass.add(hdr, "ac-header");
        var ht = domConstruct.create("h3", null, hdr);
        domClass.add(ht, "ac-header-title");
        ht.appendChild(document.createTextNode("Approval Chain"));
        var rb = domConstruct.create("span", null, hdr);
        domClass.add(rb, "ac-route-badge");
        rb.appendChild(document.createTextNode("Sequential"));
        var layerDiv = domConstruct.create("div", null, card);
        domClass.add(layerDiv, "ac-layer");
        var lbl = domConstruct.create("div", null, layerDiv);
        domClass.add(lbl, "ac-layer-label");
        lbl.appendChild(document.createTextNode("Layer 1"));
        var row = domConstruct.create("div", null, layerDiv);
        domClass.add(row, "ac-approvers-row");
        for (var i = 0; i < approvers.length; i++) {
            var a = approvers[i];
            var ac = domConstruct.create("div", null, row);
            domClass.add(ac, "ac-approver-card");
            var av = domConstruct.create("div", null, ac);
            domClass.add(av, "ac-avatar");
            av.style.background = a.color;
            av.appendChild(document.createTextNode(a.init));
            var info = domConstruct.create("div", null, ac);
            domClass.add(info, "ac-approver-info");
            var nm = domConstruct.create("div", null, info);
            domClass.add(nm, "ac-approver-name");
            nm.appendChild(document.createTextNode(a.name));
            var sub = domConstruct.create("div", null, info);
            domClass.add(sub, "ac-approver-sub");
            sub.appendChild(document.createTextNode(a.role + " · " + a.dept));
            var badge = domConstruct.create("span", null, ac);
            domClass.add(badge, "ac-status-badge");
            badge.style.background = a.bg;
            badge.style.color = a.text;
            badge.appendChild(document.createTextNode(a.status.charAt(0).toUpperCase() + a.status.slice(1)));
        }
    },
    propertyChanged: function () {},
    modelChanged: function () {}
};
