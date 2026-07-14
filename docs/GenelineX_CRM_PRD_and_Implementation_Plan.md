**geneline-x**

**Sales & Onboarding CRM**

Product Requirements Document  &  Implementation Plan

*A WhatsApp-automation product for salons, restaurants & corporate businesses*


| **Field** | **Detail** |
| - | - |
| **Document** | **PRD + Implementation Plan** |
| **Version** | **1.0 (Draft)** |
| **Date** | **14 July 2026** |
| **Owner** | **Diallo — Product / Admin** |
| **Status** | **For team review** |


**PART ONE**

**Product Requirements Document**

# **1  Overview & problem**

geneline-x sells a WhatsApp automation service to local businesses: the product plugs into the same number a business already gives customers, then answers questions, quotes prices, and manages bookings automatically, sending the owner a weekly summary of interactions and sales.

The sales team acquires these businesses through in-person field visits. Today, that pipeline lives in a single shared text document that every agent edits by hand. It has no structure, no per-agent separation, no link between a prospect and the account created once a deal closes, and no way for the admin to see conversion, revenue, or agent performance at a glance.

This CRM replaces that document with a two-role web application. **Field agents** log and update their own businesses; the **admin** sees everything — every business, every agent, revenue, and conversion — from a single dashboard.

| **Core principle:  **one business = one record with one auto-generated Business ID, carried unchanged from the first field visit all the way through to the account created at onboarding. Prospecting and onboarding are two stages of one linked record, never two disconnected lists. |
| - |

# **2  Goals & success metrics**

## **Goals**

- Give every agent a fast, mobile-friendly way to log and update businesses from the field.

- Keep prospecting data and onboarding account data in one linked record via a shared Business ID.

- Give the admin a live view of the whole pipeline — no more manual reading of a shared doc.

- Enforce role separation: agents see only their own businesses; only the admin sees the dashboard.

- Support multiple business types (salon, restaurant, corporate) with type-specific pricing.

## **Success metrics**

| **Metric** | **Target** |
| - | - |
| **Agent adoption** | **All active agents logging visits in-app within 2 weeks of launch** |
| **Data completeness** | **100% of closed deals have a linked onboarding record** |
| **Admin visibility** | **Conversion, revenue & per-agent stats available with zero manual work** |
| **Time to log a visit** | **Under 60 seconds on a phone** |

# **3  Users & roles**

The system has two roles with strictly different access. Role is fixed at login and determines every screen a person can reach.

|  | **Sales Agent** | **Admin** |
| - | - | - |
| **Who** | **Field marketers acquiring businesses** | **Diallo / operations owner** |
| **Sees** | **Only their own businesses** | **Every business, every agent** |
| **Can do** | **Add & update businesses; onboard closed deals** | **Everything agents can, plus full analytics** |
| **Dashboard** | **No access** | **Full access** |
| **Analytics** | **Own counts only** | **Company-wide + per-agent** |
| **Access rule:  **an agent can never see another agent's pipeline or the admin dashboard. This is a hard requirement, enforced on the server, not just hidden in the interface. |

# **4  Data model**

Two linked records, joined by Business ID. A business starts as a prospect record the moment an agent logs it, and gains an onboarding record only when the deal closes.

## **4.1  Business (prospect record)**

Created on the first field visit. Business ID is auto-generated (format **GX-0001**) and never changes.

| **Field** | **Type** | **Notes** |
| - | - | - |
| **business\_id** | **auto ID** | **Primary key — GX-0001, GX-0002 …** |
| **name** | **text** | **Business name** |
| **contact** | **text** | **Customer-facing phone number** |
| **type** | **enum** | **Salon / Restaurant / Corporate** |
| **stage** | **enum** | **New / Interested / Reluctant / Absent / Closed** |
| **objection** | **text** | **What's holding them back / notes** |
| **next\_action** | **text** | **e.g. 'Reach out Friday'** |
| **agent** | **ref** | **Owning agent (the person who logged it)** |
| **price** | **number** | **Agreed price in Le (set at close)** |
| **created\_at** | **timestamp** | **Auto** |

