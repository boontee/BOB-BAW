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
        var host = this.context.coachViewData.inputDiv;

        // ── Root wrapper ───────────────────────────────────────────────────
        var root = domConstruct.create("div", null, host);
        domClass.add(root, "ard-p-root");

        // ══ PROGRESS BAR ════════════════════════════════════════════════════
        var progTitle = domConstruct.create("div", null, root);
        domClass.add(progTitle, "ard-p-prog-title");
        progTitle.appendChild(document.createTextNode("簽核進度"));

        var progRow = domConstruct.create("div", null, root);
        domClass.add(progRow, "ard-p-prog-row");

        var stages = domConstruct.create("div", null, progRow);
        domClass.add(stages, "ard-p-stages");

        var stageData = [
            { label: "起草送件", status: "completed" },
            { label: "簽核路由", status: "current"   },
            { label: "外部查署", status: "pending"   },
            { label: "完成詳情", status: "pending"   }
        ];
        for (var si = 0; si < stageData.length; si++) {
            if (si > 0) {
                var conn = domConstruct.create("div", null, stages);
                domClass.add(conn, "ard-p-conn");
                if (stageData[si - 1].status === "completed") { domClass.add(conn, "done"); }
            }
            var stDiv = domConstruct.create("div", null, stages);
            domClass.add(stDiv, "ard-p-stage");
            var circle = domConstruct.create("div", null, stDiv);
            domClass.add(circle, "ard-p-circle");
            domClass.add(circle, stageData[si].status);
            if (stageData[si].status === "completed") {
                circle.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M6 11L2 7l1.4-1.4L6 8.2l6.6-6.6L14 3z"/></svg>';
            } else {
                circle.appendChild(document.createTextNode(String(si + 1)));
            }
            var lbl = domConstruct.create("div", null, stDiv);
            domClass.add(lbl, "ard-p-lbl");
            if (stageData[si].status === "current") { domClass.add(lbl, "current"); }
            lbl.appendChild(document.createTextNode(stageData[si].label));
        }

        var ctaBtn = domConstruct.create("button", null, progRow);
        domClass.add(ctaBtn, "ard-p-cta");
        ctaBtn.appendChild(document.createTextNode("已完成 → 外部簽署 →"));

        // Contract title
        var contract = domConstruct.create("div", null, root);
        domClass.add(contract, "ard-p-contract");
        contract.appendChild(document.createTextNode("2026 年度軟體維護服務合約"));

        // ══ TWO-COLUMN MAIN ══════════════════════════════════════════════════
        var main = domConstruct.create("div", null, root);
        domClass.add(main, "ard-p-main");

        var left  = domConstruct.create("div", null, main);
        domClass.add(left, "ard-p-left");
        var right = domConstruct.create("div", null, main);
        domClass.add(right, "ard-p-right");

        // ── Approval Chain ───────────────────────────────────────────────────
        var chainPanel = domConstruct.create("div", null, left);
        domClass.add(chainPanel, "ard-p-panel");
        var chainHdr = domConstruct.create("div", null, chainPanel);
        domClass.add(chainHdr, "ard-p-panel-hdr");
        chainHdr.appendChild(document.createTextNode("🐎 串簽流程（3 層）"));

        var approvers = [
            { init: "王", name: "王志明", meta: "直屬主管・採購部門",  status: "approved", badge: "已核准", urge: false },
            { init: "李", name: "李雅婷", meta: "上一層主管・採購總監", status: "current",  badge: "審核中", urge: true  },
            { init: "張", name: "張文豪", meta: "最終核准・副總經理",   status: "pending",  badge: "待簽",   urge: false }
        ];
        for (var ai = 0; ai < approvers.length; ai++) {
            var ap = approvers[ai];
            var row = domConstruct.create("div", null, chainPanel);
            domClass.add(row, "ard-p-ap-row");
            var av = domConstruct.create("div", null, row);
            domClass.add(av, "ard-p-avatar");
            domClass.add(av, ap.status);
            av.appendChild(document.createTextNode(ap.init));
            var info = domConstruct.create("div", null, row);
            domClass.add(info, "ard-p-ap-info");
            var nm = domConstruct.create("div", null, info);
            domClass.add(nm, "ard-p-ap-name");
            nm.appendChild(document.createTextNode(ap.name));
            var mt = domConstruct.create("div", null, info);
            domClass.add(mt, "ard-p-ap-meta");
            mt.appendChild(document.createTextNode(ap.meta));
            var actions = domConstruct.create("div", null, row);
            if (ap.urge) {
                var urgeBtn = domConstruct.create("button", null, actions);
                domClass.add(urgeBtn, "ard-p-urge");
                urgeBtn.appendChild(document.createTextNode("催辦"));
            }
            var bdg = domConstruct.create("span", null, actions);
            domClass.add(bdg, "ard-p-badge");
            domClass.add(bdg, ap.status);
            bdg.appendChild(document.createTextNode(ap.badge));
        }

        // ── Process Status ────────────────────────────────────────────────────
        var statPanel = domConstruct.create("div", null, left);
        domClass.add(statPanel, "ard-p-panel");
        var statHdr = domConstruct.create("div", null, statPanel);
        domClass.add(statHdr, "ard-p-panel-hdr");
        statHdr.appendChild(document.createTextNode("⠿ 流程狀態"));

        var statRows = [
            { label: "路由類型", value: "串簽 Sequential", ai: false },
            { label: "送審時間", value: "2026-07-14 09:32", ai: false },
            { label: "預計完成", value: "2026-07-16",       ai: false },
            { label: "AI 審查結果", value: "82 / 100 建議修改", ai: true }
        ];
        for (var ri = 0; ri < statRows.length; ri++) {
            var sr = domConstruct.create("div", null, statPanel);
            domClass.add(sr, "ard-p-stat-row");
            var sl = domConstruct.create("span", null, sr);
            domClass.add(sl, "ard-p-stat-lbl");
            sl.appendChild(document.createTextNode(statRows[ri].label));
            var sv = domConstruct.create("span", null, sr);
            domClass.add(sv, "ard-p-stat-val");
            if (statRows[ri].ai) { domClass.add(sv, "ai"); }
            sv.appendChild(document.createTextNode(statRows[ri].value));
        }

        // ── Audit Timeline ───────────────────────────────────────────────────
        var auditPanel = domConstruct.create("div", null, left);
        domClass.add(auditPanel, "ard-p-panel");
        var auditHdr = domConstruct.create("div", null, auditPanel);
        domClass.add(auditHdr, "ard-p-panel-hdr");
        auditHdr.appendChild(document.createTextNode("↺ 審核歷程"));

        var auditEvents = [
            { ts: "07-14 09:32", detail: "陳大明送審，附 AI 報告",             hi: false },
            { ts: "07-14 11:05", detail: "王志明核准 — 「條款無誤，同意送上級」", hi: true  },
            { ts: "07-14 11:05", detail: "系統通知李雅婷待審",                 hi: false }
        ];
        for (var ei = 0; ei < auditEvents.length; ei++) {
            var ev = auditEvents[ei];
            var evRow = domConstruct.create("div", null, auditPanel);
            domClass.add(evRow, "ard-p-audit-item");
            var dot = domConstruct.create("div", null, evRow);
            domClass.add(dot, "ard-p-audit-dot");
            if (ev.hi) { domClass.add(dot, "hi"); }
            var ts = domConstruct.create("span", null, evRow);
            domClass.add(ts, "ard-p-audit-ts");
            ts.appendChild(document.createTextNode(ev.ts));
            var det = domConstruct.create("span", null, evRow);
            domClass.add(det, "ard-p-audit-detail");
            if (ev.hi) { domClass.add(det, "hi"); }
            det.appendChild(document.createTextNode(ev.detail));
        }

        // ── Action Panel (right) ─────────────────────────────────────────────
        var actPanel = domConstruct.create("div", null, right);
        domClass.add(actPanel, "ard-p-action-panel");
        var actHdr = domConstruct.create("div", null, actPanel);
        domClass.add(actHdr, "ard-p-action-hdr");
        actHdr.appendChild(document.createTextNode("⏰ 待我審核"));
        var ctx = domConstruct.create("div", null, actPanel);
        domClass.add(ctx, "ard-p-ctx");
        ctx.appendChild(document.createTextNode("您目前為本案第 2 層審核人，請確認合約條款並做出決策。"));
        var btns = domConstruct.create("div", null, actPanel);
        domClass.add(btns, "ard-p-btns");
        var btnDefs = [["退回","danger"],["轉派","secondary"],["核准","primary"]];
        for (var bi = 0; bi < btnDefs.length; bi++) {
            var btn = domConstruct.create("button", null, btns);
            domClass.add(btn, "ard-p-btn");
            domClass.add(btn, btnDefs[bi][1]);
            btn.appendChild(document.createTextNode(btnDefs[bi][0]));
        }
        var cmtLbl = domConstruct.create("label", null, actPanel);
        domClass.add(cmtLbl, "ard-p-comment-lbl");
        cmtLbl.appendChild(document.createTextNode("審核意見（選填）"));
        var ta = domConstruct.create("textarea", null, actPanel);
        domClass.add(ta, "ard-p-textarea");
        ta.setAttribute("placeholder", "填寫審核意見…");

        // ── Route Explanation (right) ────────────────────────────────────────
        var routePanel = domConstruct.create("div", null, right);
        domClass.add(routePanel, "ard-p-panel");
        var routeHdr = domConstruct.create("div", null, routePanel);
        domClass.add(routeHdr, "ard-p-panel-hdr");
        routeHdr.appendChild(document.createTextNode("⠿ 路由說明"));
        var routeTxt = domConstruct.create("div", null, routePanel);
        domClass.add(routeTxt, "ard-p-route-txt");
        routeTxt.appendChild(document.createTextNode("本案金額 NT$1,250,000 超過 100 萬，依規則觸發 3 層串簽。"));
        var flow = domConstruct.create("div", null, routePanel);
        domClass.add(flow, "ard-p-route-flow");

        var routeSteps = [
            { label: "申請人\n送審",   status: "completed" },
            { label: "直屬主管\n核准", status: "completed" },
            { label: "上一階\n核准",   status: "current"   },
            { label: "最終核准\n執行", status: "pending"   },
            { label: "外部\n簽署",    status: "pending"   }
        ];
        for (var fsi = 0; fsi < routeSteps.length; fsi++) {
            if (fsi > 0) {
                var arrow = domConstruct.create("div", null, flow);
                domClass.add(arrow, "ard-p-route-arrow");
                if (routeSteps[fsi - 1].status === "completed") { domClass.add(arrow, "done"); }
                arrow.appendChild(document.createTextNode("→"));
            }
            var box = domConstruct.create("div", null, flow);
            domClass.add(box, "ard-p-route-box");
            domClass.add(box, routeSteps[fsi].status);
            box.appendChild(document.createTextNode(routeSteps[fsi].label));
        }
    },

    propertyChanged: function () {},
    modelChanged:    function () {}
};
