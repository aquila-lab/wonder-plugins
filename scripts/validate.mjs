#!/usr/bin/env node
// Validates wonder-plugins manifests:
//   1. Cursor: .cursor-plugin/marketplace.json + each plugin's .cursor-plugin/plugin.json
//      against the official Cursor JSON schemas in ./schemas/.
//   2. All referenced paths (logo, mcpServers, interface.screenshots, etc.) resolve
//      to real files in the repo.
//   3. Plugin names are unique, lowercase, kebab-case, and match between manifest
//      and marketplace entry.

import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve, dirname, join, relative, isAbsolute, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const errors = []
const warnings = []
const fail = (msg) => errors.push(msg)
const warn = (msg) => warnings.push(msg)

const loadJSON = (p) => JSON.parse(readFileSync(p, 'utf8'))
const exists = (p) => existsSync(p)
const isFile = (p) => exists(p) && statSync(p).isFile()
const isDir = (p) => exists(p) && statSync(p).isDirectory()

const pluginNamePattern = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/
const marketplaceNamePattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validateMarketplace = ajv.compile(
  loadJSON(resolve(root, 'schemas/marketplace.schema.json'))
)
const validatePlugin = ajv.compile(
  loadJSON(resolve(root, 'schemas/plugin.schema.json'))
)

function reportAjvErrors(label, errs) {
  for (const err of errs) {
    const detail =
      err.keyword === 'additionalProperties'
        ? `${err.message}: "${err.params.additionalProperty}"`
        : err.message
    fail(`${label} ${err.instancePath || '/'}: ${detail}`)
  }
}

function isSafeRelativePath(value) {
  if (typeof value !== 'string' || value.length === 0) return false
  if (value.startsWith('http://') || value.startsWith('https://')) return true
  if (isAbsolute(value)) return false
  const normalized = posix.normalize(value.replace(/\\/g, '/'))
  return !normalized.startsWith('../') && normalized !== '..'
}

function extractPathValues(value) {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(extractPathValues)
  if (value && typeof value === 'object') {
    const out = []
    if (typeof value.path === 'string') out.push(value.path)
    if (typeof value.file === 'string') out.push(value.file)
    return out
  }
  return []
}

function checkReferencedPath(pluginDir, fieldName, pathValue, pluginName) {
  if (pathValue.startsWith('http://') || pathValue.startsWith('https://')) return
  if (!isSafeRelativePath(pathValue)) {
    fail(
      `${pluginName}: "${fieldName}" has unsafe path "${pathValue}" (no absolute paths or "..")`
    )
    return
  }
  if (!exists(resolve(pluginDir, pathValue))) {
    fail(`${pluginName}: "${fieldName}" references missing path "${pathValue}"`)
  }
}

function validateCursor() {
  const marketplacePath = resolve(root, '.cursor-plugin/marketplace.json')
  if (!isFile(marketplacePath)) {
    fail('Missing .cursor-plugin/marketplace.json')
    return
  }

  const marketplace = loadJSON(marketplacePath)
  if (!validateMarketplace(marketplace)) {
    reportAjvErrors('cursor marketplace.json', validateMarketplace.errors)
  }

  if (!marketplaceNamePattern.test(marketplace.name ?? '')) {
    fail('Marketplace "name" must be lowercase kebab-case')
  }

  const seenNames = new Set()
  for (const [i, entry] of (marketplace.plugins ?? []).entries()) {
    const label = `cursor plugins[${i}]`

    if (!pluginNamePattern.test(entry.name ?? '')) {
      fail(`${label}.name must be lowercase kebab-case`)
      continue
    }
    if (seenNames.has(entry.name)) fail(`Duplicate plugin name "${entry.name}"`)
    seenNames.add(entry.name)

    if (!isSafeRelativePath(entry.source ?? '')) {
      fail(`${label}.source must be a safe relative path`)
      continue
    }
    const pluginDir = resolve(root, entry.source)
    if (!isDir(pluginDir)) {
      fail(`${label}.source directory does not exist: ${entry.source}`)
      continue
    }

    const manifestPath = resolve(pluginDir, '.cursor-plugin/plugin.json')
    if (!isFile(manifestPath)) {
      fail(`${entry.name}: missing .cursor-plugin/plugin.json`)
      continue
    }
    const manifest = loadJSON(manifestPath)

    if (!validatePlugin(manifest)) {
      reportAjvErrors(
        `${entry.name} plugin.json`,
        validatePlugin.errors
      )
    }

    if (manifest.name && manifest.name !== entry.name) {
      fail(
        `${entry.name}: plugin.json name "${manifest.name}" does not match marketplace entry`
      )
    }

    for (const field of [
      'logo',
      'rules',
      'skills',
      'agents',
      'commands',
      'hooks',
      'mcpServers'
    ]) {
      for (const value of extractPathValues(manifest[field])) {
        checkReferencedPath(pluginDir, field, value, entry.name)
      }
    }

    if (!isFile(resolve(pluginDir, 'mcp.json'))) {
      warn(`${entry.name}: no mcp.json found (skip if you don't ship an MCP server)`)
    }
  }
}

function validateClaude() {
  const path = resolve(root, '.claude-plugin/marketplace.json')
  if (!isFile(path)) return
  const m = loadJSON(path)
  if (!Array.isArray(m.plugins) || m.plugins.length === 0) {
    fail('Claude marketplace: "plugins" must be a non-empty array')
    return
  }
  for (const [i, entry] of m.plugins.entries()) {
    if (!isSafeRelativePath(entry.source)) {
      fail(`claude plugins[${i}].source must be a safe relative path`)
      continue
    }
    const pluginDir = resolve(root, entry.source)
    if (!isFile(resolve(pluginDir, '.claude-plugin/plugin.json'))) {
      fail(`${entry.name}: missing .claude-plugin/plugin.json`)
    }
  }
}

function validateCodex() {
  const path = resolve(root, '.agents/plugins/marketplace.json')
  if (!isFile(path)) return
  const m = loadJSON(path)
  if (!Array.isArray(m.plugins) || m.plugins.length === 0) {
    fail('Codex marketplace: "plugins" must be a non-empty array')
    return
  }
  for (const [i, entry] of m.plugins.entries()) {
    const sourcePath =
      typeof entry.source === 'string' ? entry.source : entry.source?.path
    if (!isSafeRelativePath(sourcePath)) {
      fail(`codex plugins[${i}].source must be a safe relative path`)
      continue
    }
    const pluginDir = resolve(root, sourcePath)
    const manifestPath = resolve(pluginDir, '.codex-plugin/plugin.json')
    if (!isFile(manifestPath)) {
      fail(`${entry.name}: missing .codex-plugin/plugin.json`)
      continue
    }
    const manifest = loadJSON(manifestPath)
    const refs = []
    if (manifest.mcpServers) refs.push(['mcpServers', manifest.mcpServers])
    if (manifest.interface) {
      const iface = manifest.interface
      if (iface.logo) refs.push(['interface.logo', iface.logo])
      if (iface.composerIcon) refs.push(['interface.composerIcon', iface.composerIcon])
      for (const s of iface.screenshots ?? []) refs.push(['interface.screenshots', s])
    }
    for (const [field, value] of refs) {
      for (const v of extractPathValues(value)) {
        checkReferencedPath(pluginDir, field, v, entry.name)
      }
    }
  }
}

validateCursor()
validateClaude()
validateCodex()

if (warnings.length > 0) {
  console.log('Warnings:')
  for (const w of warnings) console.log(`  - ${w}`)
  console.log()
}
if (errors.length > 0) {
  console.error('Validation failed:')
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log('All manifests validated successfully.')
