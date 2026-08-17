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
        var steps = [
            { label: "Submitted", sublabel: "Requester", status: "completed" },
            { label: "L1 Review", sublabel: "Manager",   status: "completed" },
            { label: "L2 Approval", sublabel: "Director", status: "current" },
            { label: "L3 Approval", sublabel: "VP",       status: "pending" }
        ];
        var wrapper = domConstruct.create("div", null, this.context.coachViewData.inputDiv);
        domClass.add(wrapper, "arf-wrapper");
        var flow = domConstruct.create("div", null, wrapper);
        domClass.add(flow, "arf-flow");
        for (var i = 0; i < steps.length; i++) {
            if (i > 0) {
                var arr = domConstruct.create("div", null, flow);
                domClass.add(arr, "arf-arrow" + (steps[i-1].status === "completed" ? " completed" : ""));
            }
            var step = domConstruct.create("div", null, flow);
            var node = domConstruct.create("div", null, step);
            domClass.add(node, "arf-node");
            var circle = domConstruct.create("div", null, node);
            domClass.add(circle, "arf-circle " + steps[i].status);
            circle.appendChild(document.createTextNode(steps[i].status === "completed" ? "✓" : String(i + 1)));
            var lbl = domConstruct.create("div", null, node);
            domClass.add(lbl, "arf-node-label");
            lbl.appendChild(document.createTextNode(steps[i].label));
            var sub = domConstruct.create("div", null, node);
            domClass.add(sub, "arf-node-sublabel");
            sub.appendChild(document.createTextNode(steps[i].sublabel));
            flow.appendChild(step);
        }
    },
    propertyChanged: function () {},
    modelChanged: function () {}
};
