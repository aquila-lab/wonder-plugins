#!/usr/bin/env node
import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve, dirname, isAbsolute, posix } from 'node:path'
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
const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/
const claudePluginSchema =
  'https://json.schemastore.org/claude-code-plugin-manifest.json'
const claudeMarketplaceSchema =
  'https://json.schemastore.org/claude-code-marketplace.json'
const positioning = 'every design is real code'

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validateMarketplace = ajv.compile(
  loadJSON(resolve(root, 'schemas/marketplace.schema.json'))
)
const validatePlugin = ajv.compile(
  loadJSON(resolve(root, 'schemas/plugin.schema.json'))
)
const validateCodexMarketplaceSchema = ajv.compile(
  loadJSON(resolve(root, 'schemas/codex-marketplace.schema.json'))
)
const validateCodexPluginSchema = ajv.compile(
  loadJSON(resolve(root, 'schemas/codex-plugin.schema.json'))
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

function requireNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(`${label} must be a non-empty string`)
    return false
  }
  return true
}

function validateMcpConfig(mcpPath, label) {
  if (!isFile(mcpPath)) {
    fail(`${label}: missing MCP configuration`)
    return null
  }

  const config = loadJSON(mcpPath)
  const servers = config?.mcpServers
  if (!servers || typeof servers !== 'object' || Array.isArray(servers)) {
    fail(`${label}: "mcpServers" must be an object`)
    return null
  }

  const entries = Object.entries(servers)
  if (entries.length === 0) fail(`${label}: "mcpServers" must not be empty`)

  for (const [name, server] of entries) {
    if (!pluginNamePattern.test(name)) {
      fail(`${label}: MCP server name "${name}" must be lowercase kebab-case`)
    }
    if (!server || typeof server !== 'object' || Array.isArray(server)) {
      fail(`${label}: MCP server "${name}" must be an object`)
      continue
    }
    if (server.type !== undefined && server.type !== 'http') {
      fail(`${label}: remote MCP server "${name}" must use type "http"`)
    }
    if (!requireNonEmptyString(server.url, `${label}: MCP server "${name}" URL`)) {
      continue
    }
    let parsed
    try {
      parsed = new URL(server.url)
    } catch {
      fail(`${label}: MCP server "${name}" has an invalid URL`)
      continue
    }
    if (parsed.protocol !== 'https:') {
      fail(`${label}: MCP server "${name}" must use HTTPS`)
    }
  }

  return config
}

