import React, { useState } from 'react'
import api from '../services/api'

const VietQRModal = ({ show, fine, onClose, onSuccess }) => {
  const [copiedField, setCopiedField] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  if (!show || !fine) return null

  const isPaid = fine.status === 'PAID'
  const isPending = fine.status === 'PENDING'
  const bankName = 'MB Bank (Military Commercial Bank)'
  const accountNumber = '0123456789'
  const accountHolder = 'THU VIEN UET'
  const transferContent = `NOP PHAT LOAN ${fine.bookLoanId}`
  const qrUrl = `https://img.vietqr.io/image/MB-${accountNumber}-compact2.png?amount=${Math.round(fine.fineAmount || 0)}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountHolder)}`

  const handleCopy = (text, fieldName) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const handleSubmitPayment = async () => {
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const response = await api.post(`/api/fines/${fine.id}/submit-payment`)
      setSubmitted(true)
      if (onSuccess) {
        onSuccess(response.data)
      }
    } catch (err) {
      console.error('Failed to submit payment:', err)
      setErrorMsg(err.response?.data?.message || 'An error occurred while submitting payment request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSubmitted(false)
    setErrorMsg(null)
    onClose()
  }

  const renderCopyButton = (text, fieldName) => {
    const isCopied = copiedField === fieldName
    return (
      <button
        onClick={() => handleCopy(text, fieldName)}
        title={isCopied ? 'Copied' : 'Copy'}
        style={{
          background: 'none',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '0.3rem 0.45rem',
          color: isCopied ? '#10b981' : 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease'
        }}
      >
        {isCopied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        )}
      </button>
    )
  }

  return (
    <div className="fx-modal-overlay" onClick={handleClose}>
      <div
        className="fx-modal-card"
        style={{ maxWidth: '620px', padding: '0', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-tertiary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>{isPaid ? '🧾' : '💳'}</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isPaid ? 'Library Fine Receipt' : (isPending ? 'Fine Payment Transfer Info' : 'Pay Library Fine via VietQR')}
            </h3>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem 1.75rem', maxHeight: '78vh', overflowY: 'auto' }}>
          {isPaid ? (
            /* PAID VIEW */
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                margin: '0 auto 1.25rem auto'
              }}>
                ✓
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                Fine Paid Successfully
              </h2>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 auto 1.5rem auto', maxWidth: '460px' }}>
                The fine for book <strong>"{fine.bookTitle}"</strong> has been paid and verified.
              </p>

              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                border: '1.5px solid var(--border-color)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Loan ID:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>#{fine.bookLoanId}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Overdue Days:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{fine.overdueDays} days</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(fine.fineAmount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Date Recorded:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatDate(fine.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>Paid</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="fx-btn-borrow-off"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                Close
              </button>
            </div>
          ) : (submitted || isPending) ? (
            /* PENDING VIEW */
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                margin: '0 auto 1.25rem auto'
              }}>
                ⏳
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                {submitted ? 'Fine Payment Request Submitted!' : 'Payment Pending Approval'}
              </h2>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 auto 1.5rem auto', maxWidth: '460px' }}>
                The fine payment request for book <strong>"{fine.bookTitle}"</strong> is <span style={{ color: '#f59e0b', fontWeight: 600 }}>Pending Approval</span>.
                The librarian will verify the account balance and confirm shortly.
              </p>

              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '1.25rem 1rem',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0.5rem',
                border: '1.5px solid var(--border-color)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                textAlign: 'center'
              }}>
                <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Loan ID</span>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontFamily: 'monospace' }}>#{fine.bookLoanId}</strong>
                </div>
                <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Fine Amount</span>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{formatCurrency(fine.fineAmount)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Status</span>
                  <strong style={{ color: '#d97706', fontSize: '0.95rem' }}>Pending Approval</strong>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="fx-btn-borrow-off"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                Close
              </button>
            </div>
          ) : (
            /* UNPAID QR VIEW */
            <div>
              {errorMsg && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--color-danger)',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  border: '1px solid rgba(239, 68, 68, 0.25)'
                }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Book Info Summary */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)',
                padding: '0.9rem 1.25rem',
                borderRadius: '12px',
                border: '1.5px solid var(--border-color)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Overdue Book</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{fine.bookTitle}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                    Overdue by {fine.overdueDays} days (Loan #{fine.bookLoanId})
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fine Amount</span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{formatCurrency(fine.fineAmount)}</strong>
                </div>
              </div>

              {/* QR Image Box */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-secondary)',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1.5px solid var(--border-color)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                marginBottom: '1.25rem'
              }}>
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '8px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <img
                    src={qrUrl}
                    alt="VietQR Code"
                    style={{ width: '210px', height: '210px', objectFit: 'contain', display: 'block' }}
                  />
                </div>
              </div>

              {/* Bank Details Table with Copy Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-secondary)',
                padding: '1.1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Bank:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{bankName}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Account Number:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '1rem' }}>{accountNumber}</strong>
                    {renderCopyButton(accountNumber, 'acc')}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Account Holder:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{accountHolder}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(fine.fineAmount)}</strong>
                    {renderCopyButton(String(Math.round(fine.fineAmount || 0)), 'amount')}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Transfer Reference:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                      {transferContent}
                    </strong>
                    {renderCopyButton(transferContent, 'content')}
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleClose}
                  className="fx-btn-ebook"
                  style={{ padding: '0.65rem 1.25rem' }}
                  disabled={isSubmitting}
                >
                  Close
                </button>
                <button
                  onClick={handleSubmitPayment}
                  className="fx-btn-borrow-off"
                  style={{ padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? '⏳' : '✓'}</span>
                  {isSubmitting ? 'Submitting...' : 'I Have Transferred'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VietQRModal
