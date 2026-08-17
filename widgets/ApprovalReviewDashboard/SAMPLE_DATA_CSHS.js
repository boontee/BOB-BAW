/**
 * ApprovalReviewDashboard — CSHS Client-Side JavaScript
 *
 * WHERE TO PASTE THIS:
 *   Client-Side Human Service (CSHS) → Variables tab
 *   → Add a Script node BEFORE the Coach node
 *   → Open the Script node → paste the body below into the script editor
 *
 * CSHS JavaScript rules (different from server-side):
 *   ✅  Plain JavaScript objects  { key: value }
 *   ✅  tw.local.<variable>       to read/write process variables
 *   ✅  tw.local.<variable>.listAdd()  to append to a BAW list
 *   ❌  new tw.object.TypeName()  ← server-side ONLY, never in CSHS
 *   ❌  new tw.object.listOf.X()  ← server-side ONLY, never in CSHS
 *
 * PREREQUISITE:
 *   In the CSHS Variables tab declare:
 *     Name: dashboardData    Type: ApprovalReviewDashboard    Private: ✓
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
tw.local.dashboardData.contractTitle = "2026 年度軟體維護服務合約";


// ─────────────────────────────────────────────────────────────────────────────
//  PROGRESS  (簽核進度 — 4 stages, stage index 1 = 簽核路由 is active)
// ─────────────────────────────────────────────────────────────────────────────
tw.local.dashboardData.progress.currentStageIndex = 1;
tw.local.dashboardData.progress.ctaLabel           = "已完成 → 外部簽署 →";
tw.local.dashboardData.progress.ctaAction          = "proceed_to_external_signing";

// Stage 0 — 起草送件 (completed ✓)
tw.local.dashboardData.progress.stages.listAdd();
tw.local.dashboardData.progress.stages[0].label  = "起草送件";
tw.local.dashboardData.progress.stages[0].status = "completed";
tw.local.dashboardData.progress.stages[0].index  = 0;

// Stage 1 — 簽核路由 (current — active blue circle showing "3")
tw.local.dashboardData.progress.stages.listAdd();
tw.local.dashboardData.progress.stages[1].label  = "簽核路由";
tw.local.dashboardData.progress.stages[1].status = "current";
tw.local.dashboardData.progress.stages[1].index  = 1;

// Stage 2 — 外部查署 (pending)
tw.local.dashboardData.progress.stages.listAdd();
tw.local.dashboardData.progress.stages[2].label  = "外部查署";
tw.local.dashboardData.progress.stages[2].status = "pending";
tw.local.dashboardData.progress.stages[2].index  = 2;

// Stage 3 — 完成詳情 (pending)
tw.local.dashboardData.progress.stages.listAdd();
tw.local.dashboardData.progress.stages[3].label  = "完成詳情";
tw.local.dashboardData.progress.stages[3].status = "pending";
tw.local.dashboardData.progress.stages[3].index  = 3;


// ─────────────────────────────────────────────────────────────────────────────
//  APPROVAL CHAIN  (串簽流程（3 層）)
// ─────────────────────────────────────────────────────────────────────────────
tw.local.dashboardData.approvalChain.title       = "串簽流程（3 層）";
tw.local.dashboardData.approvalChain.routeType   = "串簽";
tw.local.dashboardData.approvalChain.totalLayers = 3;

// Layer 1 — 王志明 · 已核准 (green avatar, 已核准 badge)
tw.local.dashboardData.approvalChain.approvers.listAdd();
tw.local.dashboardData.approvalChain.approvers[0].name          = "王志明";
tw.local.dashboardData.approvalChain.approvers[0].avatarInitial = "王";
tw.local.dashboardData.approvalChain.approvers[0].role          = "直屬主管";
tw.local.dashboardData.approvalChain.approvers[0].department    = "採購部門";
tw.local.dashboardData.approvalChain.approvers[0].status        = "approved";
tw.local.dashboardData.approvalChain.approvers[0].layer         = 1;
tw.local.dashboardData.approvalChain.approvers[0].canUrge       = false;

// Layer 2 — 李雅婷 · 審核中 (blue avatar, 催辦 button + 審核中 badge)
tw.local.dashboardData.approvalChain.approvers.listAdd();
tw.local.dashboardData.approvalChain.approvers[1].name          = "李雅婷";
tw.local.dashboardData.approvalChain.approvers[1].avatarInitial = "李";
tw.local.dashboardData.approvalChain.approvers[1].role          = "上一層主管";
tw.local.dashboardData.approvalChain.approvers[1].department    = "採購總監";
tw.local.dashboardData.approvalChain.approvers[1].status        = "current";
tw.local.dashboardData.approvalChain.approvers[1].layer         = 2;
tw.local.dashboardData.approvalChain.approvers[1].canUrge       = true;   // ← 催辦 button visible

// Layer 3 — 張文豪 · 待簽 (grey avatar, 待簽 badge)
tw.local.dashboardData.approvalChain.approvers.listAdd();
tw.local.dashboardData.approvalChain.approvers[2].name          = "張文豪";
tw.local.dashboardData.approvalChain.approvers[2].avatarInitial = "張";
tw.local.dashboardData.approvalChain.approvers[2].role          = "最終核准";
tw.local.dashboardData.approvalChain.approvers[2].department    = "副總經理";
tw.local.dashboardData.approvalChain.approvers[2].status        = "pending";
tw.local.dashboardData.approvalChain.approvers[2].layer         = 3;
tw.local.dashboardData.approvalChain.approvers[2].canUrge       = false;


// ─────────────────────────────────────────────────────────────────────────────
//  PROCESS STATUS  (流程狀態)
// ─────────────────────────────────────────────────────────────────────────────
tw.local.dashboardData.processStatus.routeType            = "串簽 Sequential";
tw.local.dashboardData.processStatus.submittedAt          = "2026-07-14 09:32";
tw.local.dashboardData.processStatus.estimatedCompletion  = "2026-07-16";
tw.local.dashboardData.processStatus.aiScore              = 82;
tw.local.dashboardData.processStatus.aiMaxScore           = 100;
tw.local.dashboardData.processStatus.aiSuggestionLabel    = "建議修改";
tw.local.dashboardData.processStatus.aiSuggestionAction   = "view_ai_report";


// ─────────────────────────────────────────────────────────────────────────────
//  AUDIT LOG  (審核歷程 — 3 events visible in screenshot)
// ─────────────────────────────────────────────────────────────────────────────

// Event 0 — 陳大明送審 (grey, not highlighted)
tw.local.dashboardData.auditLog.events.listAdd();
tw.local.dashboardData.auditLog.events[0].timestamp     = "07-14 09:32";
tw.local.dashboardData.auditLog.events[0].actor         = "陳大明";
tw.local.dashboardData.auditLog.events[0].action        = "送審";
tw.local.dashboardData.auditLog.events[0].detail        = "陳大明送審，附 AI 報告";
tw.local.dashboardData.auditLog.events[0].isHighlighted = false;

// Event 1 — 王志明核准 (gold highlighted row)
tw.local.dashboardData.auditLog.events.listAdd();
tw.local.dashboardData.auditLog.events[1].timestamp     = "07-14 11:05";
tw.local.dashboardData.auditLog.events[1].actor         = "王志明";
tw.local.dashboardData.auditLog.events[1].action        = "核准";
tw.local.dashboardData.auditLog.events[1].detail        = "王志明核准 — 「條款無誤，同意送上級」";
tw.local.dashboardData.auditLog.events[1].isHighlighted = true;

// Event 2 — 系統通知李雅婷待審 (grey, not highlighted)
tw.local.dashboardData.auditLog.events.listAdd();
tw.local.dashboardData.auditLog.events[2].timestamp     = "07-14 11:05";
tw.local.dashboardData.auditLog.events[2].actor         = "系統";
tw.local.dashboardData.auditLog.events[2].action        = "通知";
tw.local.dashboardData.auditLog.events[2].detail        = "系統通知李雅婷待審";
tw.local.dashboardData.auditLog.events[2].isHighlighted = false;


// ─────────────────────────────────────────────────────────────────────────────
//  APPROVER ACTION PANEL  (待我審核 — right panel, current user = Layer 2)
// ─────────────────────────────────────────────────────────────────────────────
tw.local.dashboardData.approverAction.title          = "待我審核";
tw.local.dashboardData.approverAction.contextMessage = "您目前為本案第 2 層審核人，請確認合約條款並做出決策。";
tw.local.dashboardData.approverAction.comment        = "";  // writable — updated via commentChanged event
tw.local.dashboardData.approverAction.decision       = "";  // writable — set when user clicks action button

// Button 0 — 退回 (danger / red)
tw.local.dashboardData.approverAction.actions.listAdd();
tw.local.dashboardData.approverAction.actions[0].label     = "退回";
tw.local.dashboardData.approverAction.actions[0].actionKey = "return";
tw.local.dashboardData.approverAction.actions[0].style     = "danger";
tw.local.dashboardData.approverAction.actions[0].enabled   = true;

// Button 1 — 轉派 (secondary / grey)
tw.local.dashboardData.approverAction.actions.listAdd();
tw.local.dashboardData.approverAction.actions[1].label     = "轉派";
tw.local.dashboardData.approverAction.actions[1].actionKey = "delegate";
tw.local.dashboardData.approverAction.actions[1].style     = "secondary";
tw.local.dashboardData.approverAction.actions[1].enabled   = true;

// Button 2 — 核准 (primary / blue)
tw.local.dashboardData.approverAction.actions.listAdd();
tw.local.dashboardData.approverAction.actions[2].label     = "核准";
tw.local.dashboardData.approverAction.actions[2].actionKey = "approve";
tw.local.dashboardData.approverAction.actions[2].style     = "primary";
tw.local.dashboardData.approverAction.actions[2].enabled   = true;


// ─────────────────────────────────────────────────────────────────────────────
//  ROUTE EXPLANATION  (路由說明 — bottom-right panel + flow diagram)
// ─────────────────────────────────────────────────────────────────────────────
tw.local.dashboardData.routeExplanation.explanationText =
    "本案金額 NT$1,250,000 超過 100 萬，依規則觸發 3 層串簽。" +
    "所有層級核准後，系統自動移交外部簽署（DocuSign）。";

// Step 0 — 申請人送審 (completed · green box)
tw.local.dashboardData.routeExplanation.steps.listAdd();
tw.local.dashboardData.routeExplanation.steps[0].label    = "申請人\n送審";
tw.local.dashboardData.routeExplanation.steps[0].sublabel = "";
tw.local.dashboardData.routeExplanation.steps[0].status   = "completed";

// Step 1 — 直屬主管核准 (completed · green box)
tw.local.dashboardData.routeExplanation.steps.listAdd();
tw.local.dashboardData.routeExplanation.steps[1].label    = "直屬主管\n核准";
tw.local.dashboardData.routeExplanation.steps[1].sublabel = "";
tw.local.dashboardData.routeExplanation.steps[1].status   = "completed";

// Step 2 — 上一階核准 (current · teal/blue box — active in screenshot)
tw.local.dashboardData.routeExplanation.steps.listAdd();
tw.local.dashboardData.routeExplanation.steps[2].label    = "上一階\n核准";
tw.local.dashboardData.routeExplanation.steps[2].sublabel = "";
tw.local.dashboardData.routeExplanation.steps[2].status   = "current";

// Step 3 — 最終核准執行 (pending · grey box)
tw.local.dashboardData.routeExplanation.steps.listAdd();
tw.local.dashboardData.routeExplanation.steps[3].label    = "最終核准\n執行";
tw.local.dashboardData.routeExplanation.steps[3].sublabel = "";
tw.local.dashboardData.routeExplanation.steps[3].status   = "pending";

// Step 4 — 外部簽署 (pending · grey box)
tw.local.dashboardData.routeExplanation.steps.listAdd();
tw.local.dashboardData.routeExplanation.steps[4].label    = "外部\n簽署";
tw.local.dashboardData.routeExplanation.steps[4].sublabel = "";
tw.local.dashboardData.routeExplanation.steps[4].status   = "pending";