## **4.2  Onboarding account (linked record)**

Created only when a deal is closed. Linked to the business by the same Business ID — a one-to-one sync between the two records.

| **Field** | **Type** | **Notes** |
| - | - | - |
| **business\_id** | **ref** | **Foreign key → Business. The link.** |
| **owner\_name** | **text** | **Owner / main contact name** |
| **email** | **text** | **Login email** |
| **personal\_phone** | **text** | **Owner's personal number** |
| **password** | **secret** | **Hashed — never stored in plain text** |
| **onboarded\_at** | **timestamp** | **Auto** |
| **On pricing:  **price lives on the business record because it's agreed during the sale. Defaults follow type (Salon Le500, Corporate Le1500) but the agent can override at closing — e.g. the Chibex deal that closed at Le300. |

# **5  Features & requirements**

## **5.1  Authentication & roles**

- Email + password login for both roles.

- Role (agent / admin) determined at login and enforced on every request.

- Agents are scoped to their own records automatically.

## **5.2  Agent — my pipeline**

- See a list of only my own businesses, searchable by name.

- Quick stats: total logged, interested, closed.

- **Add a business: **name, contact, type, stage, objection, next action. Business ID auto-generated on save.

- **Update a business: **change stage, objection, or next action after a follow-up visit.

- **Onboard a closed deal: **when stage = Closed, an Onboard action opens the account form (owner, email, phone, password, agreed price).

## **5.3  Admin — dashboard**

- Company overview: total businesses, deals closed, conversion rate, total revenue, onboarded count.

- Agent leaderboard: per-agent logged / closed / revenue, ranked.

- Pipeline by stage: distribution across New → Closed.

- **All businesses view: **every record across all agents, filterable by type and by agent, searchable by name.

- Business detail: full record including linked onboarding account details for onboarded businesses.

## **5.4  Business types & pricing**

- One list, tagged by type: Salon, Restaurant, Corporate.

- Each type carries a default price; agent can override at closing.

- Corporate businesses (targeted from next week) live in the same list, distinguished by tag — no separate section.

## **5.5  Out of scope (v1)**

