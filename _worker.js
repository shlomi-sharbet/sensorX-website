// _worker.js
// Cloudflare Worker entrypoint with Static Assets & Serverless API Routing

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route API contact requests to our serverless handler
    if (url.pathname.startsWith('/api/contact')) {
      return handleContact(request, env);
    }

    // Serve static assets (HTML, CSS, JS, images, videos)
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleContact(request, env) {
  // CORS & Security headers
  const jsonHeaders = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*'
  };

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: jsonHeaders
    });
  }

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

    let emailSent = false;
    let emailStatusMessage = '';

    // Send via Cloudflare Native Email Service / Email Routing
    if (env.EMAIL && typeof env.EMAIL.send === 'function') {
      try {
        // Attempt 1: Modern Cloudflare Email Service format
        await env.EMAIL.send({
          to: [{ email: recipient, name: "Sensorix Management" }],
          from: { email: sender, name: "אתר סנסוריקס" },
          subject: subject,
          text: `התקבלה פנייה חדשה מאתר Sensorix:\nשם הפונה: ${safeName}\nדוא"ל: ${safeEmail}\nטלפון: ${safePhone || 'לא צוין'}\nתחום: ${safeService}\nהודעה: ${safeMessage || 'ללא תוכן נוסף'}`,
          html: htmlBody
        });
        emailSent = true;
        emailStatusMessage = 'נשלח בהצלחה דרך Cloudflare Email Service';
        console.log('Email sent successfully via Cloudflare Email Service to', recipient);
      } catch (modernErr) {
        console.warn('Modern send_email failed, attempting fallback to MIME EmailMessage:', modernErr.message);
        try {
          // Attempt 2: Fallback to raw MIME EmailMessage
          const rawMime = [
            `From: "אתר סנסוריקס" <${sender}>`,
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
          emailSent = true;
          emailStatusMessage = 'נשלח בהצלחה דרך MIME EmailMessage';
          console.log('Email sent successfully via MIME EmailMessage to', recipient);
        } catch (mimeErr) {
          console.error('All Cloudflare Email Routing attempts failed:', mimeErr);
          emailStatusMessage = `שגיאה בשליחת מייל מ-Cloudflare: ${mimeErr.message || modernErr.message}`;
        }
      }
    } else {
      emailStatusMessage = 'חיבור env.EMAIL אינו מוגדר או פעיל ב-Cloudflare Worker זה';
      console.log(emailStatusMessage, { safeName, safeEmail, safePhone, safeService });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'פנייתך התקבלה בהצלחה! צוות Sensorix יחזור אליך בהקדם.',
      emailDelivery: {
        sent: emailSent,
        details: emailStatusMessage,
        recipient: recipient,
        sender: sender
      }
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
