// functions/api/contact.js
// Cloudflare Pages Serverless Function for Sensorix Contact Form
// Handles: Cloudflare Turnstile Verification, Honeypot Anti-Spam, Input Sanitization (OWASP A03),
// and resilient Cloudflare Email Dispatch (send_email binding)

export async function onRequestPost(context) {
  const { request, env } = context;

  // Set standard CORS & security headers
  const jsonHeaders = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff'
  };

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Unsupported Content-Type. Expected application/json' }), {
        status: 415,
        headers: jsonHeaders
      });
    }

    const data = await request.json();
    const { name, email, phone, service, message, turnstileToken, _hp_check } = data;

    // 1. Honeypot check (RTL-safe trap field - drop automated bots silently)
    if (_hp_check) {
      return new Response(JSON.stringify({ success: true, message: 'Message received' }), {
        status: 200,
        headers: jsonHeaders
      });
    }

    // 2. Cloudflare Turnstile Verification [MANDATORY]
    if (env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const ip = request.headers.get('CF-Connecting-IP') || '';
      const turnstileFormData = new FormData();
      turnstileFormData.append('secret', env.TURNSTILE_SECRET_KEY);
      turnstileFormData.append('response', turnstileToken);
      turnstileFormData.append('remoteip', ip);

      const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: turnstileFormData
      });
      const turnstileOutcome = await turnstileRes.json();
      if (!turnstileOutcome.success) {
        const errorCodes = turnstileOutcome['error-codes'] ? turnstileOutcome['error-codes'].join(', ') : 'unknown';
        console.error('Turnstile verification failed:', errorCodes);
        return new Response(JSON.stringify({
          error: `אימות האבטחה (Turnstile) נכשל מול השרת (${errorCodes}). אנא ודא שה-TURNSTILE_SECRET_KEY תואם ל-Sitekey של הווידג'ט.`
        }), {
          status: 403,
          headers: jsonHeaders
        });
      }
    } else if (env.TURNSTILE_SECRET_KEY && !turnstileToken) {
      return new Response(JSON.stringify({ error: 'יש להשלים את אימות האבטחה של Cloudflare Turnstile לפני השליחה.' }), {
        status: 400,
        headers: jsonHeaders
      });
    }

    // 3. Strict Input Length Validation & Sanitization (OWASP A03)
    if (!name || name.trim().length < 2 || name.length > 60) {
      return new Response(JSON.stringify({ error: 'נא להזין שם תקין (2 עד 60 תווים)' }), {
        status: 422,
        headers: jsonHeaders
      });
    }

    if (!email || !email.includes('@') || email.length > 100) {
      return new Response(JSON.stringify({ error: 'נא להזין כתובת אימייל תקינה' }), {
        status: 422,
        headers: jsonHeaders
      });
    }

    const safeName = name.replace(/[<>&"']/g, '').trim();
    const safeEmail = email.replace(/[<>&"']/g, '').trim();
    const safePhone = (phone || '').replace(/[<>&"']/g, '').trim();
    const safeService = (service || 'פנייה כללית').replace(/[<>&"']/g, '').trim();
    const safeMessage = (message || '').slice(0, 1000).replace(/[<>&"']/g, '').trim();

    // 4. Construct Email Message & Send via Cloudflare Native Binding
    const recipient = env.BUSINESS_ALERT_EMAIL || 'shlomi.sharbet@gmail.com';
    const sender = env.FROM_EMAIL || 'leads@sensorix.co.il';
    const subject = `ליד חדש מאתר Sensorix: ${safeName} (${safeService})`;

    const htmlBody = `
      <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e0e0e0;">
          <h2 style="color: #FF7A18; margin-top: 0;">התקבלה פנייה חדשה מאתר Sensorix</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">שם הפונה:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">דוא"ל:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">טלפון:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="tel:${safePhone}">${safePhone || 'לא צוין'}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">תחום הפרויקט:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${safeService}</td>
            </tr>
          </table>
          <div style="margin-top: 20px;">
            <p style="font-weight: bold; margin-bottom: 8px;">פרטי הפרויקט / הודעה:</p>
            <div style="background: #f4f5f7; padding: 16px; border-radius: 6px; border-right: 4px solid #FF7A18; line-height: 1.6;">
              ${safeMessage || 'לא הוזנה הודעה נוספת'}
            </div>
          </div>
          <p style="font-size: 12px; color: #888; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
            נשלח אוטומטית מטופס יצירת הקשר באתר Sensorix | IP: ${request.headers.get('CF-Connecting-IP') || 'N/A'}
          </p>
        </div>
      </div>
    `;

    // Send via Cloudflare Email Routing binding if configured
    if (env.EMAIL && typeof env.EMAIL.send === 'function') {
      try {
        const rawMime = [
          `From: "Sensorix Website" <${sender}>`,
          `To: <${recipient}>`,
          `Reply-To: <${safeEmail}>`,
          `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=utf-8`,
          ``,
          htmlBody
        ].join('\r\n');

        const { EmailMessage } = await import("cloudflare:email");
        const emailMsg = new EmailMessage(sender, recipient, rawMime);
        await env.EMAIL.send(emailMsg);
        console.log('Email sent successfully to', recipient);
      } catch (emailErr) {
        console.error('Email dispatch error via Cloudflare Email Routing:', emailErr);
        // We log the error but don't fail the user submission if lead was already verified
      }
    } else {
      console.log('EMAIL binding not present in Cloudflare Pages. Lead recorded:', { safeName, safeEmail, safePhone, safeService });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'פנייתך התקבלה בהצלחה! צוות Sensorix יחזור אליך בהקדם.'
    }), {
      status: 200,
      headers: jsonHeaders
    });

  } catch (err) {
    console.error('Contact form submission error:', err);
    return new Response(JSON.stringify({
      error: 'אירעה שגיאה בעיבוד הפנייה: ' + (err.message || 'שגיאת שרת פנימית')
    }), {
      status: 500,
      headers: jsonHeaders
    });
  }
}
