'use client'
import { useState } from 'react';

export default function TransactionForm() {
  // State untuk Keamanan (PIN)
  const [isAuth, setIsAuth] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // State Form Transaksi
  const [type, setType] = useState('outcome');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountFrom, setAccountFrom] = useState('');
  const [accountTo, setAccountTo] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');

  // Fungsi Cek PIN
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === process.env.NEXT_PUBLIC_APP_PIN) {
      setIsAuth(true);
    } else {
      alert('❌ PIN Salah!');
      setPinInput('');
    }
  };

  // Fungsi Simpan Transaksi (Tetap sama seperti sebelumnya)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Menyimpan...');
    const payload = { type, amount, category, account_from: accountFrom, account_to: accountTo, notes };

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_GAS_URL as string, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const result = await response.json(); 
      if (result.status === 200) {
        setStatus('✅ Berhasil disimpan!');
        setAmount(''); setNotes('');
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus(`❌ Gagal: ${result.message}`);
      }
    } catch (error) {
      setStatus('❌ Gagal menghubungi server.');
    }
  };

  // UI LAYAR LOGIN (Jika belum masuk)
  if (!isAuth) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans">
        <form onSubmit={handleLogin} className="w-full max-w-xs bg-[#111111] border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">
          <h1 className="text-xl font-bold text-white text-center">Gembok Aplikasi</h1>
          <input 
            type="password" inputMode="numeric" placeholder="Masukkan PIN" 
            value={pinInput} onChange={(e) => setPinInput(e.target.value)} 
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl text-center text-white tracking-widest focus:outline-none focus:border-blue-500" 
            autoFocus required 
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all">Buka</button>
        </form>
      </main>
    );
  }

return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#111111] border border-gray-800 rounded-2xl shadow-2xl p-6 md:p-8">
        
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">Catat Transaksi</h1>
          <p className="text-gray-400 text-sm mt-1">Lacak pengeluaran dan pemasukanmu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Tipe Transaksi */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 ml-1">Jenis Transaksi</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none"
            >
              <option value="outcome">📉 Pengeluaran</option>
              <option value="income">📈 Pemasukan</option>
              <option value="transfer">🔄 Mutasi/Transfer</option>
            </select>
          </div>

          {/* Nominal */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 ml-1">Nominal</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
              <input 
                type="number" 
                placeholder="0" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                required 
              />
            </div>
          </div>

       {/* Kategori Pengeluaran */}
          {type === 'outcome' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 ml-1">Kategori Pengeluaran</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-red-500 transition-colors appearance-none" 
                required
              >
                <option value="" disabled hidden>Pilih Kategori...</option>
                <option value="Makan & Minum">Makan & Minum</option>
                <option value="Fashion & Apparel">Fashion & Apparel</option>
                <option value="Perawatan Diri">Perawatan Diri</option>
                <option value="Transportasi">Transportasi</option>
                <option value="Maintenance & Servis">Maintenance & Servis</option>
                <option value="Sosial & Relationship">Sosial & Relationship</option>
                <option value="Hobi & Olahraga">Hobi & Olahraga</option>
                <option value="Tagihan & Edukasi">Tagihan & Edukasi</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>
          )}

          {/* Kategori Pemasukan */}
          {type === 'income' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 ml-1">Kategori Pemasukan</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition-colors appearance-none" 
                required
              >
                <option value="" disabled hidden>Pilih Kategori...</option>
                <option value="Gaji">Gaji Bulanan</option>
                <option value="Hustle">Side Hustle</option>
                <option value="Bonus / THR">Bonus / THR</option>
		<option value="Investasi">Investasi / Airdrop</option>
                <option value="Pemasukan Lainnya">Pemasukan Lainnya</option>
              </select>
            </div>
          )}

          {/* Akun Sumber */}
          {(type === 'outcome' || type === 'transfer') && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 ml-1">Sumber Dana</label>
              <select 
                value={accountFrom} 
                onChange={(e) => setAccountFrom(e.target.value)} 
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-red-500 transition-colors appearance-none" 
                required
              >
                <option value="" disabled hidden>Pilih Sumber Dana...</option>
                <option value="BCA">BCA</option>
		<option value="Neobank">Neobank</option>
                <option value="Gopay">Gopay</option>
		<option value="Superbank">Superbank</option>
		<option value="E-money">E-money</option>
		<option value="Seabank">Seabank</option>
		<option value="Shopeepay">Shopeepay</option>
		<option value="OVO">OVO</option>
		<option value="bluBCA">bluBCA</option>
                <option value="Tunai">Tunai</option>
              </select>
            </div>
          )}

          {/* Akun Tujuan */}
          {(type === 'income' || type === 'transfer') && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 ml-1">Tujuan Dana</label>
              <select 
                value={accountTo} 
                onChange={(e) => setAccountTo(e.target.value)} 
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 transition-colors appearance-none" 
                required
              >
                <option value="" disabled hidden>Pilih Tujuan Dana...</option>
                 <option value="BCA">BCA</option>
		<option value="Neobank">Neobank</option>
                <option value="Gopay">Gopay</option>
		<option value="Superbank">Superbank</option>
		<option value="E-money">E-money</option>
		<option value="Seabank">Seabank</option>
		<option value="Shopeepay">Shopeepay</option>
		<option value="OVO">OVO</option>
		<option value="bluBCA">bluBCA</option>
                <option value="Tunai">Tunai</option>
              </select>
            </div>
          )}

          {/* Catatan */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 ml-1">Catatan</label>
            <input 
              type="text" 
              placeholder="Tambahkan catatan opsional..." 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" 
            />
          </div>
          
          {/* Tombol Submit */}
          <button 
            type="submit" 
            disabled={status === 'Menyimpan...'}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] disabled:opacity-50 mt-4"
          >
            {status === 'Menyimpan...' ? 'Memproses...' : 'Simpan Transaksi'}
          </button>
          
          {status && status !== 'Menyimpan...' && (
            <p className={`text-center text-sm mt-3 ${status.includes('Berhasil') ? 'text-green-400' : 'text-red-400'}`}>
              {status}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}