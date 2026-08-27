import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Building2,
  Key,
  Briefcase,
  UserPlus
} from 'lucide-react';
import { ShineteckLogo } from '../components/common/ShineteckLogo.jsx';

export function LoginPage({ onNavigateRegister, onNavigateForgotPassword }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeRoleTab, setActiveRoleTab] = useState('employee'); // 'employee' | 'admin'

  const canvasRef = useRef(null);

  // Quick fill handler for demo
  const handleQuickFill = (role) => {
    setActiveRoleTab(role);
    if (role === 'admin') {
      setIdentifier('admin@shinetek.com');
      setPassword('Admin@1234');
    } else {
      setIdentifier('SH-2005');
      setPassword('Password@123');
    }
    setErrorMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter your Corporate Email or Employee ID and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials. Please verify your corporate login details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 60fps Alive Interactive Canvas Engine calibrated for White/Light Theme
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = Math.min(Math.floor((width * height) / 16000), 75);
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.8 + 1,
        color: Math.random() > 0.4 ? 'rgba(37, 99, 235,' : (Math.random() > 0.6 ? 'rgba(226, 122, 63,' : 'rgba(100, 116, 139,'),
        alpha: Math.random() * 0.4 + 0.15,
        pulseSpeed: Math.random() * 0.015 + 0.005,
        pulseVal: Math.random() * Math.PI
      });
    }

    // Shooting particle streaks (light themed)
    const sparksArray = [];
    const createSparkStreak = () => {
      if (sparksArray.length < 3 && Math.random() < 0.03) {
        const side = Math.floor(Math.random() * 4);
        let sx, sy;
        const centerX = width / 2;
        const centerY = height / 2;

        if (side === 0) { sx = Math.random() * width; sy = 0; }
        else if (side === 1) { sx = width; sy = Math.random() * height; }
        else if (side === 2) { sx = Math.random() * width; sy = height; }
        else { sx = 0; sy = Math.random() * height; }

        const tx = centerX + (Math.random() - 0.5) * 300;
        const ty = centerY + (Math.random() - 0.5) * 300;

        const angle = Math.atan2(ty - sy, tx - sx);
        const speed = Math.random() * 2.2 + 1.5;

        sparksArray.push({
          x: sx,
          y: sy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          length: Math.random() * 16 + 8,
          color: Math.random() > 0.5 ? 'rgba(37, 99, 235, 0.4)' : 'rgba(226, 122, 63, 0.4)',
          alpha: 0.7,
          decay: Math.random() * 0.012 + 0.008
        });
      }
    };

    // Mouse reactivity
    let mouse = { x: width / 2, y: height / 2, active: false };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const handleMouseLeave = () => {
      mouse.active = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Clean Light background gradient
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, Math.max(width, height) * 0.8);
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(0.45, '#f8fafc');
      bgGrad.addColorStop(0.85, '#f1f5f9');
      bgGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle soft ambient flare behind card
      const centerGlow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 400);
      centerGlow.addColorStop(0, 'rgba(37, 99, 235, 0.06)');
      centerGlow.addColorStop(0.5, 'rgba(226, 122, 63, 0.03)');
      centerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      // Light particle streaks
      createSparkStreak();
      for (let i = sparksArray.length - 1; i >= 0; i--) {
        const s = sparksArray[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparksArray.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * (s.length / 4), s.y - s.vy * (s.length / 4));
        ctx.stroke();
        ctx.restore();
      }

      // Constellation network
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const lineAlpha = (1 - dist / 120) * 0.12;
            ctx.strokeStyle = `rgba(100, 116, 139, ${lineAlpha})`;
            ctx.lineWidth = 0.65;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.pulseVal += p.pulseSpeed;
        const currentAlpha = p.alpha + Math.sin(p.pulseVal) * 0.12;

        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 130) {
            const force = (1 - mdist / 130) * 1.2;
            p.x += (mdx / mdist) * force;
            p.y += (mdy / mdist) * force;
          }
        }

        ctx.save();
        ctx.fillStyle = `${p.color} ${Math.max(0.08, currentAlpha)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden selection:bg-blue-600 selection:text-white bg-slate-50">
      {/* 60fps Alive Interactive Canvas Engine (Light Themed) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-auto"
      />

      {/* Subtle depth lighting for light mode */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* ── Main Executive Centered White Double-Bezel Card ─────────────────────────── */}
      <div className="relative z-20 w-full max-w-[460px] my-auto">
        {/* Outer Bezel Wrapper */}
        <div className="rounded-2xl p-1 bg-slate-100/90 border border-slate-200/80 shadow-2xl shadow-slate-200/80">
          {/* Inner White Card Core */}
          <div className="relative bg-white rounded-xl p-6 sm:p-8 border border-slate-200/70 space-y-6">
            
            {/* Top Corporate Branding & Title */}
            <div className="flex flex-col items-center text-center space-y-2.5">
              <ShineteckLogo size="md" />
              
              <div className="pt-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                  Corporate Portal Sign In
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Single Sign-On (SSO) & Workforce Governance
                </p>
              </div>
            </div>

            {/* High-End Segmented Role Control */}
            <div className="p-1 bg-slate-100/80 border border-slate-200 rounded-xl grid grid-cols-2 gap-1 text-xs font-semibold font-display">
              <button
                type="button"
                onClick={() => {
                  setActiveRoleTab('employee');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeRoleTab === 'employee'
                    ? 'bg-[#0f2b48] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Employee Portal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveRoleTab('admin');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeRoleTab === 'admin'
                    ? 'bg-[#0f2b48] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Suite</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier Input */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase tracking-wider font-display text-[11px]">
                    Corporate Email / Employee ID
                  </label>
                  {activeRoleTab === 'employee' && (
                    <span className="text-[10.5px] text-blue-600 font-mono font-semibold">e.g. SH-2005</span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={activeRoleTab === 'admin' ? 'admin@shinetek.com' : 'e.g. j.vance@shinetek.com or SH-2005'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-medium bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-600/12 focus:border-blue-600 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase tracking-wider font-display text-[11px]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={onNavigateForgotPassword}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your security password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs font-medium bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-600/12 focus:border-blue-600 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#0f2b48] hover:bg-[#1a416b] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98 mt-2"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* 1-Click Demo Quick Fill */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-bold uppercase tracking-wider font-display">
                <span>Quick Demo Credentials</span>
                <span className="text-slate-400 font-normal">Click to fill</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('employee')}
                  className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Employee Fill</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('admin')}
                  className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admin Fill</span>
                </button>
              </div>
            </div>

            {/* Onboarding Registration Link */}
            <div className="pt-2 text-center text-xs text-slate-500">
              New consultant joining Shineteck?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="text-blue-600 hover:text-blue-800 font-bold underline transition-colors cursor-pointer"
              >
                Start Onboarding Registration
              </button>
            </div>

            {/* Bottom Security Compliance Strip */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-status-pulse" />
                256-Bit TLS Encryption
              </span>
              <span>SOC-2 Certified</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
