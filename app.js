// 1. BE SURE to keep your real backend URL here!
const BACKEND_URL = 'https://bae-back-end.onrender.com'; 
const ORDER_CURRENCY = 'JOD';
let ORDER_AMOUNT = 0.10;
let unifiedPayments = null;

// This function waits until the bank's "Accept" tool is actually ready
async function waitForAccept(timeout = 5000) {
  const start = Date.now();
  while (typeof Accept === 'undefined') {
    if (Date.now() - start > timeout) throw new Error("Bank SDK failed to load. Check your internet or ad-blocker.");
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function initCardForm() {
  const mountEl = document.getElementById('payment-form');
  mountEl.innerHTML = 'Loading secure fields...';

  try {
    // Wait for the script to actually exist in the browser memory
    await waitForAccept();

    const res = await fetch(`${BACKEND_URL}/api/capture-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: ORDER_AMOUNT.toFixed(2),
        currency: ORDER_CURRENCY,
        targetOrigin: window.location.origin,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Backend error');

    const captureContext = data.captureContext || data.token || data;
    
    // Now that we know 'Accept' exists, we call it
    const accept = await Accept(captureContext);
    unifiedPayments = await accept.unifiedPayments();
    
    await unifiedPayments.show({ 
      containers: { paymentSelection: '#payment-form' } 
    });
    
    mountEl.innerHTML = ''; // Clear the loading text
  } catch (err) {
    console.error('Frontend Error:', err);
    mountEl.innerHTML = `<span style="color:red">⚠️ ${err.message}</span>`;
  }
}

async function handlePayment() {
  const btn = document.getElementById('pay-btn');
  btn.disabled = true;
  btn.innerText = 'Processing...';

  try {
    if (!unifiedPayments) throw new Error("Payment form not ready.");
    
    const transientToken = await unifiedPayments.complete();
    
    const res = await fetch(`${BACKEND_URL}/api/finalize-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transientToken }),
    });
    
    const result = await res.json();
    alert(result.status === 'COMPLETED' ? '✅ Payment Successful!' : '❌ Payment Declined');
  } catch (err) {
    alert('❌ Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = 'Pay JOD 0.10';
  }
}

window.addEventListener('DOMContentLoaded', initCardForm);
