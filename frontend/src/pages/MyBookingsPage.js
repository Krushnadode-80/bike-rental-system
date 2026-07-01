import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Calendar, Trash2, CheckCircle2, XCircle, Clock, Download, MapPin, QrCode, AlertCircle } from 'lucide-react';
import '../Home.css';

import { useLocation, useNavigate } from 'react-router-dom';

const MyBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user) {
        const res = await client.get(`/my-bookings/${user.email}`);
        setBookings(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error("Error fetching rider bookings:", err);
      setError("Failed to load your booking history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleCancelBooking = async (id) => {
    const check = window.confirm("Are you sure you want to cancel this booking reservation?");
    if (!check) return;

    try {
      await client.delete(`/cancel-booking/${id}`);
      alert("Booking cancelled successfully. Refund processed.");
      fetchBookings();
    } catch (err) {
      alert("Failed to cancel booking: " + (err.response?.data?.detail || "System error."));
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-receipt-card');
    if (!element || !window.html2pdf) return;
    
    // Temporarily move the element to the top level of the body to ensure perfect capture
    const originalParent = element.parentNode;
    const originalNextSibling = element.nextSibling;
    
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.top = window.scrollY + 'px';
    wrapper.style.left = '0';
    wrapper.style.width = '100%';
    wrapper.style.zIndex = '999999';
    wrapper.style.background = '#f1f5f9';
    wrapper.style.padding = '40px';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    
    wrapper.appendChild(element);
    document.body.appendChild(wrapper);

    // Hide close button temporarily
    const closeBtn = element.querySelector('button');
    if (closeBtn) closeBtn.style.display = 'none';

    // Configure html2pdf options for high quality output
    const opt = {
      margin:       0.2,
      filename:     `MotorCity_Receipt_BR-${selectedInvoice.id}9X.pdf`,
      image:        { type: 'jpeg', quality: 1 },
      html2canvas:  { scale: 2, useCORS: true, logging: false, y: window.scrollY, scrollY: window.scrollY },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
      // Restore
      if (closeBtn) closeBtn.style.display = '';
      if (originalNextSibling) {
        originalParent.insertBefore(element, originalNextSibling);
      } else {
        originalParent.appendChild(element);
      }
      document.body.removeChild(wrapper);
    }).catch(err => {
      console.error('PDF generation failed:', err);
      // Restore on error
      if (closeBtn) closeBtn.style.display = '';
      originalParent.appendChild(element);
      if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
    });
  };

  const getStatusStyle = (status) => {
    if (status === 'Booked') return { bg: '#dcfce3', color: '#10b981', icon: <CheckCircle2 size={16} /> };
    if (status === 'Cancelled') return { bg: '#fee2e2', color: '#ef4444', icon: <XCircle size={16} /> };
    return { bg: '#fef3c7', color: '#d97706', icon: <Clock size={16} /> };
  };

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', paddingBottom: '80px', color: '#1e293b' }}>
      
      {/* Dark Premium Hero Header */}
      <div style={{ 
        backgroundColor: '#0f172a', 
        padding: '80px 20px', 
        textAlign: 'center', 
        color: '#fff',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '16px', letterSpacing: '1px' }}>My Garage</h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
          Access your digital boarding passes, track active rides, and manage your reservation history.
        </p>
      </div>

      <div style={{ maxWidth: '1000px', margin: '-40px auto 0 auto', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #ff5e14', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
            <p style={{ color: '#64748b', fontWeight: 600 }}>Syncing your rides...</p>
          </div>
        ) : error ? (
          <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 12px auto' }} />
            <p style={{ fontWeight: 600 }}>{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ backgroundColor: '#fff', padding: '80px 40px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
            <div style={{ width: '100px', height: '100px', backgroundColor: '#fff7ed', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px auto' }}>
              <Calendar size={48} color="#ff5e14" />
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '16px', color: '#0f172a' }}>No Rides Scheduled</h3>
            <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '16px', maxWidth: '400px', margin: '0 auto 32px auto' }}>
              Your garage is currently empty. Book a premium motorcycle and start your next adventure today!
            </p>
            <a href="/" style={{ backgroundColor: '#ff5e14', color: '#fff', padding: '16px 32px', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, display: 'inline-block', boxShadow: '0 10px 20px rgba(255, 94, 20, 0.3)' }}>
              Explore Fleet
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {bookings.map(booking => {
              const statusStyle = getStatusStyle(booking.status);
              const isActive = booking.status === 'Booked';

              return (
                /* VIP Digital Ticket Card */
                <div key={booking.id} style={{ display: 'flex', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', overflow: 'hidden', position: 'relative' }}>
                  
                  {/* Left Side: Image & Brand */}
                  <div style={{ flex: '1 1 300px', position: 'relative', minHeight: '200px' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0.1))', zIndex: 1 }}></div>
                    <img 
                      src={booking.image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=600'} 
                      alt={booking.bike_name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }} 
                    />
                    <div style={{ position: 'relative', zIndex: 2, padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', alignSelf: 'flex-start', border: '1px solid rgba(255,255,255,0.3)' }}>
                        {booking.status === 'Booked' ? 'Active Pass' : 'Expired Pass'}
                      </span>
                      <div>
                        <h2 style={{ color: '#fff', fontSize: '28px', fontWeight: 900, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{booking.bike_name}</h2>
                        <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>VIP Rental Class</p>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Ticket Details */}
                  <div style={{ flex: '2 1 350px', padding: '30px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '2px dashed #e2e8f0', position: 'relative' }}>
                    {/* Cutout circles for ticket effect */}
                    <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '30px', height: '30px', backgroundColor: '#f1f5f9', borderRadius: '50%' }}></div>
                    <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', width: '30px', height: '30px', backgroundColor: '#f1f5f9', borderRadius: '50%' }}></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Pickup Date</p>
                        <p style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{booking.booking_date}</p>
                      </div>
                      <div style={{ flex: 1, textAlign: 'right' }}>
                        <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Return Date</p>
                        <p style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{booking.return_date}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '24px', border: '1px solid #f1f5f9' }}>
                      <MapPin size={18} color="#ff5e14" />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>Headquarters, Motor City Garage</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Total Amount</p>
                        <p style={{ fontSize: '22px', fontWeight: 900, color: '#ff5e14', margin: 0 }}>₹{booking.total_price}</p>
                      </div>
                      <span style={{ padding: '8px 14px', backgroundColor: statusStyle.bg, color: statusStyle.color, borderRadius: '20px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {statusStyle.icon} {booking.status}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Ticket Stub / Actions */}
                  <div style={{ flex: '1 1 200px', padding: '30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdfdfd' }}>
                    <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '12px', marginBottom: '20px' }}>
                      <QrCode size={48} color="#94a3b8" />
                    </div>
                    <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, letterSpacing: '2px', marginBottom: '24px' }}>ID: BR-{booking.id}9X</p>
                    
                    <button 
                      onClick={() => setSelectedInvoice(booking)} 
                      style={{ width: '100%', padding: '10px 0', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: isActive ? '10px' : '0', transition: 'background-color 0.2s' }}
                    >
                      <Download size={14} /> Receipt
                    </button>

                    {isActive && (
                      <button 
                        onClick={() => handleCancelBooking(booking.id)} 
                        style={{ width: '100%', padding: '10px 0', backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #ffe4e6', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background-color 0.2s' }}
                      >
                        <Trash2 size={14} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Improved Modal with Automatic PDF Download */}
        {selectedInvoice && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.8)', overflowY: 'auto', padding: '100px 20px 40px 20px' }}>
            
            <div style={{ width: '100%', maxWidth: '550px', position: 'relative', animation: 'fadeInUp 0.3s ease-out', margin: 'auto' }}>

              {/* The Ultra-Premium Receipt element that gets converted to PDF */}
              <div id="invoice-receipt-card" style={{ background: '#fff', color: '#1e293b', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', position: 'relative' }}>
                
                {/* Close Button Inside Receipt Corner */}
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  data-html2canvas-ignore="true"
                  style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '36px', height: '36px', borderRadius: '50%', transition: 'background-color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                >
                  <XCircle size={24} />
                </button>
                
                {/* Background Watermark */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.03, pointerEvents: 'none', zIndex: 0 }}>
                  <Calendar size={400} color="#0f172a" />
                </div>

                {/* Luxury Header */}
                <div style={{ backgroundColor: '#0f172a', padding: '40px', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, #ff5e14 0%, transparent 70%)', opacity: 0.3 }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '3px', margin: 0, color: '#fff', textTransform: 'uppercase' }}>Invoice</h3>
                      <p style={{ color: '#ff5e14', fontSize: '13px', marginTop: '6px', fontWeight: 800, letterSpacing: '1px' }}>MOTORCITY PREMIUM RENTALS</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Booking Date</p>
                      <p style={{ color: '#fff', fontSize: '14px', margin: '4px 0 0 0', fontWeight: 700 }}>{new Date().toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '40px', position: 'relative', zIndex: 1 }}>
                  
                  {/* Status Stamp */}
                  <div style={{ position: 'absolute', top: '20px', right: '40px', transform: 'rotate(15deg)', border: `4px solid ${selectedInvoice.status === 'Cancelled' ? '#ef4444' : '#10b981'}`, color: selectedInvoice.status === 'Cancelled' ? '#ef4444' : '#10b981', padding: '8px 24px', borderRadius: '12px', fontSize: '24px', fontWeight: 900, letterSpacing: '4px', opacity: 0.8 }}>
                    {selectedInvoice.status === 'Cancelled' ? 'CANCELLED' : (selectedInvoice.payment_status || 'PAID')}
                  </div>

                  {/* Rider & Booking Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                    <div>
                      <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', margin: '0 0 8px 0', fontWeight: 800 }}>Customer Name</p>
                      <p style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>{user?.name || user?.email || 'VIP Guest'}</p>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{user?.email || selectedInvoice.user_email}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', margin: '0 0 8px 0', fontWeight: 800 }}>Booking ID</p>
                      <p style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>BR-{selectedInvoice.id}9382X</p>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Status: {selectedInvoice.status === 'Cancelled' ? 'Cancelled' : 'Confirmed'}</p>
                    </div>
                  </div>

                  {/* Rental Details Table */}
                  <div style={{ marginBottom: '40px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', backgroundColor: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ flex: 2, fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Bike Name</div>
                      <div style={{ flex: 1.5, fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Pickup & Return Date</div>
                      <div style={{ flex: 1, fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Total Amount</div>
                    </div>
                    
                    <div style={{ display: 'flex', padding: '24px 20px', alignItems: 'center' }}>
                      <div style={{ flex: 2 }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>{selectedInvoice.bike_name}</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Premium Motorcycle Rental</p>
                      </div>
                      <div style={{ flex: 1.5, textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                        {selectedInvoice.booking_date} <br/> to <br/> {selectedInvoice.return_date || selectedInvoice.booking_date}
                      </div>
                      <div style={{ flex: 1, textAlign: 'right', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                        ₹{selectedInvoice.total_price}
                      </div>
                    </div>
                  </div>

                  {/* Total Amount Section */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                    
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                        <QrCode size={40} color="#475569" />
                      </div>
                      <div>
                         <p style={{ fontFamily: 'monospace', fontSize: '24px', letterSpacing: '1px', color: '#1e293b', margin: '0 0 4px 0' }}>|||| || ||| | || ||</p>
                         <p style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '3px', margin: 0 }}>SCAN TO VERIFY</p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', margin: '0 0 8px 0', fontWeight: 800 }}>{selectedInvoice.status === 'Cancelled' ? 'Refund Processed' : 'Total Paid'}</p>
                      <h2 style={{ fontSize: '42px', fontWeight: 900, color: '#ff5e14', margin: 0 }}>₹{selectedInvoice.total_price}</h2>
                    </div>

                  </div>

                  {/* Footer Terms */}
                  <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '24px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 600 }}>Thank you for riding with MotorCity Premium Rentals.</p>
                    <p style={{ fontSize: '11px', color: '#cbd5e1', margin: 0 }}>Contact: support@motorcity.com | Roadside Assistance: 1800-RIDE-NOW</p>
                  </div>

                </div>
              </div>

              {/* Download Button (Outside the receipt so it doesn't print) */}
              <button 
                onClick={handleDownloadPDF} 
                style={{ width: '100%', marginTop: '20px', padding: '20px', backgroundColor: '#ff5e14', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '18px', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(255,94,20,0.3)', transition: 'transform 0.2s' }}
              >
                <Download size={22} /> Download PDF Invoice
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyBookingsPage;
