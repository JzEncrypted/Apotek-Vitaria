import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePharmacy } from '../../context/PharmacyContext';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useOrder, PaymentMethod } from '../../context/OrderContext';
import { useToast } from '../../context/ToastContext';
import { FAIcon } from '../../components/common/FAIcon';
import { PharmacyMedicine } from '../../types';

interface PharmacyStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConsultation?: () => void;
  onOpenMyOrders?: () => void;
}

interface CartItem {
  medicine: PharmacyMedicine;
  quantity: number;
}

export const PharmacyStoreModal: React.FC<PharmacyStoreModalProps> = ({
  isOpen,
  onClose,
  onOpenConsultation,
  onOpenMyOrders
}) => {
  const { medicines, adjustStock } = usePharmacy();
  const { currentUser } = useAuth();
  const { sendMessage } = useChat();
  const { createOrder } = useOrder();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress] = useState('Jl. Mayjen Bambang Soegeng, Mertoyudan, Magelang');
  
  // Payment step states
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('qris');
  const [paymentProofImg, setPaymentProofImg] = useState<string | null>(null);
  const [prescriptionImg, setPrescriptionImg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState('');
  const [lastOrderTotal, setLastOrderTotal] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const prescriptionInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()) ||
      m.brand.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedClass === 'all') return true;
    if (selectedClass === 'resep') return m.medicineClass === 'Keras / Resep';
    if (selectedClass === 'bebas') return m.medicineClass === 'Bebas';
    if (selectedClass === 'terbatas') return m.medicineClass === 'Bebas Terbatas';
    return true;
  });

  const addToCart = (med: PharmacyMedicine) => {
    if (med.totalStock <= 0) {
      showToast('Maaf, stok obat ini sedang habis.', 'danger');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.medicine.id === med.id);
      if (existing) {
        if (existing.quantity >= med.totalStock) {
          showToast(`Stok maksimal hanya tersedia ${med.totalStock} ${med.unit}`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.medicine.id === med.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { medicine: med, quantity: 1 }];
    });
    showToast(`${med.name} ditambahkan ke pesanan.`, 'success');
  };

  const updateQuantity = (medId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.medicine.id === medId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.medicine.totalStock) {
              showToast(`Stok maksimal ${item.medicine.totalStock}`, 'warning');
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.medicine.sellingPrice * item.quantity,
    0
  );
  const deliveryFee = deliveryMethod === 'delivery' ? 10000 : 0;
  const grandTotal = cartSubtotal + deliveryFee;
  const hasPrescriptionItem = cart.some((i) => i.medicine.medicineClass === 'Keras / Resep');

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionImg(reader.result as string);
        showToast('Foto resep dokter berhasil diunggah.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteOrder = async () => {
    if (cart.length === 0) return;

    if (hasPrescriptionItem && !prescriptionImg) {
      showToast('Wajib mengunggah foto resep dokter resmi untuk obat keras sebelum checkout.', 'danger');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Deduct physical stock in PharmacyContext
      cart.forEach((item) => {
        adjustStock(
          item.medicine.id,
          item.quantity,
          'out',
          `Penjualan Pelanggan (${selectedPaymentMethod.toUpperCase()} - ${
            deliveryMethod === 'delivery' ? 'Antar Kurir' : 'Ambil di Apotek'
          })`,
          'Sistem Kasir Otomatis'
        );
      });

      // 2. Create Order in OrderContext & Database
      const orderItems = cart.map((i) => ({
        medicineId: i.medicine.id,
        medicineName: i.medicine.name,
        dosageForm: i.medicine.dosageForm,
        strength: i.medicine.strength,
        category: i.medicine.category,
        quantity: i.quantity,
        unit: i.medicine.unit,
        unitPrice: i.medicine.sellingPrice,
        totalPrice: i.medicine.sellingPrice * i.quantity,
        requiresPrescription: i.medicine.medicineClass === 'Keras / Resep',
        instructions: i.medicine.usageInstructions
      }));

      const newOrder = await createOrder({
        items: orderItems,
        deliveryMethod,
        shippingAddress: deliveryMethod === 'delivery' ? deliveryAddress : undefined,
        courierNotes: hasPrescriptionItem ? 'Ada resep dokter fisik terlampir menunggu verifikasi APJ' : undefined,
        paymentMethod: selectedPaymentMethod,
        paymentProofUrl: paymentProofImg || undefined,
        prescriptionUrl: prescriptionImg || undefined,
        customerName: currentUser?.name || 'Pelanggan Apotek',
        customerPhone: currentUser?.phone || '087819622174'
      });

      // 3. Send message to Pharmacist Chat
      const itemsSummary = cart
        .map((i) => `- ${i.medicine.name} (${i.quantity} ${i.medicine.unit})`)
        .join('\n');

      const orderMsg = `Halo apt. Sarinah Cantika, S.Farm.! Saya telah membuat pesanan obat (${newOrder.invoiceNumber}):\n\n${itemsSummary}\n\nTotal: Rp ${grandTotal.toLocaleString('id-ID')}\nMetode Bayar: ${
        selectedPaymentMethod === 'qris'
          ? 'QRIS Resmi'
          : selectedPaymentMethod === 'bank_transfer'
          ? 'Transfer Bank'
          : 'Tunai / COD'
      }\nPengiriman: ${
        deliveryMethod === 'delivery' ? `Kurir ke: ${deliveryAddress}` : 'Ambil di Apotek Vitaria Magelang'
      }${hasPrescriptionItem ? '\n\n✓ FOTO RESEP DOKTER TELAH SAYA LAMPIRKAN untuk diperiksa dan dikonfirmasi oleh Apoteker.' : ''}`;

      sendMessage({
        text: orderMsg,
        imageUrl: prescriptionImg || undefined,
        imageCaption: prescriptionImg ? 'Lampiran Resep Dokter Resmi' : undefined,
        sender: 'customer'
      });

      setLastInvoiceNumber(newOrder.invoiceNumber);
      setLastOrderTotal(grandTotal);
      setCart([]);
      setPrescriptionImg(null);
      setShowPaymentStep(false);
      setIsCheckoutSuccess(true);
    } catch (err) {
      showToast('Gagal memproses pesanan.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-center bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg h-full bg-[#F7F9F5] flex flex-col shadow-2xl animate-slideInRight">
        {/* Top Header */}
        <header className="bg-white border-b border-[#E5EAE3] px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={showPaymentStep ? () => setShowPaymentStep(false) : onClose}
              className="w-9 h-9 rounded-full hover:bg-[#F0F4EE] flex items-center justify-center text-[#526352] transition-colors"
              aria-label="Kembali"
            >
              <FAIcon name="arrowLeft" className="text-base" />
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#1F2E23] leading-tight flex items-center gap-2">
                <span>{showPaymentStep ? 'Pembayaran & Checkout' : 'Beli Obat di Apotek Vitaria'}</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Stok Resmi
                </span>
              </h2>
              <p className="text-[11px] text-[#778477]">
                {showPaymentStep
                  ? 'Pilih metode pembayaran aman terverifikasi'
                  : 'Pesan antar kurir farmasi atau ambil langsung di apotek'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F0F4EE] text-[#778477] flex items-center justify-center transition-colors"
            aria-label="Tutup"
          >
            <FAIcon name="close" className="text-sm" />
          </button>
        </header>

        {/* 1. SUCCESS VIEW */}
        {isCheckoutSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl shadow-soft">
              <FAIcon name="circleCheck" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-[#84A282] block">
                {lastInvoiceNumber}
              </span>
              <h3 className="text-lg font-extrabold text-[#1F2E23] mt-0.5">
                Pesanan Obat Berhasil Dibuat!
              </h3>
              <p className="text-xs text-[#526352] mt-1 max-w-xs mx-auto leading-relaxed">
                Rincian transaksi senilai{' '}
                <strong className="text-[#1F2E23]">
                  Rp {lastOrderTotal.toLocaleString('id-ID')}
                </strong>{' '}
                telah tercatat di sistem kasir dan ruang chat Apoteker.
              </p>
            </div>

            <div className="w-full bg-[#F3F7F1] rounded-2xl p-4 border border-[#D5E1D2] text-left text-xs space-y-1.5">
              <div className="flex justify-between text-[#778477]">
                <span>Status Pembayaran:</span>
                <span className="font-bold text-amber-700">Menunggu Verifikasi Kasir</span>
              </div>
              <div className="flex justify-between text-[#778477]">
                <span>Metode Pengiriman:</span>
                <span className="font-semibold text-[#1F2E23]">
                  {deliveryMethod === 'delivery' ? 'Antar Kurir Apotek' : 'Ambil di Apotek Vitaria'}
                </span>
              </div>
            </div>

            <div className="flex flex-col w-full gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCheckoutSuccess(false);
                  onClose();
                  if (onOpenMyOrders) onOpenMyOrders();
                }}
                className="w-full py-3 bg-[#84A282] hover:bg-[#688C66] text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-soft transition-colors active:scale-95"
              >
                <FAIcon name="boxes" className="text-xs" />
                <span>Lihat Pesanan Saya & Pengingat</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCheckoutSuccess(false);
                  onClose();
                  if (onOpenConsultation) onOpenConsultation();
                }}
                className="w-full py-2.5 bg-[#F0F5ED] hover:bg-[#E2EDE0] text-[#405A42] text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
              >
                <FAIcon name="chat" className="text-xs text-[#84A282]" />
                <span>Buka Chat Apoteker</span>
              </button>
            </div>
          </div>
        ) : showPaymentStep ? (
          /* 2. PAYMENT STEP VIEW */
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#F7F9F5]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Payment Amount Card */}
              <div className="bg-white rounded-3xl p-4.5 border border-[#E5EAE3] shadow-soft-sm text-center">
                <span className="text-[11px] font-bold text-[#778477] uppercase tracking-wider block">
                  Total Tagihan Pembayaran
                </span>
                <span className="text-2xl font-black text-[#1F2E23] mt-1 block">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
                <span className="text-[11px] text-[#587A58] font-medium mt-1 inline-block">
                  {cart.reduce((s, i) => s + i.quantity, 0)} item obat • {deliveryMethod === 'delivery' ? 'Termasuk Ongkir Kurir' : 'Ambil di Apotek'}
                </span>
              </div>

              {/* Mandatory Prescription Upload Section if order contains Prescription Medicine */}
              {hasPrescriptionItem && (
                <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-4.5 space-y-3 shadow-soft-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-sm shrink-0 shadow-xs mt-0.5">
                      <FAIcon name="document" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
                        Wajib Resep Dokter
                      </span>
                      <h4 className="text-xs font-bold text-amber-950">
                        Pesanan Memerlukan Resep Dokter Resmi
                      </h4>
                      <p className="text-[11px] text-amber-900/90 leading-relaxed">
                        Keranjang Anda mengandung obat keras. Wajib mengunggah foto resep dokter fisik Anda agar dapat diperiksa dan dikonfirmasi oleh Apoteker penanggung jawab (apt. Sarinah Cantika, S.Farm.).
                      </p>
                    </div>
                  </div>

                  {/* Prescription Upload / Preview */}
                  <div className="pt-1">
                    <input
                      ref={prescriptionInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePrescriptionUpload}
                      className="hidden"
                      id="prescription-file-upload"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePrescriptionUpload}
                      className="hidden"
                      id="prescription-camera-upload"
                    />
                    {prescriptionImg ? (
                      <div className="relative inline-block border-2 border-emerald-500 rounded-2xl overflow-hidden shadow-soft">
                        <img
                          src={prescriptionImg}
                          alt="Resep Dokter Terlampir"
                          className="w-40 h-40 object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-emerald-800/85 text-white text-[9px] font-bold text-center py-1">
                          ✓ Resep Terlampir
                        </div>
                        <button
                          type="button"
                          onClick={() => setPrescriptionImg(null)}
                          className="absolute top-1 right-1 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-sm"
                          title="Hapus / Foto Ulang"
                        >
                          <FAIcon name="close" className="text-[10px]" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label
                          htmlFor="prescription-camera-upload"
                          className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-dashed border-amber-400 hover:border-amber-600 hover:bg-amber-100/50 rounded-2xl cursor-pointer text-xs font-bold text-amber-900 transition-colors shadow-xs"
                        >
                          <FAIcon name="camera" className="text-sm text-amber-700" />
                          <span>Potret Resep (Kamera)</span>
                        </label>
                        <label
                          htmlFor="prescription-file-upload"
                          className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-dashed border-amber-400 hover:border-amber-600 hover:bg-amber-100/50 rounded-2xl cursor-pointer text-xs font-bold text-amber-900 transition-colors shadow-xs"
                        >
                          <FAIcon name="image" className="text-sm text-amber-700" />
                          <span>Unggah dari Galeri</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Methods Selection */}
              <div className="space-y-2.5">
                <span className="text-xs font-extrabold text-[#26382B] block">
                  Pilih Saluran Pembayaran:
                </span>

                {/* Method 1: QRIS */}
                <div
                  onClick={() => setSelectedPaymentMethod('qris')}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                    selectedPaymentMethod === 'qris'
                      ? 'bg-white border-[#84A282] shadow-soft ring-2 ring-[#84A282]/20'
                      : 'bg-white border-[#E7EBE4] hover:border-[#84A282]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#E6EEE3] text-[#587A58] flex items-center justify-center font-bold text-xs">
                        QRIS
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1F2E23]">QRIS Apotek Vitaria</h4>
                        <p className="text-[11px] text-[#778477]">GoPay, OVO, Dana, BCA Mobile, Livin'</p>
                      </div>
                    </div>
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedPaymentMethod === 'qris' ? 'border-[#84A282] bg-[#84A282]' : 'border-[#CBD5C8]'
                    }`}>
                      {selectedPaymentMethod === 'qris' && <FAIcon name="check" className="text-[10px] text-white" />}
                    </span>
                  </div>

                  {selectedPaymentMethod === 'qris' && (
                    <div className="mt-3.5 pt-3 border-t border-[#EAEFE8] text-center space-y-2 animate-fadeIn">
                      {/* Stylized QRIS Box */}
                      <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl border-2 border-[#1F2E23] flex flex-col items-center justify-center shadow-sm">
                        <div className="w-full flex justify-between text-[9px] font-black tracking-widest text-[#1F2E23] mb-1">
                          <span>QRIS</span>
                          <span>NMID: ID102938475</span>
                        </div>
                        <img
                          src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://apotek-vitaria.com/pay"
                          alt="QRIS Apotek Vitaria"
                          className="w-32 h-32 object-contain"
                        />
                        <span className="text-[8px] text-[#778477] mt-1 font-mono">APOTEK VITARIA MAGELANG</span>
                      </div>
                      <p className="text-[11px] text-[#526352]">
                        Pindai kode QRIS di atas untuk membayar, lalu klik tombol konfirmasi di bawah.
                      </p>
                    </div>
                  )}
                </div>

                {/* Method 2: Transfer Bank */}
                <div
                  onClick={() => setSelectedPaymentMethod('bank_transfer')}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                    selectedPaymentMethod === 'bank_transfer'
                      ? 'bg-white border-[#84A282] shadow-soft ring-2 ring-[#84A282]/20'
                      : 'bg-white border-[#E7EBE4] hover:border-[#84A282]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#E6EEE3] text-[#587A58] flex items-center justify-center font-bold text-xs">
                        BANK
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1F2E23]">Transfer Rekening Resmi</h4>
                        <p className="text-[11px] text-[#778477]">BCA, Mandiri, BRI a.n. PT Apotek Vitaria</p>
                      </div>
                    </div>
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedPaymentMethod === 'bank_transfer' ? 'border-[#84A282] bg-[#84A282]' : 'border-[#CBD5C8]'
                    }`}>
                      {selectedPaymentMethod === 'bank_transfer' && <FAIcon name="check" className="text-[10px] text-white" />}
                    </span>
                  </div>

                  {selectedPaymentMethod === 'bank_transfer' && (
                    <div className="mt-3.5 pt-3 border-t border-[#EAEFE8] space-y-3 animate-fadeIn text-xs">
                      <div className="bg-[#F2F7F0] p-3 rounded-2xl border border-[#D5E1D2] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#1F2E23]">BCA: 8921-0982-1234</span>
                          <span className="text-[10px] font-bold text-[#587A58] bg-white px-2 py-0.5 rounded-lg border border-[#D5E1D2]">
                            Salin
                          </span>
                        </div>
                        <p className="text-[10px] text-[#526352]">a.n. PT Apotek Vitaria Sejahtera</p>
                      </div>

                      {/* Upload Proof Button */}
                      <div>
                        <span className="text-[11px] font-bold text-[#26382B] block mb-1.5">
                          Lampirkan Foto Struk / Bukti Transfer:
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProofUpload}
                          className="hidden"
                          id="payment-proof-upload"
                        />
                        {paymentProofImg ? (
                          <div className="relative inline-block">
                            <img
                              src={paymentProofImg}
                              alt="Bukti Transfer"
                              className="w-24 h-24 object-cover rounded-2xl border-2 border-[#84A282]"
                            />
                            <button
                              type="button"
                              onClick={() => setPaymentProofImg(null)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center"
                            >
                              <FAIcon name="close" className="text-[10px]" />
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor="payment-proof-upload"
                            className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#84A282]/50 hover:bg-[#F2F7F0] rounded-2xl cursor-pointer text-xs font-bold text-[#587A58] transition-colors"
                          >
                            <FAIcon name="image" />
                            <span>Unggah Foto Bukti Transfer</span>
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Method 3: COD / Tunai */}
                <div
                  onClick={() => setSelectedPaymentMethod('cash_on_delivery')}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                    selectedPaymentMethod === 'cash_on_delivery'
                      ? 'bg-white border-[#84A282] shadow-soft ring-2 ring-[#84A282]/20'
                      : 'bg-white border-[#E7EBE4] hover:border-[#84A282]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#E6EEE3] text-[#587A58] flex items-center justify-center font-bold text-xs">
                        COD
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1F2E23]">Bayar Tunai / COD</h4>
                        <p className="text-[11px] text-[#778477]">Bayar langsung ke kurir atau kasir apotek</p>
                      </div>
                    </div>
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedPaymentMethod === 'cash_on_delivery' ? 'border-[#84A282] bg-[#84A282]' : 'border-[#CBD5C8]'
                    }`}>
                      {selectedPaymentMethod === 'cash_on_delivery' && <FAIcon name="check" className="text-[10px] text-white" />}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Confirm Action */}
            <div className="bg-white border-t border-[#E5EAE3] p-4 shadow-xl shrink-0 space-y-2">
              {hasPrescriptionItem && !prescriptionImg && (
                <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-[11px] text-amber-900 font-bold flex items-center gap-2 animate-fadeIn">
                  <FAIcon name="alert" className="text-amber-700 shrink-0 text-xs" />
                  <span>Wajib potret atau unggah foto resep dokter fisik sebelum pesanan dapat dikonfirmasi.</span>
                </div>
              )}
              <button
                type="button"
                disabled={isSubmitting || (hasPrescriptionItem && !prescriptionImg)}
                onClick={handleCompleteOrder}
                className={`w-full py-3.5 text-xs font-extrabold rounded-2xl shadow-soft transition-all flex items-center justify-center gap-2 ${
                  hasPrescriptionItem && !prescriptionImg
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-[#84A282] hover:bg-[#688C66] text-white active:scale-95 cursor-pointer'
                }`}
              >
                <span>{isSubmitting ? 'Memproses Pesanan...' : 'Konfirmasi & Kirim Pesanan'}</span>
                <FAIcon name="paperPlane" className="text-xs" />
              </button>
            </div>
          </div>
        ) : (
          /* 3. MEDICINE CATALOG & CART VIEW */
          <>
            {/* Search & Filter Bar */}
            <div className="bg-white border-b border-[#E5EAE3] p-3 space-y-2.5 shrink-0">
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#778477] text-xs">
                  <FAIcon name="search" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari obat (cth: Paracetamol, Vitamin, Amoxicillin)..."
                  className="w-full bg-[#F4F7F2] border border-[#CBD8C7] focus:border-[#84A282] focus:ring-2 focus:ring-[#84A282]/20 rounded-2xl pl-9 pr-4 py-2 text-xs text-[#1F2E23] placeholder-[#778477]/70 outline-none transition-all"
                />
              </div>

              {/* Class Filter Badges */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'Semua Obat' },
                  { id: 'bebas', label: 'Obat Bebas (Hijau)' },
                  { id: 'terbatas', label: 'Bebas Terbatas (Biru)' },
                  { id: 'resep', label: 'Butuh Resep Dokter (Merah)' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedClass(item.id)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                      selectedClass === item.id
                        ? 'bg-[#84A282] text-white shadow-soft-sm'
                        : 'bg-[#F0F5ED] text-[#587A58] hover:bg-[#E5EFE2]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Medicine Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredMedicines.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3 bg-white rounded-3xl border border-[#E7EBE4] mt-4">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-xl">
                    <FAIcon name="search" />
                  </div>
                  <h4 className="text-sm font-bold text-[#1F2E23]">Obat Tidak Ditemukan</h4>
                  <p className="text-xs text-[#778477] max-w-xs mx-auto">
                    Tidak ada obat di katalog apotek yang sesuai dengan kata kunci pencarian atau filter yang Anda pilih.
                  </p>
                </div>
              ) : (
                filteredMedicines.map((med) => {
                const isOutOfStock = med.totalStock <= 0;
                const inCart = cart.find((i) => i.medicine.id === med.id);

                return (
                  <div
                    key={med.id}
                    className="bg-white rounded-3xl p-4 border border-[#E7EBE4] shadow-soft-sm hover:border-[#84A282]/40 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-lg shrink-0 shadow-2xs border border-[#84A282]/20">
                          <FAIcon name="pill" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                                med.medicineClass === 'Bebas'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : med.medicineClass === 'Bebas Terbatas'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {med.medicineClass}
                            </span>
                            <span className="text-[10px] text-[#778477]">
                              {med.brand} • {med.dosageForm}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-xs sm:text-sm text-[#1F2E23] mt-1 truncate">
                            {med.name}
                          </h4>
                          <p className="text-[11px] text-[#637563] line-clamp-1 mt-0.5">
                            {med.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-extrabold text-[#26382B] block">
                          Rp {med.sellingPrice.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-[#778477]">
                          per {med.unit}
                        </span>
                      </div>
                    </div>

                    {/* Stock & Action Bar */}
                    <div className="pt-2 border-t border-[#EAEFE8] flex items-center justify-between">
                      <div className="text-[11px]">
                        {isOutOfStock ? (
                          <span className="font-bold text-rose-600">Stok Habis</span>
                        ) : (
                          <span className="text-[#637563]">
                            Sisa stok:{' '}
                            <strong className="text-[#203422]">{med.totalStock} {med.unit}</strong>
                          </span>
                        )}
                      </div>

                      {inCart ? (
                        <div className="flex items-center gap-2 bg-[#F0F5ED] rounded-xl p-1 border border-[#D5E1D2]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(med.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white text-[#405A42] flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-rose-50 hover:text-rose-600"
                          >
                            <FAIcon name="minus" className="text-[10px]" />
                          </button>
                          <span className="text-xs font-extrabold text-[#1F2E23] w-5 text-center font-mono">
                            {inCart.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(med.id, 1)}
                            className="w-7 h-7 rounded-lg bg-[#84A282] text-white flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-[#688C66]"
                          >
                            <FAIcon name="plus" className="text-[10px]" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => addToCart(med)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                            isOutOfStock
                              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                              : 'bg-[#84A282] hover:bg-[#688C66] text-white shadow-xs cursor-pointer'
                          }`}
                        >
                          <FAIcon name="plus" className="text-[10px]" />
                          <span>Pesan</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              }))}
            </div>

            {/* Bottom Checkout Drawer (Appears when cart has items) */}
            {cart.length > 0 && (
              <div className="bg-white border-t border-[#E5EAE3] p-4 shadow-xl shrink-0 space-y-3 animate-slideUp">
                {/* Prescription Warning if any item is Keras/Resep */}
                {hasPrescriptionItem && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                    <FAIcon name="alert" className="text-xs text-rose-600 shrink-0" />
                    <span>
                      Ada obat resep dokter di pesanan Anda. Apoteker kami akan memverifikasi foto resep di chat sebelum pengantaran.
                    </span>
                  </div>
                )}

                {/* Delivery Option Toggle */}
                <div className="grid grid-cols-2 gap-2 bg-[#F0F5ED] p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      deliveryMethod === 'delivery'
                        ? 'bg-white text-[#26382B] shadow-xs'
                        : 'text-[#637563] hover:text-[#26382B]'
                    }`}
                  >
                    Antar Kurir (+Rp 10.000)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      deliveryMethod === 'pickup'
                        ? 'bg-white text-[#26382B] shadow-xs'
                        : 'text-[#637563] hover:text-[#26382B]'
                    }`}
                  >
                    Ambil di Apotek (Gratis)
                  </button>
                </div>

                {deliveryMethod === 'delivery' && (
                  <div className="text-[11px] text-[#587A58] flex items-center gap-1.5 truncate">
                    <FAIcon name="location" className="text-[10px]" />
                    <span className="truncate">Kirim ke: {deliveryAddress}</span>
                  </div>
                )}

                {/* Subtotal & Next Step Button */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-[#778477] block">
                      Total ({cart.reduce((s, i) => s + i.quantity, 0)} barang):
                    </span>
                    <span className="text-base font-extrabold text-[#1F2E23]">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPaymentStep(true)}
                    className="px-5 py-2.5 bg-[#84A282] hover:bg-[#688C66] text-white text-xs font-extrabold rounded-2xl shadow-soft active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Lanjut Bayar</span>
                    <FAIcon name="arrowRight" className="text-xs" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PharmacyStoreModal;