function resolveCursorSource(source, pluginRoot) {
  const sourcePath = typeof source === 'string' ? source : source?.path
  if (typeof sourcePath !== 'string' || !pluginRoot) return sourcePath
  const normalizedRoot = pluginRoot.replace(/\\/g, '/').replace(/\/+$/, '')
  const normalizedSource = sourcePath.replace(/\\/g, '/')
  if (
    normalizedSource === normalizedRoot ||
    normalizedSource.startsWith(`${normalizedRoot}/`)
  ) {
    return normalizedSource
  }
  return `${normalizedRoot}/${normalizedSource}`
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

    const sourcePath = resolveCursorSource(
      entry.source,
      marketplace.metadata?.pluginRoot
    )
    if (!isSafeRelativePath(sourcePath ?? '')) {
      fail(`${label}.source must be a safe relative path`)
      continue
    }
    const pluginDir = resolve(root, sourcePath)
    if (!isDir(pluginDir)) {
      fail(`${label}.source directory does not exist: ${sourcePath}`)
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

    if (entry.description && manifest.description !== entry.description) {
      fail(`${entry.name}: Cursor marketplace description must match plugin.json`)
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

    const mcpPath = resolve(pluginDir, 'mcp.json')
    if (!isFile(mcpPath)) {
      warn(`${entry.name}: no mcp.json found (skip if you don't ship an MCP server)`)
    } else {
      validateMcpConfig(mcpPath, `${entry.name} Cursor mcp.json`)
    }
  }
}

function validateClaude() {
  const marketplacePath = resolve(root, '.claude-plugin/marketplace.json')
  if (!isFile(marketplacePath)) {
    fail('Missing .claude-plugin/marketplace.json')
    return
  }

  const marketplace = loadJSON(marketplacePath)
  if (marketplace.$schema !== claudeMarketplaceSchema) {
    fail(`Claude marketplace must use schema "${claudeMarketplaceSchema}"`)
  }
  if (!marketplaceNamePattern.test(marketplace.name ?? '')) {
    fail('Claude marketplace "name" must be lowercase kebab-case')
  }
  requireNonEmptyString(marketplace.owner?.name, 'Claude marketplace owner.name')
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    fail('Claude marketplace: "plugins" must be a non-empty array')
    return
  }

  const seenNames = new Set()
  for (const [i, entry] of marketplace.plugins.entries()) {
    if (!pluginNamePattern.test(entry.name ?? '')) {
      fail(`claude plugins[${i}].name must be lowercase kebab-case`)
      continue
    }
    if (seenNames.has(entry.name)) fail(`Duplicate Claude plugin name "${entry.name}"`)
    seenNames.add(entry.name)

    if (!isSafeRelativePath(entry.source)) {
      fail(`claude plugins[${i}].source must be a safe relative path`)
      continue
    }
    const pluginDir = resolve(root, entry.source)
    const manifestPath = resolve(pluginDir, '.claude-plugin/plugin.json')
    if (!isFile(manifestPath)) {
      fail(`${entry.name}: missing .claude-plugin/plugin.json`)
      continue
    }

    const manifest = loadJSON(manifestPath)
    if (manifest.$schema !== claudePluginSchema) {
      fail(`${entry.name}: Claude plugin must use schema "${claudePluginSchema}"`)
    }
    if (manifest.name !== entry.name) {
      fail(`${entry.name}: Claude plugin.json name must match marketplace entry`)
    }
    if (!semverPattern.test(manifest.version ?? '')) {
      fail(`${entry.name}: Claude plugin version must use strict semver`)
    }
    requireNonEmptyString(manifest.displayName, `${entry.name}: Claude displayName`)
    requireNonEmptyString(manifest.description, `${entry.name}: Claude description`)
    requireNonEmptyString(manifest.author?.name, `${entry.name}: Claude author.name`)

    if (entry.description && entry.description !== manifest.description) {
      fail(`${entry.name}: Claude marketplace description must match plugin.json`)
    }
    if (
      marketplace.metadata?.version &&
      marketplace.metadata.version !== manifest.version
    ) {
      fail(`${entry.name}: Claude marketplace and plugin versions must match`)
    }

    for (const value of extractPathValues(manifest.mcpServers)) {
      checkReferencedPath(pluginDir, 'mcpServers', value, entry.name)
    }

    // Anthropic's directory reads these listing fields from plugin.json.
    if (requireNonEmptyString(manifest.icon, `${entry.name}: Claude icon`)) {
      checkReferencedPath(pluginDir, 'icon', manifest.icon, entry.name)
    }
    for (const field of [
      'documentationUrl',
      'supportUrl',
      'privacyPolicyUrl',
      'termsOfServiceUrl'
    ]) {
      if (
        requireNonEmptyString(manifest[field], `${entry.name}: Claude ${field}`) &&
        !manifest[field].startsWith('https://')
      ) {
        fail(`${entry.name}: Claude ${field} must be an https:// URL`)
      }
    }

    if (manifest.mcpServers === './.mcp.json') {
      validateMcpConfig(
        resolve(pluginDir, '.mcp.json'),
        `${entry.name} Claude .mcp.json`
      )
    }
  }
}

