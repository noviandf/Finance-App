'use client'
import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function FinanceApp() {
  // State Autentikasi
  const [isAuth, setIsAuth] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  const [loginError, setLoginError] = useState(''); // Tambahkan baris ini

  // State Form Transaksi
  const [type, setType] = useState('outcome');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountFrom, setAccountFrom] = useState('');
  const [accountTo, setAccountTo] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');

  // State Dashboard Data
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // State Filter Waktu (Default: Bulan Ini)
  const [filterPeriod, setFilterPeriod] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Palet Warna Grafik
  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'];

  // Fungsi Login
const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah form HTML me-refresh halaman (log GET /?)
    setLoginError(''); // Reset error setiap kali tombol ditekan
    
    const validPin = process.env.NEXT_PUBLIC_APP_PIN?.trim();
    const inputPin = pinInput.trim();
    
    if (inputPin === validPin) {
      setIsAuth(true);
      fetchData(); 
    } else {
      setLoginError('❌ PIN Salah! Cek kembali.'); // Tampilkan teks di layar, BUKAN alert
      setPinInput('');
    }
  };

  // Fungsi Tarik Data
  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_GAS_URL as string, {
        method: 'GET',
        redirect: 'follow' 
      });
      const result = await response.json();
      if (result.status === 200) {
        setTransactions(result.data);
      }
    } catch (error) {
      console.error("Gagal menarik data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // --- FUNGSI KALKULATOR INLINE ---
  const calculateAmount = (expr: string) => {
    if (!expr) return '';
    try {
      const sanitized = expr.replace(/[^-()\d/*+.]/g, '');
      if (!sanitized) return '';
      const result = new Function(`return ${sanitized}`)();
      return Math.round(result).toString(); 
    } catch (e) {
      return expr; 
    }
  };

  const handleAmountBlur = () => {
    setAmount(calculateAmount(amount));
  };
  // --------------------------------

  // Fungsi Simpan Transaksi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Menyimpan...');
    
    const finalAmount = calculateAmount(amount);
    const payload = { type, amount: finalAmount, category, account_from: accountFrom, account_to: accountTo, notes };

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
        fetchData(); 
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus(`❌ Gagal: ${result.message}`);
      }
    } catch (error) {
      setStatus('❌ Gagal menghubungi server.');
    }
  };

  // --- LOGIKA FILTER WAKTU ---
  const filteredTransactions = transactions.filter(t => {
    if (filterPeriod === 'all') return true;
    
    const rawDate = t.timestamp || t.Timestamp;
    if (!rawDate) return true;

    const txDate = new Date(rawDate);
    const today = new Date();

    if (filterPeriod === 'today') {
      return txDate.toDateString() === today.toDateString();
    }
    if (filterPeriod === 'this_week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      return txDate >= sevenDaysAgo && txDate <= today;
    }
    if (filterPeriod === 'this_month') {
      return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
    }
    if (filterPeriod === 'this_year') {
      return txDate.getFullYear() === today.getFullYear();
    }
    
    // Logika Filter Custom Tanggal & Rentang
    if (filterPeriod === 'custom') {
      if (!startDate) return true; // Jika user belum pilih tanggal, tampilkan semua sementara
      
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      // Jika endDate kosong, filter hanya 1 hari (sesuai startDate)
      const end = endDate ? new Date(endDate) : new Date(startDate);
      end.setHours(23, 59, 59, 999);

      return txDate >= start && txDate <= end;
    }
    
    return true;
  });

  // --- LOGIKA DASHBOARD ---
  const expenses = filteredTransactions.filter(t => (t.type || t.Type) === 'outcome');
  const totalOutcome = expenses.reduce((sum, t) => sum + Number(t.amount || t.Amount || 0), 0);
  const totalIncome = filteredTransactions.filter(t => (t.type || t.Type) === 'income')
                                          .reduce((sum, t) => sum + Number(t.amount || t.Amount || 0), 0);

  const categoryData = expenses.reduce((acc: any[], curr) => {
    const catName = curr.category || curr.Category || 'Lain-lain';
    const amt = Number(curr.amount || curr.Amount || 0);
    const existing = acc.find(item => item.name === catName);
    if (existing) {
      existing.value += amt;
    } else {
      acc.push({ name: catName, value: amt });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);


if (!isAuth) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans">
        {/* Kita kembalikan ke <form> agar keyboard HP jalan normal */}
        <form onSubmit={handleLogin} className="w-full max-w-xs bg-[#111111] border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">
          <h1 className="text-xl font-bold text-white text-center">Gembok Aplikasi</h1>
          
          <input 
            type="password" 
            inputMode="numeric" 
            placeholder="Masukkan PIN" 
            value={pinInput} 
            onChange={(e) => setPinInput(e.target.value)} 
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl text-center text-white tracking-widest focus:outline-none focus:border-blue-500" 
            autoFocus 
          />
          
          {/* Teks error akan muncul di sini kalau PIN salah */}
          {loginError && (
            <p className="text-red-500 text-sm text-center animate-in fade-in zoom-in duration-300">
              {loginError}
            </p>
          )}
          
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all"
          >
            Buka
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center p-4 font-sans text-white">
      <div className="w-full max-w-md bg-[#111111] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden mt-4">
        
        {/* NAVIGASI TAB */}
        <div className="flex border-b border-gray-800">
          <button 
            onClick={() => setActiveTab('input')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'input' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Catat Transaksi
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'dashboard' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Ringkasan
          </button>
        </div>

        <div className="p-6 md:p-8">
          
          {/* TAB 1: INPUT */}
          {activeTab === 'input' && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 ml-1">Jenis Transaksi</label>
                <select 
                  value={type} onChange={(e) => setType(e.target.value)} 
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 appearance-none"
                >
                  <option value="outcome">📉 Pengeluaran</option>
                  <option value="income">📈 Pemasukan</option>
                  <option value="transfer">🔄 Mutasi/Transfer</option>
                </select>
              </div>

           {/* SMART INPUT NOMINAL DENGAN QUICK OPERATORS */}
              <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-xs font-medium text-gray-400 ml-1">Nominal</label>
                  {/* Tombol Kalkulator Bantuan */}
                <div className="flex space-x-1.5">
                    {['+', '-', '*', '/'].map((op) => (
                      <button 
                        key={op} type="button" 
                        // DUA BARIS INI KUNCI AJAIBNYA:
                        onPointerDown={(e) => e.preventDefault()} 
                        onClick={() => setAmount(prev => prev + op)}
                        className="bg-[#2a2a2a] border border-gray-700 text-gray-300 px-3 py-0.5 rounded-md text-sm font-mono hover:bg-gray-600 active:bg-gray-500 transition-colors"
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                  <input 
                    type="text" 
                    inputMode="decimal" 
                    placeholder="Hitung manual & tap tombol di atas" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    onBlur={handleAmountBlur} 
                    className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl focus:outline-none focus:border-blue-500" required 
                  />
                </div>
              </div>

              {type === 'outcome' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 ml-1">Kategori Pengeluaran</label>
                  <select 
                    value={category} onChange={(e) => setCategory(e.target.value)} 
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl focus:outline-none focus:border-red-500 appearance-none" required
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

              {type === 'income' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 ml-1">Kategori Pemasukan</label>
                  <select 
                    value={category} onChange={(e) => setCategory(e.target.value)} 
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl focus:outline-none focus:border-green-500 appearance-none" required
                  >
                    <option value="" disabled hidden>Pilih Kategori...</option>
                    <option value="Gaji Bulanan">Gaji Bulanan</option>
                    <option value="Side Hustle">Side Hustle</option>
                    <option value="Bonus / THR">Bonus / THR</option>
                    <option value="Investasi / Airdrop">Investasi / Airdrop</option>
                    <option value="Pemasukan Lainnya">Pemasukan Lainnya</option>
                  </select>
                </div>
              )}

              {(type === 'outcome' || type === 'transfer') && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 ml-1">Sumber Dana</label>
                  <select 
                    value={accountFrom} onChange={(e) => setAccountFrom(e.target.value)} 
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl focus:outline-none focus:border-red-500 appearance-none" required
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

              {(type === 'income' || type === 'transfer') && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 ml-1">Tujuan Dana</label>
                  <select 
                    value={accountTo} onChange={(e) => setAccountTo(e.target.value)} 
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl focus:outline-none focus:border-green-500 appearance-none" required
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

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 ml-1">Catatan</label>
                <input 
                  type="text" placeholder="Opsional..." value={notes} onChange={(e) => setNotes(e.target.value)} 
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl focus:outline-none focus:border-blue-500" 
                />
              </div>
              
              <button 
                type="submit" disabled={status === 'Menyimpan...'}
                className="w-full bg-blue-600 hover:bg-blue-500 font-semibold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] disabled:opacity-50 mt-2"
              >
                {status === 'Menyimpan...' ? 'Memproses...' : 'Simpan Transaksi'}
              </button>
              
              {status && status !== 'Menyimpan...' && (
                <p className={`text-center text-sm mt-2 ${status.includes('Berhasil') ? 'text-green-400' : 'text-red-400'}`}>
                  {status}
                </p>
              )}
            </form>
          )}

          {/* TAB 2: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {isLoadingData ? (
                <div className="flex justify-center items-center h-48 text-gray-500">
                  <p>Memuat data dari Google Sheets...</p>
                </div>
              ) : (
                <>
                  {/* DROPDOWN & CUSTOM DATE FILTER */}
                  <div className="flex flex-col mb-2">
                    <div className="flex justify-between items-center">
                      <h2 className="text-sm font-semibold text-gray-300">Ringkasan Arus Kas</h2>
                      <select 
                        value={filterPeriod} 
                        onChange={(e) => {
                          setFilterPeriod(e.target.value);
                          if(e.target.value !== 'custom') {
                            setStartDate(''); setEndDate('');
                          }
                        }}
                        className="bg-[#1a1a1a] border border-gray-700 text-xs rounded-lg px-3 py-1.5 text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="today">Hari Ini</option>
                        <option value="this_week">7 Hari Terakhir</option>
                        <option value="this_month">Bulan Ini</option>
                        <option value="this_year">Tahun Ini</option>
                        <option value="all">Semua Waktu</option>
                        <option value="custom">Pilih Tanggal...</option>
                      </select>
                    </div>

                    {/* Input Tanggal (Muncul kalau Pilih Tanggal di-klik) */}
                    {filterPeriod === 'custom' && (
                      <div className="flex items-center space-x-2 mt-3 bg-[#1a1a1a] p-2 rounded-lg border border-gray-800 animate-in fade-in zoom-in duration-200">
                        <input 
                          type="date" 
                          value={startDate} 
                          onChange={(e) => setStartDate(e.target.value)} 
                          className="flex-1 bg-transparent text-xs text-gray-300 focus:outline-none"
                        />
                        <span className="text-gray-500 text-xs">s/d</span>
                        <input 
                          type="date" 
                          value={endDate} 
                          onChange={(e) => setEndDate(e.target.value)} 
                          className="flex-1 bg-transparent text-xs text-gray-300 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded-xl">
                      <p className="text-xs text-gray-400 font-medium mb-1">Pengeluaran</p>
                      <h3 className="text-lg font-bold text-red-500">Rp {totalOutcome.toLocaleString('id-ID')}</h3>
                    </div>
                    <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded-xl">
                      <p className="text-xs text-gray-400 font-medium mb-1">Pemasukan</p>
                      <h3 className="text-lg font-bold text-green-500">Rp {totalIncome.toLocaleString('id-ID')}</h3>
                    </div>
                  </div>

                  <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded-xl">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 text-center">Distribusi Pengeluaran</h3>
                    {categoryData.length > 0 ? (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%" cy="50%"
                              innerRadius={60} outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                              contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#ccc' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-center text-sm text-gray-500 py-10">Belum ada data pengeluaran di periode ini.</p>
                    )}
                  </div>
                  
                  <button onClick={fetchData} className="w-full border border-gray-700 text-gray-400 hover:text-white py-2 rounded-xl text-sm transition-colors">
                    Refresh Data
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}