# Pakrose Module Data Requirements

## Funding Entries
| Field | Type | Required | Editable | Deletion | Company Ownership | User Ownership | Audit History |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `id` | UUID string | Yes | Read-only | Hard delete for now | Yes | System-generated | Yes |
| `date` | `YYYY-MM-DD` string | Yes | No after create in current API | Hard delete for now | Yes | Creator implied | Yes |
| `amount` | number | Yes | No after create in current API | Hard delete for now | Yes | Creator implied | Yes |
| `note` | string | Optional | No after create in current API | Hard delete for now | Yes | Creator implied | Yes |
| `createdAt` | ISO datetime string | Yes | Read-only | Read-only | Yes | Creator implied | Yes |
| `createdBy` | email string | Yes | Read-only | Read-only | Yes | Yes | Yes |

## Organizations
| Field | Type | Required | Editable | Deletion | Company Ownership | User Ownership | Audit History |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `id` | UUID string | Yes | Read-only | Hard delete for now | Yes | System-generated | Yes |
| `sector` | enum-like string (`government`, `ngos`, `private`) | Yes | Read-only | With organization delete | Yes | No | Yes |
| `name` | string | Yes | Yes | Hard delete for now | Yes | Creator implied | Yes |
| `createdAt` | ISO datetime string | Yes | Read-only | Read-only | Yes | Creator implied | Yes |
| `createdBy` | email string | Yes | Read-only | Read-only | Yes | Yes | Yes |
| `updatedAt` | ISO datetime string | Optional | Read-only | Read-only | Yes | System-generated | Yes |

## Organization Expenses
| Field | Type | Required | Editable | Deletion | Company Ownership | User Ownership | Audit History |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `id` | UUID string | Yes | Read-only | Hard delete for now | Yes | System-generated | Yes |
| `organizationId` | UUID string | Yes | Read-only | With explicit delete | Yes | No | Yes |
| `date` | `YYYY-MM-DD` string | Yes | No after create in current API | Hard delete for now | Yes | Creator implied | Yes |
| `description` | string | Yes | No after create in current API | Hard delete for now | Yes | Creator implied | Yes |
| `amountSpent` | number | Yes | No after create in current API | Hard delete for now | Yes | Creator implied | Yes |
| `paidBy` | string | Yes | No after create in current API | Hard delete for now | Yes | Creator implied | Yes |
| `createdAt` | ISO datetime string | Yes | Read-only | Read-only | Yes | Creator implied | Yes |
| `createdBy` | email string | Yes | Read-only | Read-only | Yes | Yes | Yes |

## Daily Expenses
| Field | Type | Required | Editable | Deletion | Company Ownership | User Ownership | Audit History |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `id` | UUID string | Yes | Read-only | Hard delete for now | Yes | System-generated | Yes |
| `date` | `YYYY-MM-DD` string | Yes | No after create in current API | Hard delete for now | Yes | Creator implied | Yes |
| `description` | string | Yes | No after create in current API | Hard delete for now | Yes | Creator implied | Yes |
| `amount` | number | Yes | No after create in current API | Hard delete for now | Yes | Creator implied | Yes |
| `createdAt` | ISO datetime string | Yes | Read-only | Read-only | Yes | Creator implied | Yes |
| `createdBy` | email string | Yes | Read-only | Read-only | Yes | Yes | Yes |

## Store Items
| Field | Type | Required | Editable | Deletion | Company Ownership | User Ownership | Audit History |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `id` | UUID string | Yes | Read-only | Hard delete for now | Yes | System-generated | Yes |
| `name` | string | Yes | Not yet in current API | Hard delete for now | Yes | Creator implied | Yes |
| `quantity` | number | Yes | Yes | Hard delete for now | Yes | Editor implied | Yes |
| `createdAt` | ISO datetime string | Yes | Read-only | Read-only | Yes | Creator implied | Yes |
| `createdBy` | email string | Yes | Read-only | Read-only | Yes | Yes | Yes |
| `updatedAt` | ISO datetime string | Optional | Read-only | Read-only | Yes | System-generated | Yes |

## Template Vault Files
| Field | Type | Required | Editable | Deletion | Company Ownership | User Ownership | Audit History |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `id` | UUID string | Yes | Read-only | Hard delete for now | Yes | System-generated | Yes |
| `name` | string | Yes | No in current API | Hard delete for now | Yes | Uploader implied | Yes |
| `extension` | string (`PDF`, `DOC`, `DOCX`) | Yes | Read-only | Hard delete for now | Yes | No | Yes |
| `mimeType` | string | Yes | Read-only | Hard delete for now | Yes | No | Yes |
| `contentDataUrl` | string | Yes | Read-only | Hard delete for now | Yes | No | Yes |
| `uploadedAt` | ISO datetime string | Yes | Read-only | Read-only | Yes | Uploader implied | Yes |
| `uploadedBy` | email string | Yes | Read-only | Read-only | Yes | Yes | Yes |

## Company Rules
- Every record belongs to one company workspace.
- Current enabled company is `pakrose`.
- Prime Fabric support should be added later through the same company-aware API shape.
- Business logic should not hardcode `pakrose` except in temporary enablement/configuration.
