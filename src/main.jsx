import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import MarkdownPreview from "@uiw/react-markdown-preview";
import "@uiw/react-markdown-preview/markdown.css";
import { ArrowRight, Bold, Check, Circle, Clock3, Italic, Search, Ticket as TicketIcon, Underline as UnderlineIcon, UserRound } from "lucide-react";
import TurndownService from "turndown";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import "./styles.css";

const STORAGE_KEY = "ma-react-workflow-demo";
const turndownService = new TurndownService({
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  headingStyle: "atx",
});
turndownService.addRule("underline", {
  filter: ["u"],
  replacement: (content) => `<u>${content}</u>`,
});

const statuses = {
  new: { label: "Submitted", owner: "Service Desk", tone: "warn" },
  triage: { label: "Triaged", owner: "System Owner", tone: "warn" },
  approved: { label: "Approved", owner: "Developer", tone: "" },
  inDevelopment: { label: "In Development", owner: "Developer", tone: "" },
  readyQa: { label: "Ready for QA", owner: "QA", tone: "warn" },
  qaFailed: { label: "QA Not Pass", owner: "Developer", tone: "danger" },
  qaPassed: { label: "QA Passed", owner: "Service Desk", tone: "" },
  waitingUat: { label: "Waiting Client UAT", owner: "Client", tone: "warn" },
  uatFailed: { label: "UAT Not Pass", owner: "Developer", tone: "danger" },
  uatPassed: { label: "UAT Passed", owner: "System Owner", tone: "" },
  readyDeploy: { label: "Ready to Deploy", owner: "Developer", tone: "warn" },
  deployed: { label: "Deployed", owner: "Service Desk", tone: "" },
  closed: { label: "Closed", owner: "Done", tone: "" },
};

const actionsByStatus = {
  new: [{ label: "Triage ticket", to: "triage", actor: "Service Desk", note: "Service Desk reviewed the submitted issue." }],
  triage: [{ label: "Approve request", to: "approved", actor: "System Owner", note: "System Owner approved impact and effort." }],
  approved: [{ label: "Start development", to: "inDevelopment", actor: "Developer", note: "Developer started fix/build." }],
  inDevelopment: [{ label: "Send to QA", to: "readyQa", actor: "Developer", note: "Fix completed and deployed to staging." }],
  readyQa: [
    { label: "QA Pass", to: "qaPassed", actor: "QA", note: "QA passed SIT/regression testing." },
    { label: "QA Not Pass", to: "qaFailed", actor: "QA", note: "QA found an issue and returned the ticket to development.", danger: true },
  ],
  qaFailed: [{ label: "Fix and send back to QA", to: "readyQa", actor: "Developer", note: "Developer fixed QA issue and redeployed staging." }],
  qaPassed: [{ label: "Send to client UAT", to: "waitingUat", actor: "Service Desk", note: "Service Desk notified client for UAT confirmation." }],
  waitingUat: [
    { label: "UAT Pass", to: "uatPassed", actor: "Client", note: "Client confirmed UAT passed." },
    { label: "UAT Not Pass", to: "uatFailed", actor: "Client", note: "Client reported UAT did not pass.", danger: true },
  ],
  uatFailed: [{ label: "Fix and send to QA", to: "readyQa", actor: "Developer", note: "Developer fixed UAT issue and sent back to QA." }],
  uatPassed: [{ label: "Approve production deploy", to: "readyDeploy", actor: "System Owner", note: "System Owner approved production deployment." }],
  readyDeploy: [{ label: "Deploy production", to: "deployed", actor: "Developer", note: "Developer deployed to production." }],
  deployed: [{ label: "Close and report to client", to: "closed", actor: "Service Desk", note: "Service Desk sent report and closed the ticket." }],
};

const workflowSteps = [
  { label: "Submit", statuses: ["new"] },
  { label: "Triage", statuses: ["triage"] },
  { label: "Approve", statuses: ["approved"] },
  { label: "Build", statuses: ["inDevelopment", "qaFailed", "uatFailed"] },
  { label: "QA", statuses: ["readyQa", "qaPassed"] },
  { label: "UAT", statuses: ["waitingUat", "uatPassed"] },
  { label: "Deploy", statuses: ["readyDeploy", "deployed"] },
  { label: "Close", statuses: ["closed"] },
];

