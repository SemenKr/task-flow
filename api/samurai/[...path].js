const TARGET_ORIGIN = "https://social-network.samuraijs.com/api/1.1"

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

function buildTargetUrl(pathSegments, query) {
  const pathname = Array.isArray(pathSegments)
    ? pathSegments.join("/")
    : pathSegments ?? ""

  const url = new URL(`${TARGET_ORIGIN}/${pathname}`)

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

    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(name, item))
      continue
    }

    headers.set(name, value)
  }

  return headers
}

function getRequestBody(req) {
  if (req.method === "GET" || req.method === "HEAD") {
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

function copyResponseHeaders(upstream, res) {
  upstream.headers.forEach((value, key) => {
    if (RESPONSE_HEADERS_TO_SKIP.has(key.toLowerCase())) {
      return
    }

    res.setHeader(key, value)
  })

  if (typeof upstream.headers.getSetCookie === "function") {
    const cookies = upstream.headers.getSetCookie()

    if (cookies.length > 0) {
      res.setHeader("set-cookie", cookies)
    }
  } else {
    const cookieHeader = upstream.headers.get("set-cookie")

    if (cookieHeader) {
      res.setHeader("set-cookie", cookieHeader)
    }
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

    copyResponseHeaders(upstream, res)
    res.status(upstream.status)
    res.send(Buffer.from(await upstream.arrayBuffer()))
  } catch (error) {
    res.status(502).json({
      message: "Failed to reach Samurai API",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
