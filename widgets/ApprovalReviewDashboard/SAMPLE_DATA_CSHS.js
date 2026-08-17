/**
 * ApprovalReviewDashboard — CSHS Client-Side JavaScript
 *
 * WHERE TO PASTE THIS:
 *   Client-Side Human Service (CSHS) → drag a Script node BEFORE the Coach node
 *   → open the Script node → paste the body below into the script editor
 *
 * CSHS object/list instantiation syntax used here:
 *   {}   creates a new BAW Business Object instance
 *   []   creates a new BAW list (array) of BO instances
 *
 * PREREQUISITE — declare this variable in the CSHS Variables tab:
 *   Name: dashboardData    Type: ApprovalReviewDashboard    Private: ✓
 *
 * Data mapped exactly from UMC/UI.jpeg:
 *   Contract : 2026 年度軟體維護服務合約
 *   Stage    : 簽核路由 (index 1, active)
 *   Chain    : 3-layer serial — 王志明 ✓  李雅婷 ⏳  張文豪 ⬜
 *   Status   : 串簽 Sequential · 2026-07-14 09:32 · AI 82/100
 *   Audit    : 3 events (陳大明 送審, 王志明 核准★, 系統 通知)
 *   Action   : Layer-2 current approver — 退回 / 轉派 / 核准 all enabled
 *   Route    : NT$1,250,000 → 3-layer trigger → DocuSign
 */

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT
// ─────────────────────────────────────────────────────────────────────────────
tw.local.dashboardData = {

    contractTitle: "2026 年度軟體維護服務合約",


    // ─────────────────────────────────────────────────────────────────────────
    //  PROGRESS  (簽核進度 — 4 stages, index 1 = 簽核路由 is active)
    // ─────────────────────────────────────────────────────────────────────────
    progress: {
        currentStageIndex: 1,
        ctaLabel:          "已完成 → 外部簽署 →",
        ctaAction:         "proceed_to_external_signing",

        stages: [
            // Stage 0 — 起草送件 (completed ✓ green circle with checkmark)
            { label: "起草送件", status: "completed", index: 0 },

            // Stage 1 — 簽核路由 (current — active blue circle showing "3")
            { label: "簽核路由", status: "current",   index: 1 },

            // Stage 2 — 外部查署 (pending)
            { label: "外部查署", status: "pending",   index: 2 },

            // Stage 3 — 完成詳情 (pending)
            { label: "完成詳情", status: "pending",   index: 3 }
        ]
    },


    // ─────────────────────────────────────────────────────────────────────────
    //  APPROVAL CHAIN  (串簽流程（3 層）)
    // ─────────────────────────────────────────────────────────────────────────
    approvalChain: {
        title:       "串簽流程（3 層）",
        routeType:   "串簽",
        totalLayers: 3,

        approvers: [
            // Layer 1 — 王志明 · 已核准 (green avatar, 已核准 badge)
            {
                name:          "王志明",
                avatarInitial: "王",
                role:          "直屬主管",
                department:    "採購部門",
                status:        "approved",
                layer:         1,
                canUrge:       false
            },

            // Layer 2 — 李雅婷 · 審核中 (blue avatar, 催辦 button + 審核中 badge)
            {
                name:          "李雅婷",
                avatarInitial: "李",
                role:          "上一層主管",
                department:    "採購總監",
                status:        "current",
                layer:         2,
                canUrge:       true       // ← 催辦 button visible
            },

            // Layer 3 — 張文豪 · 待簽 (grey avatar, 待簽 badge)
            {
                name:          "張文豪",
                avatarInitial: "張",
                role:          "最終核准",
                department:    "副總經理",
                status:        "pending",
                layer:         3,
                canUrge:       false
            }
        ]
    },


    // ─────────────────────────────────────────────────────────────────────────
    //  PROCESS STATUS  (流程狀態)
    // ─────────────────────────────────────────────────────────────────────────
    processStatus: {
        routeType:            "串簽 Sequential",
        submittedAt:          "2026-07-14 09:32",
        estimatedCompletion:  "2026-07-16",
        aiScore:              82,
        aiMaxScore:           100,
        aiSuggestionLabel:    "建議修改",
        aiSuggestionAction:   "view_ai_report"
    },


    // ─────────────────────────────────────────────────────────────────────────
    //  AUDIT LOG  (審核歷程 — 3 events visible in screenshot)
    // ─────────────────────────────────────────────────────────────────────────
    auditLog: {
        events: [
            // Event 0 — 陳大明送審 (grey, not highlighted)
            {
                timestamp:     "07-14 09:32",
                actor:         "陳大明",
                action:        "送審",
                detail:        "陳大明送審，附 AI 報告",
                isHighlighted: false
            },

            // Event 1 — 王志明核准 (gold highlighted row)
            {
                timestamp:     "07-14 11:05",
                actor:         "王志明",
                action:        "核准",
                detail:        "王志明核准 — 「條款無誤，同意送上級」",
                isHighlighted: true
            },

            // Event 2 — 系統通知李雅婷待審 (grey, not highlighted)
            {
                timestamp:     "07-14 11:05",
                actor:         "系統",
                action:        "通知",
                detail:        "系統通知李雅婷待審",
                isHighlighted: false
            }
        ]
    },


    // ─────────────────────────────────────────────────────────────────────────
    //  APPROVER ACTION PANEL  (待我審核 — right panel, current user = Layer 2)
    // ─────────────────────────────────────────────────────────────────────────
    approverAction: {
        title:          "待我審核",
        contextMessage: "您目前為本案第 2 層審核人，請確認合約條款並做出決策。",
        comment:        "",   // writable — updated via commentChanged event
        decision:       "",   // writable — set when user clicks an action button

        actions: [
            // Button 0 — 退回 (danger · red)
            { label: "退回", actionKey: "return",   style: "danger",    enabled: true },

            // Button 1 — 轉派 (secondary · grey)
            { label: "轉派", actionKey: "delegate", style: "secondary", enabled: true },

            // Button 2 — 核准 (primary · blue)
            { label: "核准", actionKey: "approve",  style: "primary",   enabled: true }
        ]
    },


    // ─────────────────────────────────────────────────────────────────────────
    //  ROUTE EXPLANATION  (路由說明 — bottom-right panel + flow diagram)
    // ─────────────────────────────────────────────────────────────────────────
    routeExplanation: {
        explanationText:
            "本案金額 NT$1,250,000 超過 100 萬，依規則觸發 3 層串簽。" +
            "所有層級核准後，系統自動移交外部簽署（DocuSign）。",

        steps: [
            // Step 0 — 申請人送審 (completed · green box)
            { label: "申請人\n送審",   sublabel: "", status: "completed" },

            // Step 1 — 直屬主管核准 (completed · green box)
            { label: "直屬主管\n核准", sublabel: "", status: "completed" },

            // Step 2 — 上一階核准 (current · teal box — active in screenshot)
            { label: "上一階\n核准",   sublabel: "", status: "current"   },

            // Step 3 — 最終核准執行 (pending · grey box)
            { label: "最終核准\n執行", sublabel: "", status: "pending"   },

            // Step 4 — 外部簽署 (pending · grey box)
            { label: "外部\n簽署",     sublabel: "", status: "pending"   }
        ]
    }

};
