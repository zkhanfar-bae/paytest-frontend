const BACKEND_URL = 'https://bae-back-end.onrender.com'; 
let unifiedPayments = null;

// This function FORCES the script to load into the page
function loadBankScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = "https://flex.cybersource.com/cybersource-unified-checkout.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Bank Script Blocked by Network/Browser"));
    document.head.appendChild(script);
  });
}

async function initCardForm() {
  const mountEl = document.getElementById('payment-form');
  mountEl.innerHTML = 'Establishing secure connection...';

  try {
    // 1. Force the script to load
    await loadBankScript();

    // 2. Ask the backend for the context
    const res = await fetch(`${BACKEND_URL}/api/capture-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: "0.10",
        currency: "JOD",
        targetOrigin: window.location.origin,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error("Backend Error: " + (data.error || res.status));

    const captureContext = data.captureContext || data.token || data;
    
    // 3. Start the UI
    const accept = await Accept(captureContext);
    unifiedPayments = await accept.unifiedPayments();
    
    await unifiedPayments.show({ containers: { paymentSelection: '#payment-form' } });
    mountEl.innerHTML = ''; 

  } catch (err) {
    console.error('System Error:', err);
    mountEl.innerHTML = `<span style="color:#ef4444;font-size:0.8rem">⚠️ ${err.message}</span>`;
  }
}

async function handlePayment() {
  try {
    const transientToken = await unifiedPayments.complete();
    const res = await fetch(`${BACKEND_URL}/api/finalize-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transientToken }),
    });
    const result = await res.json();
    alert(result.status === 'COMPLETED' ? '✅ Success' : '❌ Declined');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

window.addEventListener('load', initCardForm);
