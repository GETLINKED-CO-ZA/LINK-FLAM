
// Vercel serverless function: receives LINK FLAM applications and sends them to Brevo.
// Environment variables must be configured in Vercel, never in GitHub:
// BREVO_API_KEY
// ADMIN_EMAIL
// SENDER_EMAIL
// BREVO_LIST_ID (optional)

const esc = s =>
  String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

const labels = {
  name: "Full name and surname",
  phone: "Contact number",
  email: "Email address",
  city: "City",
  contact: "Preferred contact method",
  skill: "Primary skill or service",
  skills: "Additional skills",
  bio: "Professional biography",
  links: "Portfolio / Work links",
  pricing: "Pricing method",
  range: "Typical price range",
  negotiable: "Negotiable rates",
  hours: "Weekly availability",
  weekends: "Weekends and public holidays",
  why: "Reasons for joining LINK",
  contribute: "Expected contribution",
  market: "Marketplace understanding",
  understand: "Understanding of LINK's structure",
  payment: "Payment structure acceptance",
  withhold: "Payment dispute policy",
  professional: "Professional conduct agreement",
  equip: "Equipment availability",
  needs: "Equipment requirements",
  ready: "Readiness to join",
  accurate: "Information accuracy confirmation",
  notes: "Additional notes",
  terms: "Terms and conditions acceptance"
};

const sections = [
  {
    title: "01 · Applicant details",
    keys: ["name", "email", "phone", "city", "contact"]
  },
  {
    title: "02 · Professional profile",
    keys: ["skill", "skills", "bio", "links"]
  },
  {
    title: "03 · Pricing",
    keys: ["pricing", "range", "negotiable"]
  },
  {
    title: "04 · Availability",
    keys: ["hours", "weekends"]
  },
  {
    title: "05 · Motivation",
    keys: ["why", "contribute"]
  },
  {
    title: "06 · Understanding LINK",
    keys: ["market", "understand", "payment", "withhold", "professional"]
  },
  {
    title: "07 · Equipment",
    keys: ["equip", "needs"]
  },
  {
    title: "08 · Final confirmation",
    keys: ["ready", "accurate", "notes", "terms"]
  }
];

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.length ? value.map(esc).join(", ") : "Not provided";
  }

  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "object") {
    return esc(JSON.stringify(value));
  }

  return esc(value).replace(/\n/g, "<br>");
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg"
  }).format(date);
}

