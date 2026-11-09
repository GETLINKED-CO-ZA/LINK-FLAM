// Vercel serverless function: receives the form and sends it to Brevo.
// Set these in Vercel > Project > Settings > Environment Variables (never in GitHub):
//   BREVO_API_KEY   your Brevo API key
//   ADMIN_EMAIL     where applications should be sent (e.g. hello@yourdomain.co.za)
//   SENDER_EMAIL    a sender address verified in Brevo
//   BREVO_LIST_ID   (optional) numeric ID of a Brevo contact list

const esc = s => String(s ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const d = req.body || {};
  if (!d.name || !d.email || !/^\S+@\S+\.\S+$/.test(d.email)) {
    return res.status(400).json({ error: "Missing name or valid email" });
  }

  const key = process.env.BREVO_API_KEY;
  const admin = process.env.ADMIN_EMAIL;
  const sender = process.env.SENDER_EMAIL;
  if (!key || !admin || !sender) return res.status(500).json({ error: "Server not configured" });

  const headers = { "api-key": key, "content-type": "application/json", accept: "application/json" };
  const [first, ...rest] = String(d.name).trim().split(/\s+/);

  try {
    // 1. Save as a Brevo contact (updates if the email already exists)
    const contact = {
      email: d.email,
      updateEnabled: true,
      attributes: { FIRSTNAME: first, LASTNAME: rest.join(" "), SMS: undefined }
    };
    if (process.env.BREVO_LIST_ID) contact.listIds = [Number(process.env.BREVO_LIST_ID)];
    await fetch("https://api.brevo.com/v3/contacts", { method: "POST", headers, body: JSON.stringify(contact) });

    // 2. Email the full application to LINK admin
    const rows = Object.entries(d)
      .map(([k, v]) => `<tr><td style="padding:6px 10px;border:1px solid #ddd"><b>${esc(k)}</b></td><td style="padding:6px 10px;border:1px solid #ddd">${esc(Array.isArray(v) ? v.join(", ") : v)}</td></tr>`)
      .join("");
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers,
      body: JSON.stringify({
        sender: { name: "LINK Sign-ups", email: sender },
        to: [{ email: admin }],
        replyTo: { email: d.email, name: d.name },
        subject: `New LINK professional: ${d.name}`,
        htmlContent: `<h2>New application</h2><table style="border-collapse:collapse">${rows}</table>`
      })
    });
    if (!r.ok) throw new Error("Brevo email failed");

    // 3. Confirmation email to the applicant
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers,
      body: JSON.stringify({
        sender: { name: "LINK", email: sender },
        to: [{ email: d.email, name: d.name }],
        subject: "Welcome to LINK",
        htmlContent: `<p>Hi ${esc(first)},</p><p>Thank you for applying to join LINK. We have received your details and will be in touch by your preferred method of contact.</p><p>LINK is a marketplace platform. You operate as an independent service provider.</p>`
      })
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Could not process application" });
  }
}
