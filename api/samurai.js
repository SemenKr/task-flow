const TARGET_ORIGIN = "https://social-network.samuraijs.com/api/1.1"

const REQUEST_HEADERS_TO_FORWARD = new Set([
  "accept",
  "accept-language",
  "api-key",
  "authorization",
  "content-type",
  "cookie",
  "origin",
  "referer",
  "user-agent",
])

const RESPONSE_HEADERS_TO_SKIP = new Set(["content-length", "transfer-encoding"])

function getPublicOrigin(req) {
  const protocolHeader = req.headers["x-forwarded-proto"]
  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host
  const protocol = Array.isArray(protocolHeader) ? protocolHeader[0] : protocolHeader || "https"
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader

  if (!host) {
    return null
  }

  return `${protocol}://${host}`
}

function buildUpstreamUrl(req) {
  const basePath = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path || ""
  const upstreamUrl = new URL(`${TARGET_ORIGIN}/${basePath.replace(/^\/+/, "")}`)

  for (const [key, value] of Object.entries(req.query)) {
    if (key === "path") continue

    if (Array.isArray(value)) {
      value.forEach((item) => upstreamUrl.searchParams.append(key, item))
      continue
    }

    if (value !== undefined) {
      upstreamUrl.searchParams.append(key, value)
    }
  }

  return upstreamUrl
}

function buildRequestHeaders(req) {
  const headers = new Headers()
  const publicOrigin = getPublicOrigin(req)

  for (const [key, value] of Object.entries(req.headers)) {
    if (!REQUEST_HEADERS_TO_FORWARD.has(key.toLowerCase())) continue
    if (value === undefined) continue

    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(key, item))
      continue
    }

    headers.set(key, value)
  }

  if (publicOrigin) {
    // Mutating Samurai requests are domain-sensitive. Set explicit public origin/referer.
    headers.set("origin", publicOrigin)
    headers.set("referer", `${publicOrigin}/`)
  }

  return headers
}

function readRequestBody(req) {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined
  }

  if (req.body == null) {
    return undefined
  }

  if (Buffer.isBuffer(req.body) || typeof req.body === "string") {
    return req.body
  }

  return JSON.stringify(req.body)
}

export default async function handler(req, res) {
  try {
    const upstream = await fetch(buildUpstreamUrl(req), {
      method: req.method,
      headers: buildRequestHeaders(req),
      body: await readRequestBody(req),
      redirect: "manual",
    })

    res.status(upstream.status)

    upstream.headers.forEach((value, key) => {
      if (RESPONSE_HEADERS_TO_SKIP.has(key.toLowerCase())) return
      res.setHeader(key, value)
    })

    res.send(Buffer.from(await upstream.arrayBuffer()))
  } catch (error) {
    res.status(502).json({
      message: "Failed to reach Samurai API",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
