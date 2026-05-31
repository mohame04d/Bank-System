export const getResetPasswordHtml = (otp: string) => {
  const title = 'Reset your password';
  const description =
    'You requested to reset your password for your NeuroMeet account. Please use the following One-Time Password (OTP) to continue the password reset process:';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="background-color: #f3f4f6; margin: 0; padding:0px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e3a8a; padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700; letter-spacing: 1px;">NeuroMeet</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 50px 15px;">
              <h2 style="color: #111827; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 24px;">${title}</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                ${description}
              </p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 32px;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #1e40af;">${otp}</span>
              </div>
              
              <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 0;">
                This code will expire shortly. If you did not request a password reset, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0; line-height: 1.5;">
                &copy; ${new Date().getFullYear()} NeuroMeet. All rights reserved.
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
