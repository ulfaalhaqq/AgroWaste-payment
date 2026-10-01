type SnapCallbacks = {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
};

type SnapHolder = {
  snap?: { pay: (token: string, options: SnapCallbacks) => void };
};

function getSnap() {
  return (window as unknown as SnapHolder).snap;
}

export function loadMidtransScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (getSnap()) {
      resolve();
      return;
    }
    const existing = document.getElementById("midtrans-snap-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
    );
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap."));
    document.body.appendChild(script);
  });
}

export function openSnap(token: string, callbacks: SnapCallbacks) {
  const snap = getSnap();
  if (!snap) throw new Error("Midtrans Snap belum siap.");
  snap.pay(token, callbacks);
}