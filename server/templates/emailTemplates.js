const baseTemplate = ({ title, preheader, bodyContent }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Preheader (hidden preview text) -->
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e63946 0%,#c1121f 100%);padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">
                🎲 Target Ludo
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;letter-spacing:1px;">
                THE CLASSIC BOARD GAME
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#111122;border-top:1px solid rgba(255,255,255,0.06);padding:24px 32px;text-align:center;">
              <p style="margin:0 0 6px;color:#6b7280;font-size:12px;">
                This is an automated email. Please do not reply.
              </p>
              <p style="margin:0;color:#4b5563;font-size:12px;">
                &copy; ${new Date().getFullYear()} Target Ludo. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;

// ─── Verification Email ───────────────────────────────────────────────────────
export const verificationEmailTemplate = (otp) => baseTemplate({
  title: 'Verify Your Email – Target Ludo',
  preheader: `Your Target Ludo verification code is ${otp}`,
  bodyContent: `
    <h2 style="margin:0 0 12px;color:#f1f5f9;font-size:22px;font-weight:700;">
      Verify Your Email
    </h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.7;">
      Thanks for signing up! Use the code below to verify your email address and start playing.
    </p>

    <!-- OTP Box -->
    <div style="background-color:#0f0f1a;border:2px dashed #e63946;border-radius:12px;padding:28px;text-align:center;margin:0 0 28px;">
      <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
        Your verification code
      </p>
      <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#e63946;font-family:'Courier New',monospace;">
        ${otp}
      </span>
    </div>

    <p style="margin:0 0 8px;color:#64748b;font-size:13px;">
      ⏱ This code expires in <strong style="color:#94a3b8;">10 minutes</strong>.
    </p>
    <p style="margin:0;color:#64748b;font-size:13px;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `,
});

// ─── Password Reset Email ─────────────────────────────────────────────────────
export const passwordResetEmailTemplate = (otp) => baseTemplate({
  title: 'Reset Your Password – Target Ludo',
  preheader: `Your Target Ludo password reset code is ${otp}`,
  bodyContent: `
    <h2 style="margin:0 0 12px;color:#f1f5f9;font-size:22px;font-weight:700;">
      Reset Your Password
    </h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.7;">
      We received a request to reset your password. Use the code below to create a new one.
    </p>

    <!-- OTP Box -->
    <div style="background-color:#0f0f1a;border:2px dashed #f59e0b;border-radius:12px;padding:28px;text-align:center;margin:0 0 28px;">
      <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
        Your reset code
      </p>
      <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#f59e0b;font-family:'Courier New',monospace;">
        ${otp}
      </span>
    </div>

    <p style="margin:0 0 8px;color:#64748b;font-size:13px;">
      ⏱ This code expires in <strong style="color:#94a3b8;">10 minutes</strong>.
    </p>
    <p style="margin:0;color:#64748b;font-size:13px;">
      If you didn't request a password reset, please ignore this email — your password won't change.
    </p>
  `,
});

// ─── Welcome Email ────────────────────────────────────────────────────────────
export const welcomeEmailTemplate = (name) => baseTemplate({
  title: 'Welcome to Target Ludo!',
  preheader: `Welcome aboard, ${name}! Your account is ready.`,
  bodyContent: `
    <h2 style="margin:0 0 12px;color:#f1f5f9;font-size:22px;font-weight:700;">
      Welcome, ${name}! 🎲
    </h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.7;">
      Your email has been verified and your Target Ludo account is ready to go.
      Roll the dice and start your journey!
    </p>

    <!-- Feature highlights -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="background-color:#0f0f1a;border-radius:10px;padding:16px 20px;border-left:3px solid #e63946;">
          <p style="margin:0 0 4px;color:#f1f5f9;font-size:14px;font-weight:600;">🎮 Play vs AI</p>
          <p style="margin:0;color:#64748b;font-size:13px;">Challenge smart AI opponents anytime</p>
        </td>
      </tr>
      <tr><td style="height:10px;"></td></tr>
      <tr>
        <td style="background-color:#0f0f1a;border-radius:10px;padding:16px 20px;border-left:3px solid #2dc653;">
          <p style="margin:0 0 4px;color:#f1f5f9;font-size:14px;font-weight:600;">👥 Multiplayer</p>
          <p style="margin:0;color:#64748b;font-size:13px;">Play with up to 4 players</p>
        </td>
      </tr>
      <tr><td style="height:10px;"></td></tr>
      <tr>
        <td style="background-color:#0f0f1a;border-radius:10px;padding:16px 20px;border-left:3px solid #f4d03f;">
          <p style="margin:0 0 4px;color:#f1f5f9;font-size:14px;font-weight:600;">🏆 Leaderboard</p>
          <p style="margin:0;color:#64748b;font-size:13px;">Climb the ranks and show your skills</p>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#64748b;font-size:13px;">
      Head to Target Ludo and start your first game!
    </p>
  `,
});
