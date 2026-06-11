# MA Ticket Workflow Demo

Vite React POC with separate submit, track, admin, and client-account management pages. Authentication is skipped for now.

## Send Ticket Page

- Submit ticket.
- Select a provided client account.
- Select an allowed project.
- Fill title and markdown description.
- Receive a ticket number.
- URL: `/send-ticket`

## Track Issue Page

- Track ticket by entering the ticket number.
- URL: `/track-issue`

## Admin Back Office UI

- See ticket list.
- Filter tickets by project.
- Select a ticket.
- Move the ticket through the MA process workflow.
- URL: `/admin`

## Client Accounts

- Create client accounts.
- Assign allowed projects.
- Activate/deactivate accounts.
- URL: `/accounts`

## Run

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Then open:

- `http://localhost:5173/send-ticket`
- `http://localhost:5173/track-issue`
- `http://localhost:5173/admin`
- `http://localhost:5173/accounts`

Demo progress is stored in browser `localStorage`. Use **Reset demo** to restore seeded tickets.
