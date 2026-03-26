const TARGET_ORIGIN = "https://social-network.samuraijs.com/api/1.1"
const BODYLESS_METHODS = new Set(["GET", "HEAD"])

const FORWARDED_REQUEST_HEADERS = new Set([
  "accept",
  "api-key",
  "authorization",
  "content-type",
  "cookie",
  "user-agent",
])

const RESPONSE_HEADERS_TO_SKIP = new Set([
  "content-length",
  "set-cookie",
  "transfer-encoding",
])

function appendHeaderValue(headers, name, value) {
  if (Array.isArray(value)) {
    value.forEach((item) => headers.append(name, item))
    return
  }

  headers.set(name, value)
}

function appendQueryParams(url, query) {
  for (const [key, value] of Object.entries(query)) {
    if (key === "path" || value == null) {
      continue
    }

    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, item))
      continue
    }

    url.searchParams.append(key, value)
  }
}

function getTargetPath(pathValue) {
  return Array.isArray(pathValue) ? pathValue.join("/") : pathValue ?? ""
}

function buildTargetUrl(pathValue, query) {
  const url = new URL(`${TARGET_ORIGIN}/${getTargetPath(pathValue)}`)
  appendQueryParams(url, query)
  return url
}

function createUpstreamHeaders(sourceHeaders) {
  const headers = new Headers()

  for (const [name, value] of Object.entries(sourceHeaders)) {
    if (value == null) {
      continue
    }

    const normalizedName = name.toLowerCase()

    if (!FORWARDED_REQUEST_HEADERS.has(normalizedName)) {
      continue
    }

    appendHeaderValue(headers, name, value)
  }

  return headers
}

function getRequestBody(req) {
  if (BODYLESS_METHODS.has(req.method)) {
    return undefined
  }

  if (req.body == null || req.body === "") {
    return undefined
  }

  if (Buffer.isBuffer(req.body) || typeof req.body === "string") {
    return req.body
  }

  return JSON.stringify(req.body)
}

function getSetCookieHeader(upstreamHeaders) {
  if (typeof upstreamHeaders.getSetCookie === "function") {
    const cookies = upstreamHeaders.getSetCookie()
    return cookies.length > 0 ? cookies : null
  }

  return upstreamHeaders.get("set-cookie")
}

function copyResponseHeaders(upstreamHeaders, res) {
  upstreamHeaders.forEach((value, key) => {
    if (RESPONSE_HEADERS_TO_SKIP.has(key.toLowerCase())) {
      return
    }

    res.setHeader(key, value)
  })

  const setCookieHeader = getSetCookieHeader(upstreamHeaders)

  if (setCookieHeader) {
    res.setHeader("set-cookie", setCookieHeader)
  }
}

export default async function handler(req, res) {
  const targetUrl = buildTargetUrl(req.query.path, req.query)

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: createUpstreamHeaders(req.headers),
      body: getRequestBody(req),
      redirect: "manual",
    })

    copyResponseHeaders(upstream.headers, res)
    res.status(upstream.status)
    res.send(Buffer.from(await upstream.arrayBuffer()))
  } catch (error) {
    res.status(502).json({
      message: "Failed to reach Samurai API",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
