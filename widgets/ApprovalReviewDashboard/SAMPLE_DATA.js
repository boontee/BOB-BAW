/**
 * ApprovalReviewDashboard — BAW Process Variable Instantiation
 *
 * Copy this script into a BAW Server-Side JavaScript (Script task) or
 * Pre-Execution service that runs BEFORE the coach containing the
 * ApprovalReviewDashboard widget.
 *
 * Data is taken directly from UMC/UI.jpeg:
 *   - Contract : 2026 年度軟體維護服務合約
 *   - Stage    : 簽核路由 (step 3, active)
 *   - Chain    : 3-layer serial — 王志明 ✓, 李雅婷 ⏳, 張文豪 ⬜
 *   - Status   : 串簽 Sequential · 2026-07-14 09:32 · AI 82/100
 *   - Audit    : 3 events (陳大明 送審, 王志明 核准, 系統 通知)
 *   - Action   : Layer-2 approver — 退回 / 轉派 / 核准 all enabled
 *   - Route    : NT$1,250,000 → 3-layer rule → DocuSign
 *
 * Assumes process variable:
 *   tw.local.dashboardData  (type: ApprovalReviewDashboard)
 */

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT
// ─────────────────────────────────────────────────────────────────────────────
tw.local.dashboardData = new tw.object.ApprovalReviewDashboard();
tw.local.dashboardData.contractTitle = "2026 年度軟體維護服務合約";


// ─────────────────────────────────────────────────────────────────────────────
//  PROGRESS  (簽核進度 — 4 stages, currently at stage index 1 "簽核路由")
// ─────────────────────────────────────────────────────────────────────────────
tw.local.dashboardData.progress = new tw.object.DashboardProgress();
tw.local.dashboardData.progress.currentStageIndex = 1;           // 0-based → 簽核路由
tw.local.dashboardData.progress.ctaLabel           = "已完成 → 外部簽署 →";
tw.local.dashboardData.progress.ctaAction          = "proceed_to_external_signing";

tw.local.dashboardData.progress.stages = new tw.object.listOf.DashboardStage();

var stage0 = new tw.object.DashboardStage();
stage0.label  = "起草送件";
stage0.status = "completed";
stage0.index  = 0;
tw.local.dashboardData.progress.stages[0] = stage0;

var stage1 = new tw.object.DashboardStage();
stage1.label  = "簽核路由";
stage1.status = "current";
stage1.index  = 1;
tw.local.dashboardData.progress.stages[1] = stage1;

var stage2 = new tw.object.DashboardStage();
stage2.label  = "外部查署";
stage2.status = "pending";
stage2.index  = 2;
tw.local.dashboardData.progress.stages[2] = stage2;

var stage3 = new tw.object.DashboardStage();
stage3.label  = "完成詳情";
stage3.status = "pending";
stage3.index  = 3;
tw.local.dashboardData.progress.stages[3] = stage3;


// ─────────────────────────────────────────────────────────────────────────────
//  APPROVAL CHAIN  (串簽流程（3 層）)
// ─────────────────────────────────────────────────────────────────────────────
tw.local.dashboardData.approvalChain = new tw.object.DashboardApprovalChain();
tw.local.dashboardData.approvalChain.title       = "串簽流程（3 層）";
tw.local.dashboardData.approvalChain.routeType   = "串簽";
tw.local.dashboardData.approvalChain.totalLayers = 3;

tw.local.dashboardData.approvalChain.approvers = new tw.object.listOf.DashboardApprover();

// Layer 1 — 王志明 · 已核准
var approver0 = new tw.object.DashboardApprover();
approver0.name          = "王志明";
approver0.avatarInitial = "王";
approver0.role          = "直屬主管";
approver0.department    = "採購部門";
approver0.status        = "approved";
approver0.layer         = 1;
approver0.canUrge       = false;
tw.local.dashboardData.approvalChain.approvers[0] = approver0;

// Layer 2 — 李雅婷 · 審核中  (催辦 button visible)
var approver1 = new tw.object.DashboardApprover();
approver1.name          = "李雅婷";
approver1.avatarInitial = "李";
approver1.role          = "上一層主管";
approver1.department    = "採購總監";
approver1.status        = "current";
approver1.layer         = 2;
approver1.canUrge       = true;
tw.local.dashboardData.approvalChain.approvers[1] = approver1;

// Layer 3 — 張文豪 · 待簽
var approver2 = new tw.object.DashboardApprover();
approver2.name          = "張文豪";
approver2.avatarInitial = "張";
approver2.role          = "最終核准";
approver2.department    = "副總經理";
approver2.status        = "pending";
approver2.layer         = 3;
approver2.canUrge       = false;
tw.local.dashboardData.approvalChain.approvers[2] = approver2;


// ─────────────────────────────────────────────────────────────────────────────
//  PROCESS STATUS  (流程狀態)
// ─────────────────────────────────────────────────────────────────────────────
tw.local.dashboardData.processStatus = new tw.object.DashboardProcessStatus();
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
tw.local.dashboardData.auditLog = new tw.object.DashboardAuditLog();
tw.local.dashboardData.auditLog.events = new tw.object.listOf.DashboardAuditEvent();

