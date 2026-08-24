// store/report-shape.js  --  the report-field vocabulary a case's free-form
// report JSON is built from. Config-driven: the actual field list, order, and
// per-field metadata (critical_for_visit / append / never_inferred) come from
// the deployer-selected config package's report-fields.yml (see
// src/config-loader.js), not a hardcoded literal -- this is what makes casey's
// report vocabulary swappable per deployment (AGENTS.md's "configurable like
// thatcher" goal) instead of pinned to the animal-health domain.

import { loadDomainConfig } from '../config-loader.js'

const { reportFields } = loadDomainConfig()

// Same field set the config declares, in declaration order -- REPORT_KEYS is
// the membership check (pick/filter callers), REPORT_KEY_ORDER is the same
// set ordered for stable display/fill-rate rendering (dashboard). A single
// ordered YAML array gives both without a second, driftable ordering to
// maintain by hand.
export const REPORT_KEYS = new Set(reportFields.fields.map(f => f.key))
export const REPORT_KEY_ORDER = reportFields.fields.map(f => f.key)

// Fields whose absence blocks the on-site-visit-critical health guardrail
// (case-health.js VISIT_CRITICAL). Replaces the old hardcoded array with a
// per-field config flag, so a deployer adding/removing a critical field only
// ever touches report-fields.yml, never case-health.js.
export const CRITICAL_FIELDS = reportFields.fields.filter(f => f.critical_for_visit).map(f => f.key)

// Fields that APPEND on every write rather than overwrite (photos/audio/sites
// in the animal-health config; photos alone in the generic demo). Replaces
// the old hardcoded per-field special-casing in case-store.js's
// _mergeReportFields.
export const APPEND_FIELDS = new Set(reportFields.fields.filter(f => f.append).map(f => f.key))

// Fields carrying a structural "must be agent-STATED, never inferred" bound --
// case-tools.js's regression guard checks the live tool-schema description
// text for each such field against its own guard pattern, so a future prompt/
// description edit that silently drops the reported-not-inferred instruction
// fails loud at process boot, the same fail-fast discipline hooks/prompt.js's
// selfCheckLoadBearingPromptContent already applies to the persona text.
export const NEVER_INFERRED_FIELDS = reportFields.fields.filter(f => f.never_inferred)

// The two (at most) report fields safe to show in a cross-worker PII-free
// enquiry list (case-tools.js's enquiryRow) -- species/location for the
// animal-health domain, category/location for the generic IT-helpdesk demo.
// Defaults to the first two critical_for_visit fields if the config declares
// none explicitly, so a config package that omits this key still gets a
// reasonable projection rather than an empty one.
export const ENQUIRY_HEADLINE_FIELDS = reportFields.enquiry_headline_fields
  || reportFields.fields.filter(f => f.critical_for_visit).slice(0, 2).map(f => f.key)

// Plain-language display label per field, for the dashboard's ReportSections
// view -- falls back to the raw key if a config omits display_label.
export const FIELD_LABELS = Object.fromEntries(reportFields.fields.map(f => [f.key, f.display_label || f.key]))
export const fieldLabel = (key) => FIELD_LABELS[key] || key

// Fields grouped into named display sections (config-declared `section`,
// default 'Other') in field-declaration order, dedup'd, for the dashboard's
// ReportSections view -- replaces the old hardcoded REPORT_SECTIONS array
// that assumed animal-health field names.
export const REPORT_SECTIONS = (() => {
  const order = []
  const bySection = new Map()
  for (const f of reportFields.fields) {
    const section = f.section || 'Other'
    if (!bySection.has(section)) { bySection.set(section, []); order.push(section) }
    bySection.get(section).push([f.key, f.display_label || f.key])
  }
  return order.map(title => ({ title, keys: bySection.get(title) }))
})()

export const REPORT_ENTITY_LABEL = reportFields.entity_label || 'report'
export const REPORT_TOOL_NAME = reportFields.tool_name || 'case_report'
export const REPORT_TOOL_DESCRIPTION = reportFields.tool_description || ''
export const REPORT_FIELD_DEFS = reportFields.fields
export const REPORT_GEO_FIELD_DEFS = reportFields.geo_fields || []
