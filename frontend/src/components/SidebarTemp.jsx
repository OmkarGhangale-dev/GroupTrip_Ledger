function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">GT</div>

        <div>
          <h2>GroupTrip</h2>
          <span>Ledger</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-title">MAIN</p>

        <button className="nav-item active">
          <span>▣</span>
          <span>Dashboard</span>
        </button>

        <button className="nav-item">
          <span>👥</span>
          <span>Participants</span>
        </button>

        <button className="nav-item">
          <span>🧾</span>
          <span>Expenses</span>
        </button>

        <button className="nav-item">
          <span>📅</span>
          <span>Bookings</span>
        </button>

        <p className="nav-title">MONEY</p>

        <button className="nav-item">
          <span>💳</span>
          <span>Payments</span>
        </button>

        <button className="nav-item">
          <span>💰</span>
          <span>Settlements</span>
        </button>

        <p className="nav-title">TRIP</p>

        <button className="nav-item">
          <span>📍</span>
          <span>Itinerary</span>
        </button>

        <button className="nav-item">
          <span>⚙</span>
          <span>Settings</span>
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;