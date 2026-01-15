
import { useEffect } from 'react';

// Premium Pulsing Loader Component
function Loader() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#0f0f0f', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      {/* Pulsing Clivon Style Logo */}
      <div style={{
        width: '80px', height: '80px', background: '#FF0000',
        borderRadius: '50%', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 20px rgba(255,0,0,0.4)',
        animation: 'pulse 1.5s infinite ease-in-out'
      }}>
        {/* Play Icon */}
        <div style={{
          width: 0, height: 0,
          borderTop: '15px solid transparent',
          borderBottom: '15px solid transparent',
          borderLeft: '26px solid white',
          marginLeft: '8px'
        }} />
      </div>

      <p style={{
        marginTop: '30px', fontFamily: 'sans-serif', color: '#fff',
        fontSize: '16px', letterSpacing: '1.5px', opacity: 0.8,
        fontWeight: 300
      }}>
        YOUTUBE DESKTOP
      </p>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(255, 0, 0, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
        }
      `}</style>
    </div>
  );
}

function App() {
  useEffect(() => {
    // 1. Minimum logo display time for branding (1.5s)
    // 2. Then redirect to YouTube
    const timer = setTimeout(() => {
      window.location.href = "https://www.youtube.com";
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return <Loader />;

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      {/* Fallback if redirect is slow */}
    </div>
  );
}

export default App;
