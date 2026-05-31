export const getWelcomeEmailHtml = (
  userEmail: string,
  dashboardUrl: string = 'http://localhost:3000/services',
) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to NeuroMeet</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0f14;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0d0f14;padding:0px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;">

          <!-- HEADER -->
<td style="padding: 0;">
  <!-- Apply your NeuroMeet styling to this inner wrapper -->
  <div style="background:linear-gradient(135deg,#0e1a2b 0%,#111827 100%); border-radius:16px 16px 0 0; padding:28px 32px 24px; text-align:center; border-bottom:1px solid rgba(255,255,255,0.07);">
    
    <div style="display:inline-block; background:linear-gradient(90deg,#00d2ff,#7e57c2); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-size:35px; font-weight:800; letter-spacing:-0.5px; margin-bottom:4px;">
      NeuroMeet
    </div>
    
    <div style="color:#6b7280; font-size:12px; letter-spacing:1px; text-transform:uppercase;">
      Welcome aboard
    </div>
    
  </div>
</td>

          <!-- BODY -->
          <tr>
            <td style="background-color:#111827;padding:32px 15px 28px;">
              <h1 style="color:#f9fafb;font-size:20px;font-weight:700;margin:0 0 12px;line-height:1.3;">You're in. Let's get started.</h1>
              <p style="color:#9ca3af;font-size:15px;line-height:1.65;margin:0 0 20px;">
                Hi <strong style="color:#e5e7eb;">${userEmail}</strong>, your NeuroMeet account is ready. You now have full access to high-definition video meetings, seamless collaboration, and everything NeuroMeet has to offer.
              </p>

              <!-- FEATURE PILLS -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td>
                    <div style="display:inline-block;background:rgba(0,210,255,0.08);border:1px solid rgba(0,210,255,0.15);border-radius:8px;padding:10px 14px;margin:0 6px 8px 0;vertical-align:top;min-width:130px;">
                      <div style="color:#00d2ff;font-size:18px;margin-bottom:4px;">&#9654;</div>
                      <div style="color:#e5e7eb;font-size:13px;font-weight:600;">HD Video Calls</div>
                      <div style="color:#6b7280;font-size:12px;">Crystal-clear quality</div>
                    </div>
                    <div style="display:inline-block;background:rgba(126,87,194,0.08);border:1px solid rgba(126,87,194,0.15);border-radius:8px;padding:10px 14px;margin:0 6px 8px 0;vertical-align:top;min-width:130px;">
                      <div style="color:#a78bfa;font-size:18px;margin-bottom:4px;">&#128274;</div>
                      <div style="color:#e5e7eb;font-size:13px;font-weight:600;">End-to-End Secure</div>
                      <div style="color:#6b7280;font-size:12px;">Your privacy, always</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(90deg,#1a768d,#7c3aed);color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:100px;font-size:15px;font-weight:600;letter-spacing:0.2px;">
                      Go to your dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;text-align:center;">
                Questions? Just reply to this email — we're always happy to help.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#0d0f14;border-radius:0 0 16px 16px;padding:18px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="color:#4b5563;font-size:12px;margin:0;line-height:1.6;">
                &copy; ${new Date().getFullYear()} NeuroMeet. All rights reserved.<br>
                This is an automated message — please do not reply directly.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};
