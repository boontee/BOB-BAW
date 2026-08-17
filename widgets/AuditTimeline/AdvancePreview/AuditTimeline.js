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
        var events = [
            { actor: "John Requester", action: "Submitted",  timestamp: "Aug 15 09:32", detail: "Contract submitted for USD 125,000.", highlight: false, dotClass: "" },
            { actor: "Alice Chen",     action: "Approved",   timestamp: "Aug 15 14:05", detail: "Approved at Layer 1.",              highlight: true,  dotClass: " approved" },
            { actor: "Bob Nguyen",     action: "Returned",   timestamp: "Aug 16 11:22", detail: "Returned for clarification.",       highlight: false, dotClass: "" }
        ];
        var card = domConstruct.create("div", null, this.context.coachViewData.inputDiv);
        domClass.add(card, "at-card");
        var hdr = domConstruct.create("div", null, card);
        domClass.add(hdr, "at-header");
        var ht = domConstruct.create("h3", null, hdr);
        domClass.add(ht, "at-header-title");
        ht.appendChild(document.createTextNode("Audit Trail (3)"));
        var list = domConstruct.create("div", null, card);
        domClass.add(list, "at-list");
        for (var i = 0; i < events.length; i++) {
            var e = events[i];
            var evDiv = domConstruct.create("div", null, list);
            domClass.add(evDiv, "at-event" + (e.highlight ? " highlighted" : ""));
            var dot = domConstruct.create("div", null, evDiv);
            domClass.add(dot, "at-dot" + (e.highlight ? " highlighted" : "") + e.dotClass);
            var header = domConstruct.create("div", null, evDiv);
            domClass.add(header, "at-event-header");
            var actor = domConstruct.create("span", null, header);
            domClass.add(actor, "at-actor");
            actor.appendChild(document.createTextNode(e.actor));
            var badge = domConstruct.create("span", null, header);
            domClass.add(badge, "at-action-badge");
            badge.appendChild(document.createTextNode(e.action));
            var ts = domConstruct.create("span", null, header);
            domClass.add(ts, "at-timestamp");
            ts.appendChild(document.createTextNode(e.timestamp));
            var detail = domConstruct.create("div", null, evDiv);
            domClass.add(detail, "at-detail");
            detail.appendChild(document.createTextNode(e.detail));
        }
    },
    propertyChanged: function () {},
    modelChanged: function () {}
};
