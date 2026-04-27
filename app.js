const BACKEND_URL = 'https://bae-back-end.onrender.com';
let unifiedPayments = null;

async function start() {
    const status = document.getElementById('payment-form');
    const errDisplay = document.getElementById('error-display');

    try {
        // 1. Check if the bank script loaded
        if (typeof Accept === 'undefined') {
            throw new Error("Bank security script blocked. Try Incognito mode or a different network.");
        }

        // 2. Get the session from your backend
        const res = await fetch(`${BACKEND_URL}/api/capture-context`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: "0.10",
                currency: "JOD",
                targetOrigin: window.location.origin
            })
        });

        const data = await res.json();
        
        // If your backend sent the 401 error, show it clearly
        if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);

        const captureContext = data.captureContext || data.token || data;

        // 3. Mount the card form
        const accept = await Accept(captureContext);
        unifiedPayments = await accept.unifiedPayments();
        await unifiedPayments.show({ containers: { paymentSelection: '#payment-form' } });
        status.style.border = 'none';

    } catch (err) {
        console.error(err);
        status.innerText = "❌ Session Failed";
        errDisplay.innerText = err.message;
    }
}

async function handlePayment() {
    try {
        const transientToken = await unifiedPayments.complete();
        const res = await fetch(`${BACKEND_URL}/api/finalize-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transientToken })
        });
        const result = await res.json();
        alert(result.status === 'COMPLETED' ? "✅ Payment Success!" : "❌ Payment Failed");
    } catch (err) {
        alert("Payment Error: " + err.message);
    }
}

window.onload = start;