const seedAccounts = [
  {
    id: "CA-001",
    name: "EGAT Operations",
    email: "ops@egat.example",
    projects: ["EGAT Portal", "EGAT Data Platform"],
    active: true,
    createdAt: "2026-06-01 09:00",
  },
  {
    id: "CA-002",
    name: "EGAT Planning",
    email: "planning@egat.example",
    projects: ["EGAT Mobile"],
    active: true,
    createdAt: "2026-06-01 09:10",
  },
  {
    id: "CA-003",
    name: "EGAT Control Room",
    email: "control-room@egat.example",
    projects: ["EGAT Data Platform"],
    active: true,
    createdAt: "2026-06-01 09:20",
  },
];

const seedTickets = [
  seedTicket({
    id: "MA-2026-001",
    clientAccountId: "CA-001",
    clientName: "EGAT Operations",
    clientEmail: "ops@egat.example",
    project: "EGAT Portal",
    title: "Cannot export monthly availability report",
    descriptionMarkdown:
      "The client portal times out when exporting the **monthly availability report**.\n\n- Happens for May report\n- Export does not complete",
    status: "readyQa",
    createdAt: "2026-06-05 09:20",
    updatedAt: "2026-06-09 16:30",
    history: [
      ["Submitted", "Client submitted ticket.", "Client", "2026-06-05 09:20"],
      ["Triaged", "Service Desk reviewed the submitted issue.", "Service Desk", "2026-06-05 10:10"],
      ["Approved", "System Owner approved impact and effort.", "System Owner", "2026-06-05 14:00"],
      ["In Development", "Developer started fix/build.", "Developer", "2026-06-06 09:15"],
      ["Ready for QA", "Fix deployed to staging.", "Developer", "2026-06-09 16:30"],
    ],
  }),
  seedTicket({
    id: "MA-2026-002",
    clientAccountId: "CA-003",
    clientName: "EGAT Control Room",
    clientEmail: "control-room@egat.example",
    project: "EGAT Data Platform",
    title: "Wrong plant code shown in incident dashboard",
    descriptionMarkdown:
      "Dashboard maps two plant codes incorrectly after master data import.\n\nExpected result: plant code should match the latest master data.",
    status: "waitingUat",
    createdAt: "2026-06-04 11:45",
    updatedAt: "2026-06-08 15:15",
    history: [
      ["Submitted", "Client submitted ticket.", "Client", "2026-06-04 11:45"],
      ["Triaged", "Service Desk classified the issue.", "Service Desk", "2026-06-04 13:00"],
      ["Approved", "System Owner approved correction work.", "System Owner", "2026-06-04 16:00"],
      ["In Development", "Developer corrected mapping validation.", "Developer", "2026-06-05 10:00"],
      ["Ready for QA", "Ticket sent to QA.", "Developer", "2026-06-07 17:10"],
      ["QA Passed", "QA passed SIT/regression testing.", "QA", "2026-06-08 14:20"],
      ["Waiting Client UAT", "Client notified for UAT confirmation.", "Service Desk", "2026-06-08 15:15"],
    ],
  }),
  seedTicket({
    id: "MA-2026-003",
    clientAccountId: "CA-002",
    clientName: "EGAT Planning",
    clientEmail: "planning@egat.example",
    project: "EGAT Mobile",
    title: "Add approval remark to outage request screen",
    descriptionMarkdown:
      "Client asks to capture approval remark when confirming planned outage requests.\n\n> This is needed for internal approval evidence.",
    status: "triage",
    createdAt: "2026-06-10 08:45",
    updatedAt: "2026-06-10 09:10",
    history: [
      ["Submitted", "Client submitted ticket.", "Client", "2026-06-10 08:45"],
      ["Triaged", "Service Desk reviewed the submitted issue.", "Service Desk", "2026-06-10 09:10"],
    ],
  }),
];

function seedTicket(ticket) {
  return {
    ...ticket,
    notes: [],
    history: ticket.history.map(([status, message, actor, createdAt]) => ({ status, message, actor, createdAt })),
  };
}

