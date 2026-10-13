
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.AA_PROXY_PORT || 8787;

app.use((req, res, next) => {
  if (
    !process.env.AA_PROXY_SECRET ||
    req.headers["x-aa-proxy-secret"] !== process.env.AA_PROXY_SECRET
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

async function sendResponse(upstream, res) {
  const contentType = upstream.headers.get("content-type");
  if (contentType) res.set("content-type", contentType);

  const data = Buffer.from(await upstream.arrayBuffer());
  return res.status(upstream.status).send(data);
}

// Setu authentication: credentials remain on your computer.
app.post("/login", async (req, res) => {
  try {
    const upstream = await fetch(
      "https://accountservice.setu.co/v1/users/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          client: "bridge",
        },
        body: JSON.stringify({
          clientID: process.env.SETU_CLIENT_ID,
          secret: process.env.SETU_CLIENT_SECRET,
          grant_type: "client_credentials",
        }),
      }
    );

    return await sendResponse(upstream, res);
  } catch (error) {
    return res.status(502).json({ error: "Setu login proxy failed" });
  }
});

// Forward AA API requests to Setu's configured AA endpoint.
app.use("/aa", async (req, res) => {
  try {
    if (!process.env.SETU_AA_BASE_URL) {
      return res.status(500).json({ error: "AA base URL missing" });
    }

    const target = new URL(req.url, process.env.SETU_AA_BASE_URL);
    const headers = { "Content-Type": "application/json" };

    for (const name of ["authorization", "x-product-instance-id", "accept"]) {
      if (req.headers[name]) headers[name] = req.headers[name];
    }

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method)
        ? undefined
        : req.body === undefined
          ? undefined
          : JSON.stringify(req.body),
    });

    return await sendResponse(upstream, res);
  } catch (error) {
    return res.status(502).json({ error: "Setu AA proxy request failed" });
  }
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Local AA proxy running on http://127.0.0.1:${PORT}`);
});
