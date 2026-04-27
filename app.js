const BACKEND_URL = 'https://bae-back-end.onrender.com'; 
const ORDER_CURRENCY = 'JOD';
let ORDER_AMOUNT = 0.10;
let unifiedPayments = null;

async function initCardForm() {
  const mountEl = document.getElementById('payment-form');
  try {
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
    const captureContext = data.captureContext || data.token || data;
    const accept = await Accept(captureContext);
    unifiedPayments = await accept.unifiedPayments();
    await unifiedPayments.show({ containers: { paymentSelection: '#payment-form' } });
  } catch (err) {
    console.error('Failed to load card form:', err);
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
    alert(result.status === 'COMPLETED' ? 'Success!' : 'Failed');
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

window.addEventListener('DOMContentLoaded', initCardForm);