// Build the premium LINK office notification.
function buildAdminEmail(d) {
  const usedKeys = new Set(["submittedAt"]);

  const sectionHtml = sections.map(section => {
    const rows = section.keys
      .filter(key => Object.prototype.hasOwnProperty.call(d, key))
      .map(key => {
        usedKeys.add(key);

        return `
          <tr>
            <td style="
              padding:12px 14px;
              width:34%;
              vertical-align:top;
              color:#806f60;
              font-size:13px;
              font-weight:600;
              border-bottom:1px solid #e9dfd0;
            ">
              ${esc(labels[key] || key)}
            </td>
            <td style="
              padding:12px 14px;
              vertical-align:top;
              color:#382a24;
              font-size:14px;
              line-height:1.7;
              border-bottom:1px solid #e9dfd0;
              word-break:break-word;
            ">
              ${formatValue(d[key])}
            </td>
          </tr>
        `;
      }).join("");

    if (!rows) return "";

    return `
      <table role="presentation" width="100%" cellpadding="0"
        cellspacing="0" border="0"
        style="margin:0 0 22px;border-collapse:collapse;
        background:#fffdf8;border:1px solid #e9dfd0;
        border-radius:8px;overflow:hidden;">

        <tr>
          <td colspan="2" style="
            padding:14px 16px;
            background:#3a1212;
            color:#d4af37;
            font-family:Georgia,serif;
            font-size:18px;
            letter-spacing:.3px;
          ">
            ${esc(section.title)}
          </td>
        </tr>

        ${rows}
      </table>
    `;
  }).join("");

  // Preserve any additional fields added to the form in future.
  const extraRows = Object.entries(d)
    .filter(([key]) => !usedKeys.has(key))
    .map(([key, value]) => `
      <tr>
        <td style="padding:12px 14px;color:#806f60;
          font-size:13px;font-weight:600;
          border-bottom:1px solid #e9dfd0;">
          ${esc(labels[key] || key)}
        </td>
        <td style="padding:12px 14px;color:#382a24;
          font-size:14px;line-height:1.7;
          border-bottom:1px solid #e9dfd0;">
          ${formatValue(value)}
        </td>
      </tr>
    `).join("");

  const extraSection = extraRows ? `
    <table role="presentation" width="100%" cellpadding="0"
      cellspacing="0" border="0"
      style="margin-bottom:22px;background:#fffdf8;
      border:1px solid #e9dfd0;border-collapse:collapse;">
      <tr>
        <td colspan="2" style="padding:14px 16px;
          background:#3a1212;color:#d4af37;
          font-family:Georgia,serif;font-size:18px;">
          Additional information
        </td>
      </tr>
      ${extraRows}
    </table>
  ` : "";

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>New LINK FLAM Application</title>
  </head>

  <body style="
    margin:0;padding:0;
    background:#f0e8dc;
    font-family:Arial,Helvetica,sans-serif;
    color:#382a24;
  ">

    <!-- Hidden inbox preview -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      A new professional has applied to join the LINK network.
    </div>

    <table role="presentation" width="100%" cellpadding="0"
      cellspacing="0" border="0" style="background:#f0e8dc;">

      <tr>
        <td align="center" style="padding:28px 12px;">

          <table role="presentation" width="100%" cellpadding="0"
            cellspacing="0" border="0"
            style="max-width:680px;background:#f9f5ed;
            border:1px solid #d8c8ad;">

            <!-- HEADER -->
            <tr>
              <td align="center" style="
                padding:38px 24px 34px;
                background:#2a0c0c;
              ">

                <div style="
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:25px;
                  letter-spacing:9px;
                  color:#d4af37;
                ">
                  LINK
                </div>

                <div style="
                  width:48px;height:2px;
                  background:#d4af37;
                  margin:19px auto;
                "></div>

                <div style="
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:30px;
                  line-height:1.25;
                  color:#f4ead8;
                ">
                  A new connection.
                </div>

                <div style="
                  margin-top:10px;
                  color:#c9b99f;
                  font-size:13px;
                  letter-spacing:1px;
                ">
                  LINK FLAM · PROFESSIONAL NETWORK
                </div>

              </td>
            </tr>

            <!-- GOLD ACCENT -->
            <tr>
              <td style="height:3px;background:#d4af37;"></td>
            </tr>

            <!-- INTRODUCTION -->
            <tr>
              <td style="padding:32px 28px 22px;">

                <div style="
                  color:#1b7b61;
                  font-size:11px;
                  font-weight:bold;
                  letter-spacing:2px;
                  text-transform:uppercase;
                ">
                  NEW APPLICATION RECEIVED
                </div>

                <h1 style="
                  margin:10px 0;
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:28px;
                  font-weight:normal;
                  color:#7b1c1c;
                  line-height:1.3;
                ">
                  ${esc(d.name)}
                </h1>

                <p style="
                  margin:0;
                  color:#806f60;
                  font-size:14px;
                  line-height:1.8;
                ">
                  A new professional has submitted an application
                  to join the LINK network. Their information is
                  presented below for review.
                </p>

                <table role="presentation" width="100%"
                  cellpadding="0" cellspacing="0"
                  style="margin-top:22px;background:#eee5d5;">
                  <tr>
                    <td style="padding:15px 17px;">
                      <div style="
                        color:#806f60;
                        font-size:11px;
                        letter-spacing:1px;
                        text-transform:uppercase;
                      ">
                        APPLICATION RECEIVED
                      </div>
                      <div style="
                        margin-top:5px;
                        color:#3a1212;
                        font-size:14px;
                        font-weight:bold;
                      ">
                        ${esc(formatDate(d.submittedAt))}
                        <span style="font-weight:normal;">
                          · South African time
                        </span>
                      </div>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- APPLICATION DETAILS -->
            <tr>
              <td style="padding:8px 28px 20px;">
                ${sectionHtml}
                ${extraSection}
              </td>
            </tr>

            <!-- ACTION -->
            <tr>
              <td align="center" style="padding:8px 28px 35px;">

                <a href="mailto:${esc(d.email)}"
                  style="
                    display:inline-block;
                    padding:14px 28px;
                    background:#7b1c1c;
                    color:#f4ead8;
                    text-decoration:none;
                    font-size:13px;
                    font-weight:bold;
                    letter-spacing:.5px;
                    border:1px solid #d4af37;
                  ">
                  REPLY TO APPLICANT
                </a>

                <p style="
                  margin:17px 0 0;
                  color:#806f60;
                  font-size:12px;
                ">
                  Reply directly to this applicant using your email client.
                </p>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="
                padding:27px 20px;
                background:#2a0c0c;
              ">

                <div style="
                  color:#d4af37;
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:19px;
                  letter-spacing:5px;
                ">
                  LINK
                </div>

                <p style="
                  margin:13px 0;
                  color:#f4ead8;
                  font-size:12px;
                  letter-spacing:1px;
                ">
                  CONNECT. GROW. MOVE FORWARD.
                </p>

                <div style="
                  width:40px;height:1px;
                  background:#d4af37;
                  margin:15px auto;
                "></div>

                <p style="
                  margin:0;
                  color:#c9b99f;
                  font-size:11px;
                  line-height:1.8;
                ">
                  LINK (PTY) LTD<br>
                  Independent professionals. Connected opportunities.<br>
                  SECURE. SAFE. SWIFT.
                </p>

              </td>
            </tr>

          </table>

          <p style="
            margin:18px 0 0;
            color:#806f60;
            font-size:10px;
            text-align:center;
          ">
            Automated notification · LINK FLAM
          </p>

        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const d = req.body || {};

  if (!d.name || !d.email || !/^\S+@\S+\.\S+$/.test(d.email)) {
    return res.status(400).json({
      error: "Missing name or valid email"
    });
  }

  const key = process.env.BREVO_API_KEY;
  const admin = process.env.ADMIN_EMAIL;
  const sender = process.env.SENDER_EMAIL;

  if (!key || !admin || !sender) {
    return res.status(500).json({
      error: "Server not configured"
    });
  }

  const headers = {
    "api-key": key,
    "content-type": "application/json",
    accept: "application/json"
  };

  const [first, ...rest] = String(d.name).trim().split(/\s+/);

  try {
    // 1. Save or update applicant as a Brevo contact.
    const contact = {
      email: d.email,
      updateEnabled: true,
      attributes: {
        FIRSTNAME: first,
        LASTNAME: rest.join(" "),
        SMS: undefined
      }
    };

    if (process.env.BREVO_LIST_ID) {
      contact.listIds = [Number(process.env.BREVO_LIST_ID)];
    }

    await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers,
      body: JSON.stringify(contact)
    });

    // 2. Send the redesigned application notification to LINK.
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers,
      body: JSON.stringify({
        sender: {
          name: "LINK FLAM",
          email: sender
        },
        to: [{
          email: admin
        }],
        replyTo: {
          email: d.email,
          name: d.name
        },
        subject: `New LINK FLAM application | ${d.name}`,
        htmlContent: buildAdminEmail(d)
      })
    });

    if (!r.ok) {
      throw new Error("Brevo admin email failed");
    }

    // 3. Applicant confirmation email.
    // PRESERVED: Original welcome email design and wording.
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers,
      body: JSON.stringify({
        sender: {
          name: "LINK",
          email: sender
        },
        to: [{
          email: d.email,
          name: d.name
        }],
        subject: "Welcome to LINK",
        htmlContent: `
          <p>Hi ${esc(first)},</p>
          <p>Thank you for applying to join LINK. We have received your details and will be in touch by your preferred method of contact.</p>
          <p>LINK is a marketplace platform. You operate as an independent service provider.</p>
        `
      })
    });

    return res.status(200).json({ ok: true });

  } catch (e) {
    return res.status(500).json({
      error: "Could not process application"
    });
  }
}