function validateCodex() {
  const marketplacePath = resolve(root, '.agents/plugins/marketplace.json')
  if (!isFile(marketplacePath)) {
    fail('Missing .agents/plugins/marketplace.json')
    return
  }

  const marketplace = loadJSON(marketplacePath)
  if (!validateCodexMarketplaceSchema(marketplace)) {
    reportAjvErrors(
      'codex marketplace.json',
      validateCodexMarketplaceSchema.errors
    )
  }
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    fail('Codex marketplace: "plugins" must be a non-empty array')
    return
  }

  const seenNames = new Set()
  for (const [i, entry] of marketplace.plugins.entries()) {
    if (seenNames.has(entry.name)) fail(`Duplicate Codex plugin name "${entry.name}"`)
    seenNames.add(entry.name)

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
    if (!validateCodexPluginSchema(manifest)) {
      reportAjvErrors(
        `${entry.name} Codex plugin.json`,
        validateCodexPluginSchema.errors
      )
    }
    if (manifest.name !== entry.name) {
      fail(`${entry.name}: Codex plugin.json name must match marketplace entry`)
    }
    if (manifest.mcpServers !== './.mcp.json') {
      fail(`${entry.name}: Codex mcpServers must point to "./.mcp.json"`)
    }

    const refs = []
    if (manifest.mcpServers) refs.push(['mcpServers', manifest.mcpServers])
    if (manifest.skills) refs.push(['skills', manifest.skills])
    if (manifest.interface) {
      const iface = manifest.interface
      if (iface.logo) refs.push(['interface.logo', iface.logo])
      if (iface.logoDark) refs.push(['interface.logoDark', iface.logoDark])
      if (iface.composerIcon) refs.push(['interface.composerIcon', iface.composerIcon])
      for (const s of iface.screenshots ?? []) refs.push(['interface.screenshots', s])
    }
    for (const [field, value] of refs) {
      for (const v of extractPathValues(value)) {
        checkReferencedPath(pluginDir, field, v, entry.name)
      }
    }

    validateMcpConfig(
      resolve(pluginDir, '.mcp.json'),
      `${entry.name} Codex .mcp.json`
    )
  }
}

function validateConsistency() {
  const packageJson = loadJSON(resolve(root, 'package.json'))
  const manifests = [
    [
      'Claude',
      loadJSON(resolve(root, 'plugins/wonder/.claude-plugin/plugin.json'))
    ],
    [
      'Cursor',
      loadJSON(resolve(root, 'plugins/wonder/.cursor-plugin/plugin.json'))
    ],
    [
      'Codex',
      loadJSON(resolve(root, 'plugins/wonder/.codex-plugin/plugin.json'))
    ]
  ]

  for (const [provider, manifest] of manifests) {
    if (manifest.version !== packageJson.version) {
      fail(`${provider} plugin version must match package.json version`)
    }
    if (!manifest.description?.toLowerCase().includes(positioning)) {
      fail(`${provider} description must include "${positioning}"`)
    }
  }

  if (!packageJson.description?.toLowerCase().includes(positioning)) {
    fail(`package.json description must include "${positioning}"`)
  }

  const cursorMcp = loadJSON(resolve(root, 'plugins/wonder/mcp.json'))
  const sharedMcp = loadJSON(resolve(root, 'plugins/wonder/.mcp.json'))
  if (JSON.stringify(cursorMcp) !== JSON.stringify(sharedMcp)) {
    fail('Cursor mcp.json and shared .mcp.json must stay in sync')
  }

  const claudeMarketplace = loadJSON(
    resolve(root, '.claude-plugin/marketplace.json')
  )
  const cursorMarketplace = loadJSON(
    resolve(root, '.cursor-plugin/marketplace.json')
  )
  for (const [provider, marketplace] of [
    ['Claude', claudeMarketplace],
    ['Cursor', cursorMarketplace]
  ]) {
    if (marketplace.metadata?.version !== packageJson.version) {
      fail(`${provider} marketplace version must match package.json version`)
    }
    if (!marketplace.metadata?.description?.toLowerCase().includes(positioning)) {
      fail(`${provider} marketplace description must include "${positioning}"`)
    }
  }
}

validateCursor()
validateClaude()
validateCodex()
validateConsistency()

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
