const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL;

export async function getAccounts() {
  const res = await fetch(`${GAS_URL}?action=accounts`, { cache: 'no-store' });
  return res.json();
}

export async function getTransactions(limit = 100) {
  const res = await fetch(`${GAS_URL}?action=transactions&limit=${limit}`, { cache: 'no-store' });
  return res.json();
}
