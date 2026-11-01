import React, { Suspense } from 'react';

// HAPUS baris export const dynamic = 'force-dynamic';
const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || "";

// --- SERVICE PENGAMBILAN DATA ---
async function getAccounts() {
  if (!GAS_URL) return { data: [] };
  try {
    const res = await fetch(`${GAS_URL}?action=accounts`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Network response was not ok");
    return await res.json();
  } catch (error) {
    console.error("Gagal memuat saldo:", error);
    return { data: [] }; 
  }
}

async function getTransactions(limit = 100) {
  if (!GAS_URL) return { data: [] };
  try {
    const res = await fetch(`${GAS_URL}?action=transactions&limit=${limit}`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Network response was not ok");
    return await res.json();
  } catch (error) {
    console.error("Gagal memuat transaksi:", error);
    return { data: [] };
  }
}

// --- KOMPONEN KONTEN (ASYNC) ---
// Kita pisahkan bagian yang melakukan Fetch data ke komponen tersendiri
async function DashboardContent() {
  const accountsResponse = await getAccounts();
  const transactionsResponse = await getTransactions(50); 

  const accounts = accountsResponse?.data || [];
  const transactions = transactionsResponse?.data || [];

  return (
    <>
      {/* Seksi Kartu Saldo */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Saldo Sumber Dana</h2>
        {accounts.length === 0 ? (
          <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200">
            Belum ada data saldo atau koneksi ke Spreadsheet gagal.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {accounts.map((acc: any, index: number) => (
              <div key={index} className="p-5 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-sm mb-1">
                  {acc.Account_Name || 'Akun Tidak Dikenal'}
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  Rp {new Intl.NumberFormat('id-ID').format(acc.Current_Balance || 0)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Seksi Tabel Riwayat Transaksi */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Riwayat Transaksi Terakhir</h2>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-sm font-semibold text-gray-600">Tanggal</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Kategori</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Sumber/Tujuan</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      Tidak ada riwayat transaksi yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => {
                    const isIncome = tx.Type === 'income';
                    const isOutcome = tx.Type === 'outcome';
                    const isTransfer = tx.Type === 'transfer';
                    
                    const routeText = isTransfer 
                      ? `${tx.Account_From} → ${tx.Account_To}` 
                      : isIncome ? tx.Account_To : tx.Account_From;

                    return (
                      <tr key={tx.ID} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm text-gray-700">
                          {tx.Timestamp ? new Date(tx.Timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="p-4 text-sm text-gray-900 font-medium">
                          {tx.Category || '-'}
                          {tx.Notes && tx.Notes !== "-" && (
                            <span className="block text-xs text-gray-500 font-normal mt-0.5">{tx.Notes}</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {routeText || '-'}
                        </td>
                        <td className={`p-4 text-sm font-bold text-right ${
                          isIncome ? 'text-green-600' : 
                          isOutcome ? 'text-red-600' : 
                          'text-gray-800'
                        }`}>
                          {isIncome ? '+' : isOutcome ? '-' : ''}
                          Rp {new Intl.NumberFormat('id-ID').format(tx.Amount || 0)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

// --- KOMPONEN UTAMA (HALAMAN) ---
export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Dashboard akan di-render secara statis saat build */}
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Dasbor Keuangan</h1>
          <p className="text-gray-500 mt-1">Pantau arus kas dan saldo sumber dana Anda secara real-time.</p>
        </header>

        {/* Suspense akan menangani proses fetch data (streaming UI) */}
        <Suspense fallback={
          <div className="p-12 text-center text-gray-500 animate-pulse">
            Menghubungkan ke database...
          </div>
        }>
          <DashboardContent />
        </Suspense>

      </div>
    </main>
  );
}