function App() {
  const [route, setRoute] = useState(getRoute());
  const [tickets, setTickets] = useState(loadTickets);
  const [accounts, setAccounts] = useState(loadAccounts);
  const [selectedTicketId, setSelectedTicketId] = useState(() => tickets[0]?.id || "");
  const [resetToken, setResetToken] = useState(0);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tickets, accounts }));
  }, [tickets, accounts]);

  function navigate(path) {
    window.history.pushState({}, "", path);
    setRoute(getRoute());
  }

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => setToast(""), 2200);
  }

  function resetDemo() {
    const resetTickets = cloneSeeds(seedTickets);
    setTickets(resetTickets);
    setAccounts(cloneSeeds(seedAccounts));
    setSelectedTicketId(resetTickets[0]?.id || "");
    setResetToken((current) => current + 1);
    showToast("Demo reset.");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Maintenance Agreement POC</p>
            <h1 className="text-2xl font-semibold tracking-tight">Ticket Management Demo</h1>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Main navigation">
            <NavButton active={route === "/send-ticket"} onClick={() => navigate("/send-ticket")}>Send Ticket</NavButton>
            <NavButton active={route === "/track-issue"} onClick={() => navigate("/track-issue")}>Track Issue</NavButton>
            <NavButton active={route === "/admin"} onClick={() => navigate("/admin")}>Admin Page</NavButton>
            <NavButton active={route === "/accounts"} onClick={() => navigate("/accounts")}>Client Accounts</NavButton>
            <Button variant="outline" onClick={resetDemo}>Reset demo</Button>
          </nav>
        </div>
      </header>

      {route === "/admin" ? (
        <AdminPage
          key={`admin-${resetToken}`}
          tickets={tickets}
          selectedTicketId={selectedTicketId}
          setSelectedTicketId={setSelectedTicketId}
          setTickets={setTickets}
          showToast={showToast}
        />
      ) : route === "/accounts" ? (
        <ClientAccountsPage key={`accounts-${resetToken}`} accounts={accounts} setAccounts={setAccounts} showToast={showToast} />
      ) : route === "/track-issue" ? (
        <TrackIssuePage key={`track-${resetToken}`} tickets={tickets} setTickets={setTickets} showToast={showToast} />
      ) : (
        <SendTicketPage
          key={`send-${resetToken}`}
          tickets={tickets}
          accounts={accounts}
          setTickets={setTickets}
          setSelectedTicketId={setSelectedTicketId}
          showToast={showToast}
          navigate={navigate}
        />
      )}

      <div className={cn("fixed bottom-5 right-5 z-50 rounded-md bg-foreground px-4 py-3 text-sm text-background shadow-lg transition-all", toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}

function NavButton({ active, children, ...props }) {
  return (
    <Button variant={active ? "secondary" : "outline"} className={cn(active && "border-primary/30 bg-primary/10 text-primary")} {...props}>
      {children}
    </Button>
  );
}

function PageHeader({ eyebrow, title, description, centered = false }) {
  return (
    <section className={cn("flex flex-col gap-3 md:flex-row md:items-end md:justify-between", centered && "mx-auto w-full max-w-3xl")}>
      <div>
        <p className="text-xs font-medium uppercase text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      {description && <p className="max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>}
    </section>
  );
}

function FormField({ label, children }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon = Circle, title, description, action }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-full border bg-background">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="grid gap-1">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <Card className="shadow-none">
      <CardContent className="grid gap-1 p-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function TicketProgress({ status }) {
  const activeIndex = Math.max(
    0,
    workflowSteps.findIndex((step) => step.statuses.includes(status)),
  );

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span>Workflow progress</span>
        <span>{workflowSteps[activeIndex]?.label || "Submit"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {workflowSteps.map((step, index) => {
          const complete = index < activeIndex || status === "closed";
          const active = index === activeIndex && status !== "closed";

          return (
            <div
              key={step.label}
              className={cn(
                "flex min-w-24 items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground",
                complete && "bg-foreground text-background",
                active && "border-foreground text-foreground ring-2 ring-foreground/10",
              )}
            >
              {complete ? <Check className="size-3.5" aria-hidden="true" /> : <Circle className={cn("size-3.5", active && "fill-foreground")} aria-hidden="true" />}
              <span className="whitespace-nowrap">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SendTicketPage({ tickets, accounts, setTickets, setSelectedTicketId, showToast, navigate }) {
  const activeAccounts = accounts.filter((account) => account.active);
  const [createdTicketId, setCreatedTicketId] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState(activeAccounts[0]?.id || "");
  const [selectedProject, setSelectedProject] = useState(activeAccounts[0]?.projects[0] || "");
  const [descriptionMarkdown, setDescriptionMarkdown] = useState("");
  const selectedAccount = activeAccounts.find((account) => account.id === selectedAccountId) || activeAccounts[0];

  useEffect(() => {
    if (!selectedAccount && activeAccounts[0]) {
      setSelectedAccountId(activeAccounts[0].id);
      setSelectedProject(activeAccounts[0].projects[0] || "");
      return;
    }

    if (selectedAccount && !selectedAccount.projects.includes(selectedProject)) {
      setSelectedProject(selectedAccount.projects[0] || "");
    }
  }, [activeAccounts, selectedAccount, selectedProject]);

  function submitTicket(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const createdAt = now();
    const account = activeAccounts.find((item) => item.id === selectedAccountId);

    if (!account) {
      showToast("Select a client account first.");
      return;
    }

    if (!descriptionMarkdown.trim()) {
      showToast("Description is required.");
      return;
    }

    const ticket = {
      id: nextId(tickets),
      clientAccountId: account.id,
      clientName: account.name,
      clientEmail: account.email,
      project: selectedProject || account.projects[0] || "Unassigned Project",
      title: String(form.get("title") || "").trim(),
      descriptionMarkdown: descriptionMarkdown.trim(),
      status: "new",
      createdAt,
      updatedAt: createdAt,
      notes: [],
      history: [{ status: "Submitted", message: "Client submitted ticket.", actor: account.name, createdAt }],
    };

    setTickets((current) => [ticket, ...current]);
    setSelectedTicketId(ticket.id);
    setCreatedTicketId(ticket.id);
    setDescriptionMarkdown("");
    event.currentTarget.reset();
    showToast(`${ticket.id} submitted.`);
  }

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        centered
        eyebrow="User UI"
        title="Send ticket"
        description="Open a maintenance ticket with the account and project already provided by back office."
      />
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TicketIcon className="size-5" aria-hidden="true" />
            Ticket information
          </CardTitle>
          <CardDescription>Keep it simple: title, description, and the project affected.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={submitTicket}>
            {activeAccounts.length ? (
              <>
                <FormField label="Client account">
                  <Select value={selectedAccount?.id || ""} onValueChange={setSelectedAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client account" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} - {account.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Project">
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedAccount?.projects || []).map((project) => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                {selectedAccount && (
                  <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
                        <UserRound className="size-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedAccount.name}</p>
                        <p className="text-muted-foreground">{selectedAccount.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedAccount.projects.map((project) => (
                        <Badge key={project} variant={project === selectedProject ? "default" : "outline"}>
                          {project}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={UserRound}
                title="No active client accounts"
                description="Create one in Client Accounts before opening tickets."
                action={<Button variant="outline" type="button" onClick={() => navigate("/accounts")}>Go to Client Accounts</Button>}
              />
            )}
            <FormField label="Issue title">
              <Input name="title" required placeholder="Cannot export report" />
            </FormField>
            <MarkdownEditor value={descriptionMarkdown} onChange={setDescriptionMarkdown} />
            <Button type="submit" disabled={!activeAccounts.length}>
              Submit ticket
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            {createdTicketId && (
              <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
                    <Check className="size-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium">Ticket submitted</p>
                    <p className="text-muted-foreground">Your ticket number is <span className="font-mono text-foreground">{createdTicketId}</span>.</p>
                  </div>
                </div>
                <Button variant="outline" type="button" onClick={() => navigate(`/track-issue?ticket=${createdTicketId}`)}>
                  Track this ticket
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function TrackIssuePage({ tickets, setTickets, showToast }) {
  const initialTicketNumber = new URLSearchParams(window.location.search).get("ticket")?.trim().toUpperCase() || "";
  const [trackingNumber, setTrackingNumber] = useState(initialTicketNumber);
  const [trackedTicketId, setTrackedTicketId] = useState(initialTicketNumber);
  const [comment, setComment] = useState("");
  const trackedTicket = tickets.find((ticket) => ticket.id.toUpperCase() === trackedTicketId);
  const demoTickets = tickets.slice(0, 3);

  function trackTicket(event) {
    event.preventDefault();
    setTrackedTicketId(trackingNumber.trim().toUpperCase());
    setComment("");
  }

  function addUserComment(event) {
    event.preventDefault();
    const trimmed = comment.trim();
    if (!trackedTicket || !trimmed) return;

    setTickets((current) =>
      current.map((ticket) => {
        if (ticket.id !== trackedTicket.id) return ticket;
        const updatedAt = now();
        return {
          ...ticket,
          updatedAt,
          notes: [...(ticket.notes || []), { status: "User Comment", message: trimmed, actor: "User", createdAt: updatedAt }],
        };
      }),
    );
    setComment("");
    showToast("Comment added.");
  }

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader centered eyebrow="User UI" title="Track issue" description="Check status, read the latest update, and add a comment when more detail is needed." />
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" aria-hidden="true" />
            Track by ticket number
          </CardTitle>
          <CardDescription>Enter the ticket number shared after submission.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <form className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end" onSubmit={trackTicket}>
            <FormField label="Ticket number">
              <Input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Example: MA-2026-001" />
            </FormField>
            <Button type="submit">
              Track
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </form>
          {demoTickets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Demo tickets</span>
              {demoTickets.map((ticket) => (
                <Button
                  key={ticket.id}
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setTrackingNumber(ticket.id);
                    setTrackedTicketId(ticket.id);
                    setComment("");
                  }}
                >
                  {ticket.id}
                </Button>
              ))}
            </div>
          )}
          <TrackResult ticket={trackedTicket} hasSearched={Boolean(trackedTicketId)} />
          {trackedTicket && (
            <>
              <Separator />
              <form className="grid gap-3" onSubmit={addUserComment}>
                <div>
                  <h4 className="text-sm font-medium">Add comment</h4>
                  <p className="text-sm text-muted-foreground">Use this when you need to clarify or ask for an update.</p>
                </div>
                <FormField label="Comment">
                  <Textarea value={comment} onChange={(event) => setComment(event.target.value)} rows="3" placeholder="Add more detail or ask for update" />
                </FormField>
                <Button variant="outline" type="submit">Add comment</Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function TrackResult({ ticket, hasSearched }) {
  if (!hasSearched) {
    return <EmptyState icon={Search} title="Search a ticket" description="Insert a ticket number to see current owner, status, and latest update." />;
  }

  if (!ticket) {
    return <EmptyState icon={TicketIcon} title="Ticket not found" description="Check the ticket number format and try again." />;
  }

  const status = statuses[ticket.status];
  const notes = ticket.notes || [];
  const latest = [...ticket.history, ...notes].at(-1);

  return (
    <Card className="bg-muted/20 shadow-none">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{ticket.id}</p>
            <CardTitle className="mt-2 text-base">{ticket.title}</CardTitle>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <TicketProgress status={ticket.status} />
        <div className="grid gap-3 sm:grid-cols-3">
          <MetaBox label="Project" value={ticket.project} />
          <MetaBox label="Current owner" value={status.owner} />
          <MetaBox label="Updated" value={ticket.updatedAt} />
        </div>
        <div className="rounded-lg border bg-background p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Last update</p>
          <p className="mt-2">{latest?.message || "Ticket submitted."}</p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">Description</p>
          <MarkdownContent markdown={getDescriptionMarkdown(ticket)} />
        </div>
        {notes.length > 0 && (
          <div className="grid gap-2 rounded-lg border bg-background p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">Comments / notes</p>
            {notes.map((note, index) => (
              <div key={`${note.createdAt}-${index}`} className="rounded-md bg-muted/50 p-3">
                <p className="font-medium">{note.actor || "Admin"}</p>
                <p className="text-muted-foreground">{note.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{note.createdAt}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminPage({ tickets, selectedTicketId, setSelectedTicketId, setTickets, showToast }) {
  const projects = useMemo(() => ["All Projects", ...Array.from(new Set(tickets.map((ticket) => ticket.project))).sort()], [tickets]);
  const [projectFilter, setProjectFilter] = useState("All Projects");
  const filteredTickets = projectFilter === "All Projects" ? tickets : tickets.filter((ticket) => ticket.project === projectFilter);
  const selectedTicket = filteredTickets.find((ticket) => ticket.id === selectedTicketId) || filteredTickets[0];
  const stats = useMemo(
    () => [
      { label: "Total", value: tickets.length, hint: "All tickets" },
      { label: "Open", value: tickets.filter((ticket) => ticket.status !== "closed").length, hint: "Needs action" },
      { label: "Waiting client", value: tickets.filter((ticket) => ticket.status === "waitingUat").length, hint: "UAT confirmation" },
      { label: "Closed", value: tickets.filter((ticket) => ticket.status === "closed").length, hint: "Completed" },
    ],
    [tickets],
  );

  useEffect(() => {
    if (selectedTicket && selectedTicket.id !== selectedTicketId) {
      setSelectedTicketId(selectedTicket.id);
    }
  }, [selectedTicket, selectedTicketId, setSelectedTicketId]);

  function moveWorkflow(ticketId, actionIndex) {
    const ticket = tickets.find((item) => item.id === ticketId);
    const action = (actionsByStatus[ticket?.status] || [])[Number(actionIndex)];
    if (!ticket || !action) return;

    setTickets((current) =>
      current.map((item) => {
        if (item.id !== ticketId) return item;
        const updatedAt = now();
        return {
          ...item,
          status: action.to,
          updatedAt,
          history: [...item.history, { status: statuses[action.to].label, message: action.note, actor: action.actor, createdAt: updatedAt }],
        };
      }),
    );
    showToast(`${ticket.id}: ${statuses[action.to].label}`);
  }

  function addNote(ticketId, message) {
    const trimmed = message.trim();
    if (!trimmed) return;

    setTickets((current) =>
      current.map((item) => {
        if (item.id !== ticketId) return item;
        const updatedAt = now();
        return {
          ...item,
          updatedAt,
          notes: [...(item.notes || []), { status: "Admin Note", message: trimmed, actor: "Admin", createdAt: updatedAt }],
        };
      }),
    );
    showToast("Note added.");
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Admin Back Office UI" title="Manage tickets by project" description="Review incoming tickets, move workflow status, and keep client-facing notes up to date." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="flex justify-end">
        <div className="w-full max-w-xs">
          <FormField label="Filter project">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ticket list</CardTitle>
            <Badge variant="secondary">{filteredTickets.length}</Badge>
          </CardHeader>
          <CardContent className="grid gap-3">
            {filteredTickets.length ? (
              filteredTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} selected={ticket.id === selectedTicket?.id} onSelect={() => setSelectedTicketId(ticket.id)} />
              ))
            ) : (
              <EmptyState icon={TicketIcon} title="No tickets" description="No tickets match the selected project filter." />
            )}
          </CardContent>
        </Card>
        <AdminDetail ticket={selectedTicket} onMove={moveWorkflow} onAddNote={addNote} />
      </div>
    </main>
  );
}

function TicketCard({ ticket, selected, onSelect }) {
  const status = statuses[ticket.status];

  return (
    <button
      className={cn(
        "grid gap-3 rounded-lg border bg-card p-4 text-left shadow-sm transition hover:border-foreground hover:bg-muted/40",
        selected && "border-foreground ring-2 ring-foreground/10",
      )}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{ticket.id}</span>
        <StatusBadge status={ticket.status} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{ticket.project}</Badge>
        <Badge variant="outline">{status.owner}</Badge>
      </div>
      <p className="font-medium leading-snug">{ticket.title}</p>
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{ticket.clientName || "Unknown client"}</span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <Clock3 className="size-3.5" aria-hidden="true" />
          {ticket.updatedAt}
        </span>
      </div>
    </button>
  );
}

function AdminDetail({ ticket, onMove, onAddNote }) {
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote("");
  }, [ticket?.id]);

  if (!ticket) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">Select a ticket from the list.</CardContent>
      </Card>
    );
  }

  const status = statuses[ticket.status];
  const actions = actionsByStatus[ticket.status] || [];

  function submitNote(event) {
    event.preventDefault();
    onAddNote(ticket.id, note);
    setNote("");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{ticket.id}</p>
            <CardTitle className="mt-2">{ticket.title}</CardTitle>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <TicketProgress status={ticket.status} />
        <div className="rounded-lg border bg-muted/20 p-4">
          <MarkdownContent markdown={getDescriptionMarkdown(ticket)} />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <MetaBox label="Client" value={ticket.clientName || "Unknown client"} />
          <MetaBox label="Project" value={ticket.project} />
          <MetaBox label="Current owner" value={status.owner} />
          <MetaBox label="Created" value={ticket.createdAt} />
          <MetaBox label="Updated" value={ticket.updatedAt} />
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
                <ArrowRight className="size-4" aria-hidden="true" />
              </div>
              <div>
              <p className="text-xs font-medium text-muted-foreground">Next action</p>
              <p className="mt-1 text-sm">{actions.length ? actions.map((action) => `${action.actor}: ${action.label}`).join(" / ") : "No action. Ticket is complete."}</p>
              </div>
            </div>
            <Badge variant="secondary">{status.owner}</Badge>
          </div>
        </div>
        <Separator />
        <section className="grid gap-3">
          <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Move workflow</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {actions.length ? (
              actions.map((action, index) => (
                <Button key={action.label} variant={action.danger ? "destructive" : "default"} type="button" onClick={() => onMove(ticket.id, index)}>
                  {action.label}
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Ticket is closed.</p>
            )}
          </div>
        </section>
        <Separator />
        <form className="grid gap-3" onSubmit={submitNote}>
          <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Admin note</h4>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows="3" placeholder="Internal update or client response" />
          <Button variant="outline" type="submit">Add note</Button>
        </form>
        <Separator />
        <section className="grid gap-3">
          <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Timeline</h4>
          <div className="grid gap-3">
            {ticket.history.map((item, index) => (
              <TimelineItem key={`${item.createdAt}-${index}`} item={item} />
            ))}
            {(ticket.notes || []).map((item, index) => (
              <TimelineItem key={`${item.createdAt}-note-${index}`} item={{ ...item, status: item.status || "Note", actor: item.actor || "Admin" }} />
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function ClientAccountsPage({ accounts, setAccounts, showToast }) {
  const activeCount = accounts.filter((account) => account.active).length;
  const projectCount = new Set(accounts.flatMap((account) => account.projects)).size;

  function createAccount(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const projects = String(form.get("projects") || "")
      .split(",")
      .map((project) => project.trim())
      .filter(Boolean);

    const account = {
      id: nextAccountId(accounts),
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      projects: projects.length ? projects : ["Unassigned Project"],
      active: true,
      createdAt: now(),
    };

    setAccounts((current) => [account, ...current]);
    event.currentTarget.reset();
    showToast(`${account.name} account created.`);
  }

  function toggleAccount(accountId) {
    setAccounts((current) => current.map((account) => (account.id === accountId ? { ...account, active: !account.active } : account)));
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="User Management"
        title="Client accounts"
        description="Create client accounts and control which projects they can use when opening tickets."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Accounts" value={accounts.length} hint="Provisioned clients" />
        <StatCard label="Active" value={activeCount} hint="Can open tickets" />
        <StatCard label="Projects" value={projectCount} hint="Available options" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5" aria-hidden="true" />
              Create account
            </CardTitle>
            <CardDescription>Provision a client account for ticket submission.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={createAccount}>
              <FormField label="Client name">
                <Input name="name" required placeholder="EGAT Operations" />
              </FormField>
              <FormField label="Email">
                <Input name="email" required type="email" placeholder="ops@egat.example" />
              </FormField>
              <FormField label="Projects">
                <Input name="projects" required placeholder="EGAT Portal, EGAT Data Platform" />
              </FormField>
              <Button type="submit">Create account</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Accounts</CardTitle>
            <Badge variant="secondary">{accounts.length}</Badge>
          </CardHeader>
          <CardContent className="grid gap-3">
            {accounts.length ? accounts.map((account) => (
              <Card key={account.id} className="shadow-none">
                <CardContent className="grid gap-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{account.id}</p>
                      <h4 className="mt-1 font-medium">{account.name}</h4>
                      <p className="text-sm text-muted-foreground">{account.email}</p>
                    </div>
                    <Badge variant={account.active ? "secondary" : "destructive"}>{account.active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {account.projects.map((project) => (
                      <Badge variant="outline" key={project}>{project}</Badge>
                    ))}
                  </div>
                  <Button variant="outline" type="button" onClick={() => toggleAccount(account.id)}>
                    {account.active ? "Deactivate" : "Activate"}
                  </Button>
                </CardContent>
              </Card>
            )) : (
              <EmptyState icon={UserRound} title="No client accounts" description="Create an account to let a client submit tickets." />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function StatusBadge({ status }) {
  const meta = statuses[status];
  const variant = meta?.tone === "danger" ? "destructive" : meta?.tone === "warn" ? "outline" : "secondary";
  return <Badge variant={variant}>{meta?.label || status}</Badge>;
}

function MarkdownEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        listItem: false,
        orderedList: false,
        strike: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Describe the issue.",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "rich-editor-content",
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChange(turndownService.turndown(activeEditor.getHTML()).trim());
    },
  });

  useEffect(() => {
    if (editor && !value && editor.getText()) {
      editor.commands.clearContent();
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label>Description</Label>
        <span className="text-xs font-medium text-muted-foreground">Stored as Markdown</span>
      </div>
      <div className="overflow-hidden rounded-md border bg-background shadow-xs">
        <RichEditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function RichEditorToolbar({ editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-2">
      <ToolbarButton active={editor.isActive("bold")} icon={Bold} label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton active={editor.isActive("italic")} icon={Italic} label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton active={editor.isActive("underline")} icon={UnderlineIcon} label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} />
    </div>
  );
}

function ToolbarButton({ active = false, icon: Icon, label, onClick }) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className={cn("h-8 px-3 text-xs", active && "border border-primary/20 bg-primary/10 text-primary")}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}

function MarkdownContent({ markdown }) {
  return (
    <div className="markdown-render" data-color-mode="light">
      <MarkdownPreview source={markdown || ""} />
    </div>
  );
}

function MetaBox({ label, value }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function TimelineItem({ item }) {
  return (
    <div className="border-l-2 border-primary pl-3">
      <p className="font-medium">{item.status}</p>
      <p className="text-sm text-muted-foreground">{item.message}</p>
      <p className="text-xs text-muted-foreground">{item.actor} - {item.createdAt}</p>
    </div>
  );
}

function getRoute() {
  if (window.location.pathname === "/admin") return "/admin";
  if (window.location.pathname === "/accounts") return "/accounts";
  if (window.location.pathname === "/track-issue") return "/track-issue";
  return "/send-ticket";
}

function loadTickets() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return cloneSeeds(seedTickets);

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed.tickets) ? parsed.tickets.map(normalizeTicket) : cloneSeeds(seedTickets);
  } catch {
    return cloneSeeds(seedTickets);
  }
}

function loadAccounts() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return cloneSeeds(seedAccounts);

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed.accounts) ? parsed.accounts.map(normalizeAccount) : cloneSeeds(seedAccounts);
  } catch {
    return cloneSeeds(seedAccounts);
  }
}

function normalizeTicket(ticket) {
  return {
    ...ticket,
    clientName: ticket.clientName || "Unknown client",
    clientEmail: ticket.clientEmail || "",
    descriptionMarkdown: getDescriptionMarkdown(ticket),
    notes: ticket.notes || [],
    history: ticket.history || [],
  };
}

function normalizeAccount(account) {
  return {
    ...account,
    projects: Array.isArray(account.projects) && account.projects.length ? account.projects : ["Unassigned Project"],
    active: account.active !== false,
  };
}

function getDescriptionMarkdown(ticket) {
  return ticket.descriptionMarkdown || ticket.description || "";
}

function cloneSeeds(seed) {
  return JSON.parse(JSON.stringify(seed));
}

function now() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function nextId(tickets) {
  const maxNumber = Math.max(
    0,
    ...tickets
      .map((ticket) => Number(ticket.id.replace("MA-2026-", "")))
      .filter((number) => Number.isFinite(number)),
  );
  return `MA-2026-${String(maxNumber + 1).padStart(3, "0")}`;
}

function nextAccountId(accounts) {
  const maxNumber = Math.max(
    0,
    ...accounts
      .map((account) => Number(account.id.replace("CA-", "")))
      .filter((number) => Number.isFinite(number)),
  );
  return `CA-${String(maxNumber + 1).padStart(3, "0")}`;
}

createRoot(document.getElementById("root")).render(<App />);
