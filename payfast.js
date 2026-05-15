/* ============================
   PAWNED — payfast.js
   PayFast payment integration (FIXED)
============================ */

(function () {
  'use strict';

  /* ── PAYFAST CONFIG ── */
  const MERCHANT_ID  = '34978579';
  const MERCHANT_KEY = 'md7dz8adcyi9x';
  const PASSPHRASE   = ''; // Add your passphrase here if you set one in PayFast settings
  const RETURN_URL   = 'https://pawnedera.vercel.app/success.html';
  const CANCEL_URL   = 'https://pawnedera.vercel.app/cancel.html';
  const NOTIFY_URL   = ''; // Optional: your server webhook URL

  /* ── LIVE vs SANDBOX ──
     Change to false when you're ready to go live */
  const SANDBOX_MODE = false;

  const PAYFAST_URL = SANDBOX_MODE
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  /* ── BUILD SIGNATURE ──
     PayFast requires fields in a specific order.
     Empty fields must be excluded entirely.
     Encoding: encodeURIComponent with spaces as '+'. */
  function buildSignature(data) {
    const pfEncode = (val) =>
      encodeURIComponent(String(val).trim()).replace(/%20/g, '+');

    const parts = Object.entries(data)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(([k, v]) => k + '=' + pfEncode(v));

    let str = parts.join('&');
    if (PASSPHRASE) {
      str += '&passphrase=' + pfEncode(PASSPHRASE);
    }

    return SparkMD5.hash(str);
  }

  /* ── LOAD SPARK-MD5 (reliable library) then expose launchPayFast ── */
  (function loadSparkMD5() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/spark-md5@3.0.2/spark-md5.min.js';
    script.onload = definelaunchPayFast;
    script.onerror = function () {
      console.error('Failed to load SparkMD5 — PayFast will not work');
    };
    document.head.appendChild(script);
  })();

  function definelaunchPayFast() {
    /* ── LAUNCH PAYFAST ── */
    window.launchPayFast = function (orderData) {
      const itemName = orderData.items.length === 1
        ? orderData.items[0].name
        : 'PAWNED Order — ' + orderData.items.length + ' items';

      /* PayFast field ORDER matters for signature — keep this sequence */
      const data = {};

      /* Merchant details */
      data.merchant_id  = MERCHANT_ID;
      data.merchant_key = MERCHANT_KEY;

      /* URLs */
      data.return_url = RETURN_URL;
      data.cancel_url = CANCEL_URL;
      if (NOTIFY_URL) data.notify_url = NOTIFY_URL;

      /* Buyer info — only add if non-empty */
      if (orderData.firstName) data.name_first    = orderData.firstName;
      if (orderData.lastName)  data.name_last     = orderData.lastName;
      if (orderData.email)     data.email_address = orderData.email;
      if (orderData.phone)     data.cell_number   = orderData.phone;

      /* Transaction details */
      data.m_payment_id = orderData.orderNumber;
      data.amount       = Number(orderData.total).toFixed(2);
      data.item_name    = itemName;

      const description = orderData.items.map(i => i.qty + 'x ' + i.name).join(', ');
      if (description) data.item_description = description;

      /* Custom fields — only if non-empty */
      if (orderData.address)  data.custom_str1 = orderData.address;
      if (orderData.city)     data.custom_str2 = orderData.city;
      if (orderData.province) data.custom_str3 = orderData.province;
      if (orderData.postal)   data.custom_str4 = orderData.postal;

      /* Email confirmation */
      data.email_confirmation = '1';
      if (orderData.email) data.confirmation_address = orderData.email;

      /* Generate signature */
      data.signature = buildSignature(data);

      /* Build and auto-submit the form */
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = PAYFAST_URL;
      form.style.display = 'none';

      Object.entries(data).forEach(function ([key, value]) {
        if (value === '' || value === null || value === undefined) return;
        const input = document.createElement('input');
        input.type  = 'hidden';
        input.name  = key;
        input.value = String(value).trim();
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    };
  }

})();