- WhatsApp logging agent (Dennis's idea) — planned as a later add-on that writes into the same database; see implementation plan phase 5.

- The customer-facing WhatsApp automation product itself — that is the company's core product, separate from this internal CRM.

- In-app messaging, notifications, and payment collection.

# **6  Non-functional requirements**

| **Area** | **Requirement** |
| - | - |
| **Platform** | **Web app, mobile-first — agents work from phones in the field** |
| **Performance** | **Logging a visit takes under 60 seconds; pages load fast on mobile data** |
| **Security** | **Passwords hashed; role separation enforced server-side; account data protected** |
| **Reliability** | **Shared database — all agents write to one source of truth, no data loss on refresh** |
| **Accessibility** | **Keyboard focus visible; works down to small phone screens** |
| **Offline** | **Not required for v1, but avoid losing a form in progress on connection drop** |


**PART TWO**

**Project Implementation Plan**

# **7  Approach**

The interactive prototype already built is the functional spec: both roles, the linked Business ID, onboarding, type tags, and pricing all work in-browser. The build turns that prototype into a real multi-user app by adding two things it can't have on its own — a shared database and real authentication — then deploying it.

Work is phased so the team gets a usable tool early and richer analytics follow. Each phase ends with something testable.

## **Recommended stack**

| **Layer** | **Choice** | **Why** |
| - | - | - |
| **Frontend** | **React (from the prototype)** | **Already built; becomes the real UI** |
| **Backend + DB** | **Supabase (Postgres + Auth)** | **Database, auth & row-level security in one; fast to stand up** |
| **Hosting** | **Vercel or Netlify** | **Simple deploy for a React app** |
| **Access control** | **Supabase row-level security** | **Enforces 'agents see only their own' at the database** |
| **Why Supabase:  **it provides the shared database, user login, and the row-level rules that keep agents scoped to their own data — the three things the prototype can't do alone — without building a backend from scratch. |

# **8  Phased delivery**

## **Phase 0 — Setup  ·  ~2 days**

1. Create the Supabase project; define the businesses and onboarding tables per the data model.

2. Configure the Business ID auto-generation (GX-0001 sequence).

3. Set up the code repository and connect deployment to Vercel/Netlify.

**Done when: **empty database and tables exist and a blank app deploys to a live URL.

## **Phase 1 — Auth & roles  ·  ~3 days**

4. Wire up email/password login using Supabase Auth.

5. Add an agent/admin role to each user.

6. Add row-level security: agents can read/write only their own businesses; admin reads all.

**Done when: **an agent and an admin can log in and are correctly scoped.

## **Phase 2 — Agent pipeline  ·  ~4 days**

7. Connect the agent list, add-business form, and update form to the database.

8. Auto-assign Business ID on new business.

9. Agent stats (total / interested / closed) computed live.

**Done when: **an agent can log, find, and update their own businesses from a phone.

## **Phase 3 — Onboarding  ·  ~3 days**

10. Build the onboarding form for closed deals (owner, email, phone, password, agreed price).

11. Save the onboarding record linked to the business by Business ID; hash the password.

12. Mark the business onboarded and reflect it in stats.

**Done when: **closing a deal and completing onboarding produces one linked record.

## **Phase 4 — Admin dashboard  ·  ~4 days**

13. Company overview cards: totals, conversion, revenue, onboarded.

14. Agent leaderboard and pipeline-by-stage views.

15. All-businesses view with type and agent filters, plus business detail with linked account.

**Done when: **admin sees the whole company live, with no manual data handling.

## **Phase 5 — Corporate & polish  ·  ~2 days**

16. Confirm corporate type + pricing flows end-to-end (targeted from next week).

17. Mobile testing with real agents; fix rough edges.

18. Data migration: move the existing tracker businesses into the new system.

**Done when: **the team is using the live app and the old document is retired.

## **Phase 6 — WhatsApp logging (later add-on)**

Dennis's idea, deferred until v1 is stable. An agent sends business details over WhatsApp and a bot writes them into the same database this app reads from. It's an input channel on top of the existing data model, not a change to it — which is exactly why the shared database matters.

# **9  Timeline summary**

| **Phase** | **Focus** | **Est.** | **Output** |
| - | - | - | - |
| **0** | **Setup** | **2 d** | **Live blank app + database** |
| **1** | **Auth & roles** | **3 d** | **Scoped logins** |
| **2** | **Agent pipeline** | **4 d** | **Agents logging live** |
| **3** | **Onboarding** | **3 d** | **Linked account records** |
| **4** | **Admin dashboard** | **4 d** | **Full company visibility** |
| **5** | **Corporate & polish** | **2 d** | **Team live, old doc retired** |
| **6** | **WhatsApp logging** | **later** | **Bot input channel** |

Core build (phases 0–5): roughly **3.5 weeks** of focused work for one developer. Phase 6 follows once the core is proven.

# **10  Risks & mitigations**

| **Risk** | **Mitigation** |
| - | - |
| **Agents don't adopt the tool** | **Keep logging under 60s; test on real phones with real agents in phase 5** |
| **Role separation leaks** | **Enforce at the database with row-level security, not just in the UI** |
| **Scope creep from WhatsApp idea** | **Explicitly deferred to phase 6; build on the same data model, not before it** |
| **Account passwords mishandled** | **Hash on the server; never store or display plain text** |
| **Losing existing tracker data** | **Migrate the current businesses as a planned phase-5 step** |

# **11  Immediate next steps**

19. Review this PRD with the team and confirm the data model fields.

20. Confirm the stack (Supabase + Vercel) or name a preferred alternative.

21. Assign a developer and start Phase 0.

22. Decide who the first admin and agent test accounts belong to.


| **Bottom line:  **the prototype proves the product; this plan turns it into a live, multi-agent tool in about three and a half weeks, with the WhatsApp channel as a clean follow-on. |
| - |
