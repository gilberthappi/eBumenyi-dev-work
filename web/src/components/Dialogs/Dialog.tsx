import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function Dialog({ isOpen, onClose, children, className = '' }) {
  const dialogRef = useRef(null)
  const [show, setShow] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setShow(true)
      if (dialogRef.current) dialogRef.current.showModal()
    } else {
      if (dialogRef.current) dialogRef.current.close()
      // Delay hiding after animation (300ms)
      setTimeout(() => setShow(false), 300)
    }
  }, [isOpen])

  const handleCancel = (e) => {
    e.preventDefault()
    onClose()
  }

  const handleClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  if (!show) return null

  return createPortal(
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleClick}
      className={`fixed inset-0 m-0 w-full h-screen bg-transparent flex items-center justify-center
        ${
          isOpen
            ? 'animate-dialogOpen opacity-100 scale-100'
            : 'opacity-0 scale-90 pointer-events-none'
        } 
        ${className}`}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-85
          ${isOpen ? 'animate-backdropOpen opacity-85' : 'opacity-0 pointer-events-none'}
        `}
        aria-hidden="true"
      ></div>

      {/* Dialog content container */}
      <div className="relative z-10">{children}</div>
    </dialog>,
    document.body
  )
}

export default Dialog
