import { Link } from 'react-router'

function Footer() {
  return (
    <footer className="site-footer">
      <span>&copy; {new Date().getFullYear()} QR Generator</span>
      <div className="footer-links">
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/terms">Terms of Service</Link>
      </div>
    </footer>
  )
}

export default Footer