// Event 0 — 陳大明送審（gray, not highlighted）
var evt0 = new tw.object.DashboardAuditEvent();
evt0.timestamp     = "07-14 09:32";
evt0.actor         = "陳大明";
evt0.action        = "送審";
evt0.detail        = "陳大明送審，附 AI 報告";
evt0.isHighlighted = false;
tw.local.dashboardData.auditLog.events[0] = evt0;

// Event 1 — 王志明核准（gold highlight）
var evt1 = new tw.object.DashboardAuditEvent();
evt1.timestamp     = "07-14 11:05";
evt1.actor         = "王志明";
evt1.action        = "核准";
evt1.detail        = "王志明核准 — 「條款無誤，同意送上級」";
evt1.isHighlighted = true;
tw.local.dashboardData.auditLog.events[1] = evt1;

// Event 2 — 系統通知李雅婷待審（gray）
var evt2 = new tw.object.DashboardAuditEvent();
evt2.timestamp     = "07-14 11:05";
evt2.actor         = "系統";
evt2.action        = "通知";
evt2.detail        = "系統通知李雅婷待審";
evt2.isHighlighted = false;
tw.local.dashboardData.auditLog.events[2] = evt2;


// ─────────────────────────────────────────────────────────────────────────────
//  APPROVER ACTION PANEL  (待我審核 — right panel, current user is Layer 2)
// ─────────────────────────────────────────────────────────────────────────────
tw.local.dashboardData.approverAction = new tw.object.DashboardApproverAction();
tw.local.dashboardData.approverAction.title          = "待我審核";
tw.local.dashboardData.approverAction.contextMessage = "您目前為本案第 2 層審核人，請確認合約條款並做出決策。";
tw.local.dashboardData.approverAction.comment        = "";   // writable — synced via commentChanged event
tw.local.dashboardData.approverAction.decision       = "";   // writable — set when user clicks action button

tw.local.dashboardData.approverAction.actions = new tw.object.listOf.DashboardActionButton();

// Button 0 — 退回 (danger / red)
var btn0 = new tw.object.DashboardActionButton();
btn0.label     = "退回";
btn0.actionKey = "return";
btn0.style     = "danger";
btn0.enabled   = true;
tw.local.dashboardData.approverAction.actions[0] = btn0;

// Button 1 — 轉派 (secondary / grey)
var btn1 = new tw.object.DashboardActionButton();
btn1.label     = "轉派";
btn1.actionKey = "delegate";
btn1.style     = "secondary";
btn1.enabled   = true;
tw.local.dashboardData.approverAction.actions[1] = btn1;

// Button 2 — 核准 (primary / blue)
var btn2 = new tw.object.DashboardActionButton();
btn2.label     = "核准";
btn2.actionKey = "approve";
btn2.style     = "primary";
btn2.enabled   = true;
tw.local.dashboardData.approverAction.actions[2] = btn2;


// ─────────────────────────────────────────────────────────────────────────────
//  ROUTE EXPLANATION  (路由說明 — bottom-right panel)
// ─────────────────────────────────────────────────────────────────────────────
tw.local.dashboardData.routeExplanation = new tw.object.DashboardRouteExplanation();
tw.local.dashboardData.routeExplanation.explanationText =
    "本案金額 NT$1,250,000 超過 100 萬，依規則觸發 3 層串簽。" +
    "所有層級核准後，系統自動移交外部簽署（DocuSign）。";

tw.local.dashboardData.routeExplanation.steps = new tw.object.listOf.DashboardRouteStep();

// Step 0 — 申請人送審 (completed · green)
var step0 = new tw.object.DashboardRouteStep();
step0.label    = "申請人\n送審";
step0.sublabel = "";
step0.status   = "completed";
tw.local.dashboardData.routeExplanation.steps[0] = step0;

// Step 1 — 直屬主管核准 (completed · green)
var step1 = new tw.object.DashboardRouteStep();
step1.label    = "直屬主管\n核准";
step1.sublabel = "";
step1.status   = "completed";
tw.local.dashboardData.routeExplanation.steps[1] = step1;

// Step 2 — 上一階核准 (current · blue/teal — active in screenshot)
var step2 = new tw.object.DashboardRouteStep();
step2.label    = "上一階\n核准";
step2.sublabel = "";
step2.status   = "current";
tw.local.dashboardData.routeExplanation.steps[2] = step2;

// Step 3 — 最終核准執行 (pending · grey)
var step3 = new tw.object.DashboardRouteStep();
step3.label    = "最終核准\n執行";
step3.sublabel = "";
step3.status   = "pending";
tw.local.dashboardData.routeExplanation.steps[3] = step3;

// Step 4 — 外部簽署 (pending · grey)
var step4 = new tw.object.DashboardRouteStep();
step4.label    = "外部\n簽署";
step4.sublabel = "";
step4.status   = "pending";
tw.local.dashboardData.routeExplanation.steps[4] = step4;
