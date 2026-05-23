> Current-scope note:
> This checklist covers only the oversight navigator (`security_supervisor` and `society_manager`).
> It should not be read as proof that the full mobile app is release-ready.

## Navigation
| # | Test case | Steps | Expected result | Role |
|---|-----------|-------|-----------------|------|
| 1 | Supervisor tab set | Sign in as a live `security_supervisor` and open oversight navigator | Tabs shown: Home, Alerts, Ops, Tickets; Announcements tab is hidden | Security Supervisor |
| 2 | Manager tab set | Sign in as a live `society_manager` and open oversight navigator | Tabs shown: Home, Alerts, Ops, Tickets, Post Notice | Society Manager |
| 3 | Preview supervisor tab set | Enter preview mode as `security_supervisor` and open oversight navigator | Same 4 tabs appear using preview data | Security Supervisor |
| 4 | Preview manager tab set | Enter preview mode as `society_manager` and open oversight navigator | Same 5 tabs appear using preview data | Society Manager |

## Home
| # | Test case | Steps | Expected result | Role |
|---|-----------|-------|-----------------|------|
| 1 | Live home load | Open Home on a live oversight account with network on | Guard board, alert count, visitor stats, and notification inbox load from backend data | Both |
| 2 | Live home refresh | Tap `Refresh feed` on Home while online | Home queries refetch and success message confirms live backend refresh | Both |
| 3 | Home offline error | Disable network and tap `Refresh feed` on Home | Existing content stays visible and a backend refresh failure is surfaced instead of crashing | Both |
| 4 | Preview home behavior | Open Home in preview mode and tap `Refresh feed` | Local preview data refreshes and preview success message is shown | Both |

## Alerts
| # | Test case | Steps | Expected result | Role |
|---|-----------|-------|-----------------|------|
| 1 | Live alerts load | Open Alerts on a live oversight account with network on | Alert list loads from `get_oversight_alert_feed` with status, type, guard, and location | Both |
| 2 | Acknowledge alert | Tap `Acknowledge` on an active live alert | Alert updates to `acknowledged` and success message is shown | Both |
| 3 | Resolve alert | Tap `Resolve` on an active or acknowledged live alert | Alert updates to `resolved` and resolve action becomes disabled | Both |
| 4 | Alerts offline error | Disable network and try `Acknowledge` or `Resolve` on a live alert | Action fails gracefully and error message is shown | Both |
| 5 | Preview alerts behavior | Open Alerts in preview mode and acknowledge/resolve an alert | Alert updates locally without backend dependency | Both |

## Ops
| # | Test case | Steps | Expected result | Role |
|---|-----------|-------|-----------------|------|
| 1 | Live ops load | Open Ops on a live oversight account with network on | Checklist board, visitor gate flow, and attendance log load from live RPC data | Both |
| 2 | Live ops refresh | Tap `Refresh board` on Ops while online | Guards, visitor stats, and attendance queries refetch and success message confirms live refresh | Both |
| 3 | Ops offline error | Disable network and tap `Refresh board` on Ops | Existing data stays visible and a refresh error is shown | Both |
| 4 | Preview ops behavior | Open Ops in preview mode and tap `Refresh board` | Local preview board updates without live RPC calls | Both |

## Tickets
| # | Test case | Steps | Expected result | Role |
|---|-----------|-------|-----------------|------|
| 1 | Live ticket queue load | Open Tickets on a live oversight account with network on | Ticket queue loads from `get_mobile_oversight_tickets` and unresolved items sort first | Both |
| 2 | Create behavior ticket | Enter subject, category, note, severity, then tap `Create ticket` with `Behavior` selected | `create_behavior_ticket` succeeds and new ticket appears in queue | Both |
| 3 | Create material quality ticket | Select `Quality`, fill required fields, then tap `Create ticket` | `create_material_ticket` succeeds and quality ticket appears with batch/qty details | Both |
| 4 | Create return ticket | Select `Return`, fill required fields including return qty, then tap `Create ticket` | Ticket is created through the material ticket flow and return details appear in queue | Both |
| 5 | Acknowledge ticket | Tap `Acknowledge` on an open live ticket | Ticket status updates to `acknowledged` and success message is shown | Both |
| 6 | Close ticket | Tap `Close` on an open or acknowledged live ticket | Ticket status updates to `closed` and close action becomes disabled | Both |
| 7 | Tickets offline create error | Disable network and try creating a ticket on a live account | Create fails gracefully and error message is shown | Both |
| 8 | Tickets offline update error | Disable network and try acknowledging or closing a live ticket | Status change fails gracefully and error message is shown | Both |
| 9 | Preview tickets behavior | Open Tickets in preview mode, create a ticket, then update its status | Ticket create and status changes happen locally without backend calls | Both |

## Post Notice
| # | Test case | Steps | Expected result | Role |
|---|-----------|-------|-----------------|------|
| 1 | Manager announcement tab access | Sign in as `society_manager` and open `Post Notice` | Announcement form is accessible | Society Manager |
| 2 | Supervisor announcement gate | Sign in as `security_supervisor` and inspect tabs | `Post Notice` tab is not available | Security Supervisor |
| 3 | Live announcement post | As a live manager, enter title, description, optional date, then tap `Post Announcement` | `createSocietyAnnouncement` succeeds, success alert shows, and app navigates back to Home | Society Manager |
| 4 | Announcement offline error | Disable network and submit a valid announcement on a live manager account | Submit fails gracefully and error message is shown | Society Manager |
| 5 | Preview announcement behavior | Enter preview mode as manager, submit a valid announcement | Preview success alert is shown and app returns to Home without live backend dependency | Society Manager |
