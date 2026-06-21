function Header() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "16px 0",
        marginBottom: 24,
        borderBottom: "1px solid #1e293b",
      }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          fill="#2563eb"
        />
        <circle cx="12" cy="9" r="2.5" fill="white" />
      </svg>
      <span style={{ fontSize: 19, fontWeight: 700, color: "white", letterSpacing: 0.3 }}>
        Last Seen
      </span>
    </div>
  );
}

export default Header;