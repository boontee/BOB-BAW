var mixObject = {
    createPreview: function (containingDiv, labelText, callback) {
        var previewLayerUri = this.context.getManagedAssetUrl("BPMExt-Controls.preview.js", this.context.assetType_WEB, "SYSBPMUI");
        require([previewLayerUri], this.lang.hitch(this, function () {
            require(["dojo/dom-construct", "dojo/dom-class", "bpmui/preview/BPMExt-Core-Designer"],
                this.lang.hitch(this, function (domConstruct, domClass, bpmext) {
                    bpmext.uidesign.css.ensureGlyphsLoaded(this);
                    bpmext.uidesign.css.ensureSparkUIClass(containingDiv);
                    var formGroupDiv = domConstruct.create("div", null, containingDiv);
                    domClass.add(formGroupDiv, "form-group");
                    var inputDiv = domConstruct.create("div", null, formGroupDiv);
                    domClass.add(inputDiv, "input");
                    this.context.coachViewData.inputDiv = inputDiv;
                    this._buildPreview(domConstruct, domClass);
                    callback();
                }));
        }));
    },
    getLabelDomElement: function () { return null; },
    _buildPreview: function (domConstruct, domClass) {
        var card = domConstruct.create("div", null, this.context.coachViewData.inputDiv);
        domClass.add(card, "aap-card");
        var hdr = domConstruct.create("div", null, card);
        domClass.add(hdr, "aap-header");
        var ht = domConstruct.create("h3", null, hdr);
        domClass.add(ht, "aap-header-title");
        ht.appendChild(document.createTextNode("Jane Smith"));
        var badge = domConstruct.create("span", null, hdr);
        domClass.add(badge, "aap-layer-badge");
        badge.appendChild(document.createTextNode("Layer 2 / 3"));
        var body = domConstruct.create("div", null, card);
        domClass.add(body, "aap-body");
        var ctx = domConstruct.create("div", null, body);
        domClass.add(ctx, "aap-context");
        ctx.appendChild(document.createTextNode("This request exceeds the $50,000 threshold."));
        var lbl = domConstruct.create("label", null, body);
        domClass.add(lbl, "aap-comment-label");
        lbl.appendChild(document.createTextNode("Review Comment"));
        var ta = domConstruct.create("textarea", null, body);
        domClass.add(ta, "aap-comment-textarea");
        ta.setAttribute("placeholder", "Enter your review comment…");
        var actions = domConstruct.create("div", null, body);
        domClass.add(actions, "aap-actions");
        var btnStyles = [["Approve", "primary"], ["Reject", "danger"], ["Return", "secondary"]];
        for (var i = 0; i < btnStyles.length; i++) {
            var btn = domConstruct.create("button", null, actions);
            domClass.add(btn, "aap-btn");
            domClass.add(btn, "aap-btn-" + btnStyles[i][1]);
            btn.appendChild(document.createTextNode(btnStyles[i][0]));
        }
    },
    propertyChanged: function () {},
    modelChanged: function () {}
};
